/**
 * Normalization utilities for numerical scaling.
 * Converts raw variables to a standardized 0.0 - 1.0 range.
 */

/**
 * Performs Min-Max normalization where higher raw values are better.
 * Clamps the output between 0.0 and 1.0.
 */
export function normalizeMinMax(
  val: number,
  min: number,
  max: number
): number {
  if (max <= min) return 0.5; // Avoid division by zero, return middle score
  const normalized = (val - min) / (max - min);
  return Math.max(0.0, Math.min(1.0, normalized));
}

/**
 * Performs inverse Min-Max normalization where lower values are better (e.g. Fees, NIRF rank).
 * Clamps the output between 0.0 and 1.0.
 */
export function normalizeInverseMinMax(
  val: number,
  min: number,
  max: number
): number {
  if (max <= min) return 0.5; // Avoid division by zero
  const normalized = (max - val) / (max - min);
  return Math.max(0.0, Math.min(1.0, normalized));
}
