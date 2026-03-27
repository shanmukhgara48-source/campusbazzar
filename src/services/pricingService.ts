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
