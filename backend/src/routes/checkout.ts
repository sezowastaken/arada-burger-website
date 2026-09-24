import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/client.js";
import {
  orderAddresses,
  orderItems,
  orderPayments,
  orderStatusHistory,
  orders,
  products,
  storeSettings,
} from "../db/schema.js";
import { getPaymentProvider } from "../payments/index.js";

interface CheckoutItemInput {
  slug: string;
  quantity: number;
}

interface CheckoutBody {
  lang: "tr" | "en";
  items: CheckoutItemInput[];
  customer: { name: string; phone: string; email?: string };
  address: { district: string; addressLine: string; deliveryNote?: string };
}

function generatePublicToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

function formatOrderNumber(id: number): string {
  return `AB-${id}`;
}

async function serializeOrder(orderId: number) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return null;

  const [items, address] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.query.orderAddresses.findFirst({ where: eq(orderAddresses.orderId, orderId) }),
  ]);

  return {
    orderNumber: formatOrderNumber(order.id),
    token: order.publicToken,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: address
      ? { city: address.city, district: address.district, addressLine: address.addressLine, deliveryNote: address.deliveryNote }
      : null,
    items: items.map((item) => ({
      productSlug: null, // not stored — see order_items schema note; name/price are the snapshot that matters here
      name: { tr: item.nameTr, en: item.nameEn },
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
    })),
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
  };
}

/**
 * Moves an order from PENDING_PAYMENT to its verified outcome. The single
 * place this happens, called from the frontend's payment-return handler
 * regardless of which provider was used — so ManualProvider and a real
 * provider both flow through the exact same transition logic, and there is
 * only one place that could get "mark this order paid" wrong.
 */
async function confirmPayment(token: string, returnParams: Record<string, string>) {
  const order = await db.query.orders.findFirst({ where: eq(orders.publicToken, token) });
  if (!order) {
    return { error: `No order found for token` as const };
  }

  // Idempotent: a customer refreshing /payment/return, or a provider
  // redirecting the browser back twice, must not double-process.
  if (order.status !== "PENDING_PAYMENT") {
    return { status: order.status };
  }

  const provider = getPaymentProvider();
  const result = await provider.verifyReturn(returnParams);

  const newStatus = result.status === "SUCCESS" ? "PAID" : "PAYMENT_FAILED";

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: newStatus, updatedAt: new Date() }).where(eq(orders.id, order.id));

    await tx.insert(orderStatusHistory).values({ orderId: order.id, status: newStatus });

    const existingPayment = await tx.query.orderPayments.findFirst({
      where: and(eq(orderPayments.orderId, order.id), eq(orderPayments.provider, provider.name)),
    });

    const paymentUpdate = {
      status: result.status === "SUCCESS" ? "SUCCESS" : "FAILED",
      providerPaymentId: result.providerPaymentId,
      rawPayload: JSON.stringify(result.rawPayload),
      updatedAt: new Date(),
    } as const;

    if (existingPayment) {
      await tx.update(orderPayments).set(paymentUpdate).where(eq(orderPayments.id, existingPayment.id));
    } else {
      await tx.insert(orderPayments).values({
        orderId: order.id,
        provider: provider.name,
        amount: order.total,
        ...paymentUpdate,
      });
    }
  });

  return { status: newStatus };
}

