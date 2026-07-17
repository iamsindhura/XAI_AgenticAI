/**
 * Structural type definitions for the Decision Engine computations, traces, and audits.
 */

/**
 * A single evaluation item tracing how a scoring criterion contributed to the final outcome.
 */
export interface TraceItem {
  /** Name of the scoring criterion (e.g. "placementScore", "roiScore") */
  criterion: string;
  /** Allocated weight for the criterion (e.g. 0.3) */
  weight: number;
  /** Raw unnormalized value of the factor (e.g. 1500000) */
  rawValue: number | string;
  /** Normalized score between 0.0 and 1.0 */
  normalizedValue: number;
  /** Final calculated contribution (normalizedValue * weight) */
  contribution: number;
  /** Text explanation detailing the normalization or comparison rule applied */
  explanation: string;
}

/**
 * Accumulated scoring breakdown detailing baseline criteria scores and rule adjustments.
 */
export interface DecisionTrace {
  /** List of criterion trace records */
  items: TraceItem[];
  /** Final raw score generated (baseScore + rulesBonus - rulesPenalty) */
  totalScore: number;
  /** The weighted sum score before rules were processed */
  baseScore: number;
  /** Accumulated bonus score points applied by business rules */
  rulesBonus: number;
  /** Accumulated penalty score points applied by business rules */
  rulesPenalty: number;
}

/**
 * An audit stamp recording the context and parameters used to make a deterministic decision.
 */
export interface AuditRecord {
  /** Unique ID of the audit entry */
  id: string;
  /** ISO timestamp showing when the decision was executed */
  timestamp: string;
  /** Semantic version of the decision engine (e.g., "1.0.0") */
  engineVersion: string;
  /** Copy of the weights matrix utilized during this run */
  weightsUsed: Record<string, number>;
  /** History of business rules processed, detailing outcomes and impacts */
  rulesApplied: {
    ruleId: string;
    type: "BONUS" | "PENALTY";
    value: number;
    passed: boolean;
  }[];
  /** Confidence score calculated for the decision (0 to 100) */
  confidence: number;
  /** Summary description summarizing the key scoring reasons */
  traceSummary: string;
}

/**
 * Standard wrapped envelope returned for every recommended item.
 * Strictly formatted as structured JSON.
 */
export interface DecisionResult<T> {
  /** The recommended item (e.g. College, Career, Certification) */
  data: T;
  /** Deterministic score computed for the option (typically 0.0 - 100.0) */
  score: number;
  /** Confidence percentage calculated (0 - 100) */
  confidence: number;
  /** Numerical rank position in the final catalog recommendation (1-indexed) */
  ranking: number;
  /** Complete explainability trace logs */
  trace: DecisionTrace;
  /** Complete deterministic audit stamps */
  audit: AuditRecord;
}
