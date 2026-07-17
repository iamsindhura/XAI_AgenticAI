/**
 * Type defining the result of a single business rule evaluation.
 */
export interface RuleEvaluationResult {
  /** Identifier of the rule (e.g. "budget-limit-check") */
  ruleId: string;
  /** Action type of the rule when triggered */
  type: "BONUS" | "PENALTY";
  /** Numerical score points adjustment (e.g. 15 points) */
  value: number;
  /** True if the conditions of the rule were satisfied and triggered */
  passed: boolean;
}

/**
 * Functional representation of a single configurable business rule.
 */
export type BusinessRule<T> = (item: T) => RuleEvaluationResult;

/**
 * Rule evaluation engine analyzing custom hard constraint rules.
 */
export class RuleEngine {
  /**
   * Evaluates a set of business rules against a candidate item,
   * compiling adjustments and trigger history.
   * @param item The candidate item to evaluate.
   * @param rules Array of BusinessRules to execute.
   * @returns Rule triggers list and total adjustments.
   */
  public static evaluate<T>(
    item: T,
    rules: BusinessRule<T>[]
  ): {
    rulesApplied: RuleEvaluationResult[];
    bonusTotal: number;
    penaltyTotal: number;
  } {
    const rulesApplied: RuleEvaluationResult[] = [];
    let bonusTotal = 0;
    let penaltyTotal = 0;

    for (const rule of rules) {
      const outcome = rule(item);
      rulesApplied.push(outcome);

      if (outcome.passed) {
        if (outcome.type === "BONUS") {
          bonusTotal += outcome.value;
        } else {
          penaltyTotal += outcome.value;
        }
      }
    }

    return {
      rulesApplied,
      bonusTotal,
      penaltyTotal,
    };
  }
}
