/**
 * Pure pricing utilities — no Firestore, no side effects.
 *
 * Fee tiers (applied to the item price after any negotiation):
 *   price < ₹200   → 10%
 *   ₹200–₹1000     →  7%
 *   price > ₹1000  →  5%
 *
 * GST = 18% of platform fee.
 * Minimum platform fee = ₹5.
 * All rupee values are rounded to the nearest whole rupee.
 */

// ─── Deal ─────────────────────────────────────────────────────────────────────

/**
 * A Deal is the single source of truth for a negotiated price between a buyer
 * and a seller. It is derived from the `offers` table on the backend.
 *
 * Status semantics:
 *   pending   → offer submitted, awaiting seller response
 *   accepted  → seller accepted → finalPrice = offeredPrice
 *   declined  → seller declined → fall back to listing.price
 *   countered → seller countered with a different price
 *
 * Only an accepted deal with a non-null finalPrice ever changes what the buyer
 * is charged. All other statuses leave the price at listing.price.
 */
export interface Deal {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  /** The original listing asking price — never mutated. */
  originalPrice: number;
  /** The price the buyer offered. */
  offeredPrice?: number;
  /** Set to offeredPrice only when status === 'accepted'. */
  finalPrice?: number;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  /** Unix ms timestamp of the last status change. */
  updatedAt: number;
}

/**
 * The single pricing resolver used everywhere in the app.
 *
 * Rules:
 *   - Accepted deal with finalPrice → use finalPrice (the negotiated amount).
 *   - Everything else (no deal, pending, declined, countered) → use listing.price.
 *
 * The backend enforces the same logic independently — the frontend value is for
 * display only and is verified server-side before any order is created.
 */
export function resolvePrice(
  deal: Deal | null | undefined,
  listing: { price: number },
): number {
  if (deal && deal.status === 'accepted' && deal.finalPrice) {
    return deal.finalPrice;
  }
  return listing.price;
}

// ─── Fee calculation ──────────────────────────────────────────────────────────

export interface PriceBreakdown {
  itemPrice:   number;
  feePercent:  number;   // e.g. 0.07
  platformFee: number;   // rounded, ≥ 5
  gst:         number;   // 18% of platformFee, rounded
  total:       number;   // itemPrice + platformFee + gst
}

export function calculateFees(itemPrice: number): PriceBreakdown {
  const feePercent =
    itemPrice < 200  ? 0.10 :
    itemPrice <= 1000 ? 0.07 :
                       0.05;

  const platformFee = Math.max(5, Math.round(itemPrice * feePercent));
  const gst         = Math.round(platformFee * 0.18);
  const total       = itemPrice + platformFee + gst;

  return { itemPrice, feePercent, platformFee, gst, total };
}

/** Convenience — just the total charged to the buyer. */
export function totalPayable(itemPrice: number): number {
  return calculateFees(itemPrice).total;
}
