import crypto from "node:crypto";
import Iyzipay from "iyzipay";
import { env } from "../config/env.js";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundResult,
} from "./types.js";

/**
 * iyzico Checkout Form — see docs/product/roadmap.md M5 for the research
 * this is built from (request/response shape, auth, signature algorithm,
 * all pulled from iyzico's own docs and the `iyzipay` SDK source, since
 * there is no live account yet to test against). Untested against a real
 * sandbox: register at https://sandbox-merchant.iyzipay.com, set
 * IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_URI, PAYMENT_PROVIDER=iyzico,
 * then run a full checkout with one of iyzico's published test cards before
 * trusting this in production.
 *
 * Uses the official `iyzipay` npm package rather than hand-rolled REST: it
 * has no TypeScript types (see src/types/iyzipay.d.ts) and the request
 * signing (IYZWSv2) is security-sensitive enough that letting iyzico's own
 * maintained code build the signed request beats a hand-rolled HMAC no one
 * here can verify against a live account.
 */
export class IyzicoProvider implements PaymentProvider {
  readonly name = "iyzico";
  private readonly client: any;
  private readonly secretKey: string;

  constructor() {
    if (!env.iyzico.apiKey || !env.iyzico.secretKey) {
      throw new Error(
        "IYZICO_API_KEY and IYZICO_SECRET_KEY must be set to use PAYMENT_PROVIDER=iyzico",
      );
    }
    this.secretKey = env.iyzico.secretKey;
    this.client = new Iyzipay({
      apiKey: env.iyzico.apiKey,
      secretKey: env.iyzico.secretKey,
      uri: env.iyzico.uri,
    });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const price = formatIyzicoDecimal(input.amount);
    const [name, ...surnameParts] = input.buyer.name.trim().split(/\s+/);
    const surname = surnameParts.join(" ") || name;
    const fullAddress = `${input.address.addressLine}, ${input.address.district}, ${input.address.city}`;

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: input.publicToken,
      price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: input.publicToken,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: input.callbackUrl,
      buyer: {
        id: `order-${input.orderId}`,
        name,
        surname,
        // iyzico's Checkout Form requires a TCKN even for guest checkout.
        // Asking a customer for their national ID number to buy a burger is
        // bad checkout UX, so this sends the placeholder Turkish merchants
        // commonly use for guest orders — NOT documented by iyzico as
        // officially sanctioned. Confirm this is acceptable (or find the
        // right guest-checkout field) with iyzico support once there's a
        // real merchant account; this is exactly the kind of question that
        // belongs in the YepPos/payment-provider technical conversation.
        identityNumber: "11111111111",
        email: input.buyer.email,
        gsmNumber: input.buyer.phone,
        registrationAddress: fullAddress,
        ip: input.buyer.ip,
        city: input.address.city,
        country: "Turkey",
      },
      shippingAddress: {
        contactName: input.buyer.name,
        city: input.address.city,
        country: "Turkey",
        address: fullAddress,
      },
      billingAddress: {
        contactName: input.buyer.name,
        city: input.address.city,
        country: "Turkey",
        address: fullAddress,
      },
      basketItems: input.basketItems.map((item) => ({
        id: item.id,
        name: item.name,
        category1: item.category,
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: formatIyzicoDecimal(item.price),
      })),
    };

    const result = await promisify<any>((cb) => this.client.checkoutFormInitialize.create(request, cb));

    if (result.status !== "success" || !result.paymentPageUrl || !result.token) {
      throw new Error(`iyzico checkout initialize failed: ${result.errorMessage ?? result.status}`);
    }

    return { checkoutUrl: result.paymentPageUrl, providerPaymentId: result.token };
  }

  /** `params` is whatever the redirect/callback handed back — for iyzico, just a `token`. */
  async verifyReturn(params: Record<string, string>): Promise<PaymentStatusResult> {
    const token = params.token;
    if (!token) {
      throw new Error("iyzico return is missing the required token parameter");
    }
    return this.retrieveByToken(token);
  }

  /** `providerPaymentId` here is the token stored at checkout time — retrieve is keyed by token, not paymentId. */
  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    return this.retrieveByToken(providerPaymentId);
  }

  private async retrieveByToken(token: string): Promise<PaymentStatusResult> {
    const result = await promisify<any>((cb) =>
      this.client.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, cb),
    );

    if (result.status !== "success") {
      return { status: "FAILED", providerPaymentId: null, amount: null, rawPayload: result };
    }

    // iyzico signs every response so the fields can't be tampered with in
    // transit — verifying this is what makes trusting this result (rather
    // than the bare redirect) safe. Field order and the price-normalization
    // rule (trailing zeros stripped before hashing) are both load-bearing —
    // see docs/product/roadmap.md M5.
    const signatureFields = [
      result.paymentStatus,
      result.paymentId,
      result.currency,
      result.basketId,
      result.conversationId,
      normalizeIyzicoPriceForSignature(result.paidPrice),
      normalizeIyzicoPriceForSignature(result.price),
      result.token,
    ];
    if (!verifyIyzicoSignature(signatureFields, this.secretKey, result.signature)) {
      throw new Error("iyzico response signature did not verify — refusing to trust this payment result");
    }

    // fraudStatus: -1 not yet evaluated, 0 flagged, 1 clear. Not yet mapped
    // into the order state machine — worth deciding deliberately (hold for
    // manual review?) once real transactions exist, rather than guessing now.
    const status: PaymentStatusResult["status"] = result.paymentStatus === "SUCCESS" ? "SUCCESS" : "FAILED";

    return {
      status,
      // The real payment id, not the checkout token — this is what refund() needs.
      providerPaymentId: result.paymentId ?? null,
      amount: result.paidPrice !== undefined ? Number(result.paidPrice) : null,
      rawPayload: result,
    };
  }

  async refund(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    if (amount === undefined) {
      throw new Error("iyzico refund requires an amount (no separate full-refund/cancel path is wired up yet)");
    }

    const result = await promisify<any>((cb) =>
      this.client.refundV2.create(
        {
          locale: Iyzipay.LOCALE.TR,
          paymentId: providerPaymentId,
          price: formatIyzicoDecimal(amount),
        },
        cb,
      ),
    );

    return { success: result.status === "success", rawPayload: result };
  }
}

/** iyzico wants decimal amounts as strings ("5.2"), never integers or minor units. */
function formatIyzicoDecimal(amount: number): string {
  return String(Math.round(amount * 100) / 100);
}

/** Signature verification requires the same trailing-zero stripping iyzico applies before hashing ("10.50" -> "10.5", "10.0" -> "10"). */
function normalizeIyzicoPriceForSignature(price: string | number | undefined): string {
  if (price === undefined) return "";
  return String(Number(price));
}

function verifyIyzicoSignature(fields: unknown[], secretKey: string, signature: string | undefined): boolean {
  if (!signature) return false;
  const dataToCheck = fields.join(":");
  const expected = crypto.createHmac("sha256", secretKey).update(dataToCheck).digest("hex");
  // Constant-time comparison — a plain `===` on a security-critical check
  // leaks timing information about how many leading characters matched.
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}

function promisify<T>(fn: (callback: (err: unknown, result: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
