/**
 * Weight utility for consistent gram/kg conversion across the admin UI.
 * 
 * System standard: Backend stores and returns weight in GRAMS (g).
 * Admin UI displays and accepts input in KILOGRAMS (kg).
 */

/**
 * Convert grams to kilograms for display/input
 */
export const toKg = (grams: number | null | undefined): number => {
  if (!grams) return 0;
  return grams / 1000;
};

/**
 * Convert kilograms to grams for API submission
 */
export const toGrams = (kg: number): number => {
  if (!kg) return 0;
  return Math.round(kg * 1000);
};

/**
 * Format weight in grams to human-readable kg string
 */
export const formatWeight = (grams: number | null | undefined): string => {
  if (!grams) return 'N/A';
  return `${toKg(grams).toFixed(2)} kg`;
};
