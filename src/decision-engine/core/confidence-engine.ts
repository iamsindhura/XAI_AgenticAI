/**
 * Engine calculating confidence scores for recommendations.
 */
export class ConfidenceEngine {
  /**
   * Calculates a confidence score between 0 and 100.
   * Takes into account criteria match ratios, data completeness metrics, and score variance.
   * @param normalizedValues Array of normalized scoring inputs (each 0.0 - 1.0).
   * @param dataCompletenessRatio Ratio representing filled/valid attributes in context (0.0 - 1.0).
   * @returns Confidence rating as a percentage score (0 - 100).
   */
  public static calculate(
    normalizedValues: number[],
    dataCompletenessRatio: number
  ): number {
    if (normalizedValues.length === 0) return 0;

    // 1. Criteria match ratio: proportion of attributes meeting positive thresholds (> 0.4)
    const positiveMatches = normalizedValues.filter((v) => v >= 0.4).length;
    const matchRatio = positiveMatches / normalizedValues.length;

    // 2. Score consistency: High consistency maps to lower variance across scoring features
    const mean =
      normalizedValues.reduce((sum, v) => sum + v, 0) / normalizedValues.length;
    
    const sumOfSquaredDiffs = normalizedValues.reduce(
      (sum, v) => sum + Math.pow(v - mean, 2),
      0
    );
    const variance = sumOfSquaredDiffs / normalizedValues.length;
    const standardDeviation = Math.sqrt(variance);

    // High consistency = low standard deviation
    const consistencyFactor = Math.max(0.0, 1.0 - standardDeviation);

    // 3. Weighted aggregation: Completeness (40%), Match density (40%), Consistency (20%)
    const confidencePct =
      (dataCompletenessRatio * 0.4 +
        matchRatio * 0.4 +
        consistencyFactor * 0.2) *
      100;

    return Math.max(0, Math.min(100, Number(confidencePct.toFixed(1))));
  }
}
