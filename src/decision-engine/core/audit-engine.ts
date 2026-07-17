import { AuditRecord } from "./types";

/**
 * Custom deterministic string hashing utility to avoid random values during auditing.
 */
export function deterministicHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to a 32-bit signed integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Log auditor generating deterministic audit records for decision outcomes.
 */
export class AuditEngine {
  /**
   * Compiles an AuditRecord deterministically.
   * Uses input value hashes to build stable audit IDs.
   */
  public static createRecord(
    recordId: string,
    weightsUsed: Record<string, number>,
    rulesApplied: AuditRecord["rulesApplied"],
    confidence: number,
    traceSummary: string,
    engineVersion: string = "1.0.0",
    timestamp: string = "2026-07-16T22:00:00.000Z" // Keep timestamp deterministic or pass it
  ): AuditRecord {
    // Generate deterministic hash string based on weights, rules, and outcomes
    const parametersString =
      JSON.stringify(weightsUsed) +
      JSON.stringify(rulesApplied) +
      confidence.toString() +
      traceSummary;
    const stableHash = deterministicHash(parametersString);

    return {
      id: `audit-${recordId}-${stableHash}`,
      timestamp,
      engineVersion,
      weightsUsed: { ...weightsUsed },
      rulesApplied: rulesApplied.map((r) => ({ ...r })),
      confidence,
      traceSummary,
    };
  }
}
