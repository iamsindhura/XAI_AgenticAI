/**
 * Array comparison utilities for calculating matches on tags, skills, and interests.
 */

/**
 * Calculates Jaccard Similarity (Intersection over Union) of two string arrays.
 * Returns a value between 0.0 and 1.0.
 */
export function jaccardSimilarity(arr1: string[], arr2: string[]): number {
  const set1 = new Set(arr1.map((s) => s.toLowerCase().trim()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase().trim()));

  if (set1.size === 0 && set2.size === 0) return 1.0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculates how much of the target array is covered by the source array (Inclusion Ratio).
 * Returns a value between 0.0 and 1.0. Useful for checking skill gaps.
 */
export function inclusionRatio(
  targetArr: string[],
  sourceArr: string[]
): number {
  if (targetArr.length === 0) return 1.0; // All targets covered if no targets specified

  const sourceSet = new Set(sourceArr.map((s) => s.toLowerCase().trim()));
  const matches = targetArr.filter((x) => sourceSet.has(x.toLowerCase().trim()));

  return matches.length / targetArr.length;
}

/**
 * Returns the intersection count (number of shared elements) between two arrays.
 */
export function intersectionCount(arr1: string[], arr2: string[]): number {
  const set2 = new Set(arr2.map((s) => s.toLowerCase().trim()));
  return arr1.filter((x) => set2.has(x.toLowerCase().trim())).length;
}
