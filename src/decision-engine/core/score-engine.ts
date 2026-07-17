import { TraceItem } from "./types";
import { TraceEngine } from "./trace-engine";

/**
 * Interface representing a standardized feature input for the scoring engine.
 */
export interface ScoringFeature {
  /** The primary unnormalized value, for log tracking (e.g. 1500000) */
  rawValue: number | string;
  /** Normalized value scaled between 0.0 and 1.0 */
  normalizedValue: number;
  /** Importance multiplier of the feature */
  weight: number;
  /** Text explanation of how the normalized value was determined */
  explanation: string;
}

/**
 * Reusable, generic scoring engine that calculates weighted sums
 * and outputs chronological TraceItems.
 */
export class ScoreEngine {
  /**
   * Evaluates feature configurations and returns the baseline score and trace items.
   * @param features Record mapping feature keys to their value/weight structures.
   * @returns An object containing the base score (0-100) and TraceItem array.
   */
  public static score(
    features: Record<string, ScoringFeature>
  ): { baseScore: number; traceItems: TraceItem[] } {
    const traceItems: TraceItem[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [criterion, feat] of Object.entries(features)) {
      const traceItem = TraceEngine.createItem(
        criterion,
        feat.weight,
        feat.rawValue,
        feat.normalizedValue,
        feat.explanation
      );
      traceItems.push(traceItem);
      weightedSum += traceItem.contribution;
      totalWeight += traceItem.weight;
    }

    const baseScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

    return {
      baseScore: Number(baseScore.toFixed(2)),
      traceItems,
    };
  }
}
