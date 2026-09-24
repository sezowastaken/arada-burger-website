/**
 * The full order lifecycle — order and payment states interleaved, matching
 * docs/product/roadmap.md M5. Shared between routes/checkout.ts (which only
 * ever writes PENDING_PAYMENT, PAID and PAYMENT_FAILED) and
 * routes/adminOrders.ts (which can set any of them from the admin panel) so
 * there is exactly one definition of what a valid status is.
 */
export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "ON_THE_WAY",
  "DELIVERED",
  "PAYMENT_FAILED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
