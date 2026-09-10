/** Canonical display order for metal options across the app */
export const METAL_ORDER = [
  "18k Gold",
  "14k Gold",
  "10k Gold",
  "Gold-Plated Silver",
] as const;

/**
 * Sort an array of metal options into the canonical display order.
 * Unknown metal types are placed at the end.
 */
export function sortMetalOptions<T extends { metalType: string; price?: number; priceAdjustment?: number }>(
  options: T[],
): T[] {
  return [...options].sort((a, b) => {
    const aIdx = METAL_ORDER.indexOf(a.metalType as (typeof METAL_ORDER)[number]);
    const bIdx = METAL_ORDER.indexOf(b.metalType as (typeof METAL_ORDER)[number]);
    const aRank = aIdx >= 0 ? aIdx : METAL_ORDER.length;
    const bRank = bIdx >= 0 ? bIdx : METAL_ORDER.length;
    return aRank - bRank;
  });
}

export function getMetalPrice(
  option: { price?: number; priceAdjustment?: number } | undefined,
  basePrice: number,
) {
  return option?.price ?? basePrice + (option?.priceAdjustment ?? 0);
}
