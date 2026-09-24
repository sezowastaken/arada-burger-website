import { env } from "../config/env.js";
import { IyzicoProvider } from "./IyzicoProvider.js";
import { ManualProvider } from "./ManualProvider.js";
import type { PaymentProvider } from "./types.js";

export type { PaymentProvider } from "./types.js";

/**
 * Built once and reused — a provider instance holds no per-request state,
 * and constructing IyzicoProvider does a credentials check that should only
 * ever run (and only ever fail) once, at startup, not on every checkout.
 */
let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  switch (env.paymentProvider) {
    case "iyzico":
      cached = new IyzicoProvider();
      break;
    case "manual":
      cached = new ManualProvider();
      break;
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${env.paymentProvider}`);
  }

  return cached;
}
