/**
 * Mirrors INVENTORY_UNITS in backend/src/routes/adminInventory.ts. The two
 * projects don't share code (see CLAUDE.md), so this list is kept in sync by
 * hand — a fixed set rather than free text, so a typo'd unit ("Kg" vs "kg")
 * can never silently split one ingredient's stock across two rows that never
 * sum together.
 */
export const INVENTORY_UNITS = ["kg", "gram", "litre", "adet", "dilim", "paket"] as const;

export type InventoryUnit = (typeof INVENTORY_UNITS)[number];
