/**
 * Provider-agnostic payment interface — see docs/product/roadmap.md M5.
 * Arada owns the order; a payment provider is an adapter plugged in behind
 * this interface, never something the checkout/order code names directly.
 *
 * Shaped around iyzico's Checkout Form on purpose (the superset of the two
 * providers researched — see roadmap M5): it needs far more buyer/address
 * detail than PayTR does, so collecting that detail at checkout now means a
 * PayTR adapter later only has to ignore fields it doesn't need, not add new
 * ones to the checkout form.
 */

export interface CheckoutBasketItem {
  /** Our own order_items.id (or productId) as a string — the provider's basket item id, not a display concern. */
  id: string;
  name: string;
  category: string;
  /** Decimal TRY, e.g. 12.5 — each provider adapter formats this into its own wire format. */
  price: number;
}

export interface CreateCheckoutInput {
  /** Our internal order id, for logs/reconciliation — never sent to the provider as-is if it would leak sequence info. */
  orderId: number;
  /** Unguessable — safe to use as the provider's own conversation/order reference. */
  publicToken: string;
  /** Order total, decimal TRY. Must equal the sum of basketItems[].price. */
  amount: number;
  basketItems: CheckoutBasketItem[];
  buyer: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    /** Customer's IP, required by iyzico's buyer object. */
    ip: string;
  };
  address: {
    city: string;
    district: string;
    addressLine: string;
  };
  /** Where the provider sends the customer's browser back to after paying. */
  callbackUrl: string;
}

export interface CreateCheckoutResult {
  /** Redirect the customer's browser here to pay. */
  checkoutUrl: string;
  /** The provider's own reference for this attempt, when it returns one immediately. */
  providerPaymentId: string | null;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentStatusResult {
  status: PaymentStatus;
  providerPaymentId: string | null;
  /** Decimal TRY actually collected, when the provider reports it. */
  amount: number | null;
  /** The provider's raw response, stored as-is on order_payments.raw_payload for audit/support. */
  rawPayload: unknown;
}

export interface RefundResult {
  success: boolean;
  rawPayload: unknown;
}

export interface PaymentProvider {
  readonly name: string;

  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;

  /**
   * Called from the checkout-return route with whatever the provider's
   * redirect handed back (for iyzico: just a `token`). Returns the
   * *authoritative* status — the redirect itself is never trusted, only
   * this verified result is. Implementations must re-fetch from the
   * provider's own API rather than trusting the redirect payload.
   */
  verifyReturn(params: Record<string, string>): Promise<PaymentStatusResult>;

  /** Same authoritative check, keyed by a stored providerPaymentId — used for reconciliation / manual re-checks from the admin panel. */
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult>;

  refund(providerPaymentId: string, amount?: number): Promise<RefundResult>;
}
