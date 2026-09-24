import { env } from "../config/env.js";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
  PaymentStatusResult,
  RefundResult,
} from "./types.js";

/**
 * Stands in for a real gateway until one is under contract (see
 * docs/product/roadmap.md M5) — the default provider (`PAYMENT_PROVIDER`
 * unset or "manual"), so the whole order lifecycle (checkout → "payment" →
 * webhook-equivalent → PAID → admin sees it) can be built and tested today,
 * without waiting on iyzico/PayTR sandbox access.
 *
 * "Checkout" here means immediately confirming the payment server-side and
 * redirecting straight back — the manual-confirm route in routes/checkout.ts
 * is the stand-in for what would otherwise be a provider's own hosted page.
 */
export class ManualProvider implements PaymentProvider {
  readonly name = "manual";

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const providerPaymentId = `manual-${input.orderId}-${Date.now()}`;
    const url = new URL("/api/payments/manual-confirm", env.publicApiUrl);
    url.searchParams.set("token", input.publicToken);
    url.searchParams.set("providerPaymentId", providerPaymentId);
    url.searchParams.set("callbackUrl", input.callbackUrl);

    return { checkoutUrl: url.toString(), providerPaymentId };
  }

  async verifyReturn(params: Record<string, string>): Promise<PaymentStatusResult> {
    return {
      status: "SUCCESS",
      providerPaymentId: params.providerPaymentId ?? null,
      amount: null,
      rawPayload: params,
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    return { status: "SUCCESS", providerPaymentId, amount: null, rawPayload: null };
  }

  async refund(providerPaymentId: string): Promise<RefundResult> {
    return { success: true, rawPayload: { providerPaymentId, note: "manual provider — no real money moved" } };
  }
}
