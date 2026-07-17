import { TraceItem, DecisionTrace } from "./types";

/**
 * Utility engine to generate structured trace logs for recommendation decisions.
 */
export class TraceEngine {
  /**
   * Compiles a single criteria score trace log.
   */
  public static createItem(
    criterion: string,
    weight: number,
    rawValue: number | string,
    normalizedValue: number,
    explanation: string
  ): TraceItem {
    return {
      criterion,
      weight,
      rawValue,
      normalizedValue,
      contribution: Number((normalizedValue * weight).toFixed(4)),
      explanation,
    };
  }

  /**
   * Aggregates multiple TraceItems into a DecisionTrace,
   * adjusting the final score based on rules bonuses and penalties.
   * Standardizes the output to a 0.0 - 100.0 scale.
   */
  public static compileTrace(
    items: TraceItem[],
    rulesBonus: number = 0,
    rulesPenalty: number = 0
  ): DecisionTrace {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const item of items) {
      weightedSum += item.contribution;
      totalWeight += item.weight;
    }

    // Normalize weighted sum if weights don't sum up to 1.0, and scale to 100.0 points
    const baseScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    
    // Final score = base score + rules adjustments (clamped between 0 and 100)
    const totalScore = Math.max(
      0.0,
      Math.min(100.0, baseScore + rulesBonus - rulesPenalty)
    );

    return {
      items,
      totalScore: Number(totalScore.toFixed(2)),
      baseScore: Number(baseScore.toFixed(2)),
      rulesBonus: Number(rulesBonus.toFixed(2)),
      rulesPenalty: Number(rulesPenalty.toFixed(2)),
    };
  }
}
