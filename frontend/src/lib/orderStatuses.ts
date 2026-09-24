/**
 * Mirrors ORDER_STATUSES in backend/src/orders/statuses.ts. The two
 * projects don't share code (see CLAUDE.md), so this list is kept in sync
 * by hand.
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