export async function checkoutRoutes(app: FastifyInstance) {
  // Public and outside /api/admin on purpose: the cart/checkout pages need
  // the delivery fee, minimum order and accepting-orders flag before auth
  // ever lands on the admin API (M7) — this must keep working once it does.
  app.get("/store-settings", async () => {
    const settings = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 1) });
    return {
      deliveryFee: settings ? Number(settings.deliveryFee) : 50,
      minOrderAmount: settings ? Number(settings.minOrderAmount) : 350,
      acceptingOrders: settings?.acceptingOrders ?? true,
    };
  });

  app.post<{ Body: CheckoutBody }>(
    "/checkout",
    {
      schema: {
        body: {
          type: "object",
          required: ["lang", "items", "customer", "address"],
          additionalProperties: false,
          properties: {
            lang: { type: "string", enum: ["tr", "en"] },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["slug", "quantity"],
                additionalProperties: false,
                properties: {
                  slug: { type: "string", minLength: 1 },
                  quantity: { type: "integer", minimum: 1, maximum: 50 },
                },
              },
            },
            customer: {
              type: "object",
              required: ["name", "phone"],
              additionalProperties: false,
              properties: {
                name: { type: "string", minLength: 1, maxLength: 200 },
                phone: { type: "string", minLength: 1, maxLength: 30 },
                email: { type: "string", maxLength: 200 },
              },
            },
            address: {
              type: "object",
              required: ["district", "addressLine"],
              additionalProperties: false,
              properties: {
                district: { type: "string", minLength: 1, maxLength: 200 },
                addressLine: { type: "string", minLength: 1, maxLength: 500 },
                deliveryNote: { type: "string", maxLength: 500 },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body;

      const settings = await db.query.storeSettings.findFirst({ where: eq(storeSettings.id, 1) });
      if (!settings || !settings.acceptingOrders) {
        return reply.code(400).send({ error: "The store is not accepting online orders right now" });
      }

      // Prices, availability and existence are re-read from the database —
      // a client-supplied price or a product deactivated after the cart was
      // filled must never reach the order.
      const dbProducts = await db.query.products.findMany({
        where: (product, { inArray }) =>
          inArray(
            product.slug,
            body.items.map((item) => item.slug),
          ),
      });
      const productBySlug = new Map(dbProducts.map((product) => [product.slug, product]));

      const lineItems: {
        productId: number;
        nameTr: string;
        nameEn: string;
        unitPrice: string;
        quantity: number;
        lineTotal: string;
      }[] = [];

      for (const item of body.items) {
        const product = productBySlug.get(item.slug);
        if (!product || !product.isActive || !product.isAvailable) {
          return reply.code(400).send({ error: `"${item.slug}" is no longer available` });
        }
        const lineTotal = Number(product.price) * item.quantity;
        lineItems.push({
          productId: product.id,
          nameTr: product.nameTr,
          nameEn: product.nameEn,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: lineTotal.toFixed(2),
        });
      }

      const subtotal = lineItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const minOrderAmount = Number(settings.minOrderAmount);
      if (subtotal < minOrderAmount) {
        return reply.code(400).send({ error: `Minimum order amount is ${minOrderAmount}` });
      }

      const deliveryFee = Number(settings.deliveryFee);
      const total = subtotal + deliveryFee;
      const publicToken = generatePublicToken();

      const created = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            publicToken,
            source: "WEBSITE",
            status: "PENDING_PAYMENT",
            customerName: body.customer.name.trim(),
            customerPhone: body.customer.phone.trim(),
            customerEmail: body.customer.email?.trim() || null,
            subtotal: subtotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            discount: "0",
            total: total.toFixed(2),
            customerNote: body.address.deliveryNote?.trim() || null,
          })
          .returning();

        await tx.insert(orderItems).values(lineItems.map((item) => ({ orderId: order.id, ...item })));

        await tx.insert(orderAddresses).values({
          orderId: order.id,
          district: body.address.district.trim(),
          addressLine: body.address.addressLine.trim(),
          deliveryNote: body.address.deliveryNote?.trim() || null,
        });

        await tx.insert(orderStatusHistory).values({ orderId: order.id, status: "PENDING_PAYMENT" });

        return order;
      });

      const provider = getPaymentProvider();
      // Built from PUBLIC_SITE_URL, not the request's own Origin header — a
      // payment provider redirect must always land back on our real public
      // site regardless of what a client claims its origin is.
      const returnUrl = `${env.publicSiteUrl}/${body.lang}/payment/return`;

      let checkout;
      try {
        checkout = await provider.createCheckout({
          orderId: created.id,
          publicToken,
          amount: total,
          basketItems: lineItems.map((item, index) => ({
            id: String(index + 1),
            name: body.lang === "tr" ? item.nameTr : item.nameEn,
            category: "Food",
            price: Number(item.lineTotal),
          })),
          buyer: {
            name: body.customer.name.trim(),
            surname: body.customer.name.trim(),
            email: body.customer.email?.trim() || "siparis@aradaburger.com",
            phone: body.customer.phone.trim(),
            ip: request.ip,
          },
          address: { city: "Marmaris", district: body.address.district.trim(), addressLine: body.address.addressLine.trim() },
          callbackUrl: returnUrl,
        });
      } catch (error) {
        request.log.error(error, "payment provider createCheckout failed");
        return reply.code(502).send({ error: "Could not start the payment session. Please try again." });
      }

      await db.insert(orderPayments).values({
        orderId: created.id,
        provider: provider.name,
        providerPaymentId: checkout.providerPaymentId,
        status: "PENDING",
        amount: total.toFixed(2),
      });

      return reply.code(201).send({ checkoutUrl: checkout.checkoutUrl, orderToken: publicToken });
    },
  );

  app.post<{ Body: { token: string; [key: string]: unknown } }>(
    "/payments/confirm",
    {
      schema: {
        body: {
          type: "object",
          required: ["token"],
          properties: { token: { type: "string", minLength: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { token, ...rest } = request.body;
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value === "string") params[key] = value;
      }
      params.token = token;

      const result = await confirmPayment(token, params);
      if ("error" in result) {
        return reply.code(404).send({ error: result.error });
      }
      return result;
    },
  );

  // Dev/test stand-in for a provider's hosted payment page — see
  // payments/ManualProvider.ts. Only reachable if PAYMENT_PROVIDER=manual
  // ever produced a checkoutUrl pointing here; harmless otherwise since it
  // just forwards to whatever callbackUrl the checkout call itself supplied.
  app.get<{ Querystring: { token: string; providerPaymentId: string; callbackUrl: string } }>(
    "/payments/manual-confirm",
    async (request, reply) => {
      const { token, providerPaymentId, callbackUrl } = request.query;
      const url = new URL(callbackUrl);
      url.searchParams.set("token", token);
      url.searchParams.set("providerPaymentId", providerPaymentId);
      return reply.redirect(url.toString());
    },
  );

  app.get<{ Params: { token: string } }>("/orders/:token", async (request, reply) => {
    const order = await db.query.orders.findFirst({ where: eq(orders.publicToken, request.params.token) });
    if (!order) {
      return reply.code(404).send({ error: "Order not found" });
    }
    return serializeOrder(order.id);
  });
}
