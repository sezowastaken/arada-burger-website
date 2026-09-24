import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { orderAddresses, orderItems, orderPayments, orderStatusHistory, orders } from "../db/schema.js";
import { ORDER_STATUSES } from "../orders/statuses.js";

// No adjacency is enforced on the PATCH below (nothing stops PREPARING →
// DELIVERED directly): the kitchen may need to skip a step the UI modeled,
// and a hard state machine that occasionally has to be overridden anyway is
// worse than one that trusts the person running the shift.

function formatOrderNumber(id: number): string {
  return `AB-${id}`;
}

export async function adminOrdersRoutes(app: FastifyInstance) {
  // NOTE: intentionally unauthenticated for now — auth is added in a later phase.

  app.get("/orders", async () => {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));

    return {
      orders: rows.map((order) => ({
        id: order.id,
        orderNumber: formatOrderNumber(order.id),
        source: order.source,
        status: order.status,
        customerName: order.customerName,
        total: Number(order.total),
        createdAt: order.createdAt.toISOString(),
      })),
    };
  });

  app.get<{ Params: { id: number } }>(
    "/orders/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
      if (!order) {
        return reply.code(404).send({ error: `Order ${id} not found` });
      }

      const [items, address, payments, statusHistory] = await Promise.all([
        db.select().from(orderItems).where(eq(orderItems.orderId, id)),
        db.query.orderAddresses.findFirst({ where: eq(orderAddresses.orderId, id) }),
        db.select().from(orderPayments).where(eq(orderPayments.orderId, id)).orderBy(desc(orderPayments.createdAt)),
        db
          .select()
          .from(orderStatusHistory)
          .where(eq(orderStatusHistory.orderId, id))
          .orderBy(desc(orderStatusHistory.changedAt)),
      ]);

      return {
        id: order.id,
        orderNumber: formatOrderNumber(order.id),
        token: order.publicToken,
        source: order.source,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerNote: order.customerNote,
        address: address
          ? { city: address.city, district: address.district, addressLine: address.addressLine, deliveryNote: address.deliveryNote }
          : null,
        items: items.map((item) => ({
          name: { tr: item.nameTr, en: item.nameEn },
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
        })),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        discount: Number(order.discount),
        total: Number(order.total),
        payments: payments.map((payment) => ({
          provider: payment.provider,
          providerPaymentId: payment.providerPaymentId,
          status: payment.status,
          amount: Number(payment.amount),
          createdAt: payment.createdAt.toISOString(),
        })),
        statusHistory: statusHistory.map((entry) => ({
          status: entry.status,
          note: entry.note,
          changedAt: entry.changedAt.toISOString(),
        })),
        createdAt: order.createdAt.toISOString(),
      };
    },
  );

  app.patch<{ Params: { id: number }; Body: { status: (typeof ORDER_STATUSES)[number]; note?: string } }>(
    "/orders/:id/status",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
        body: {
          type: "object",
          required: ["status"],
          additionalProperties: false,
          properties: {
            status: { type: "string", enum: ORDER_STATUSES },
            note: { type: "string", maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { status, note } = request.body;

      const [updated] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: `Order ${id} not found` });
      }

      await db.insert(orderStatusHistory).values({ orderId: id, status, note: note?.trim() || undefined });

      return { id: updated.id, status: updated.status };
    },
  );
}
