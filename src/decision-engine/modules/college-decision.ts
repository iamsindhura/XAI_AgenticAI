import { College } from "../../knowledge/schemas/college";
import { StudentProfile } from "../../knowledge/schemas/student";
import { DecisionResult } from "../core/types";
import { DEFAULT_COLLEGE_WEIGHTS } from "../core/weights";
import { ScoreEngine, ScoringFeature } from "../core/score-engine";
import { TraceEngine } from "../core/trace-engine";
import { RuleEngine, BusinessRule } from "../core/rule-engine";
import { ConfidenceEngine } from "../core/confidence-engine";
import { RankingEngine } from "../core/ranking-engine";
import { normalizeInverseMinMax } from "../utils/normalizer";
import { intersectionCount } from "../utils/comparator";
import { AuditEngine } from "../core/audit-engine";

/**
 * Executes college recommendation scoring and ranking based on student profile.
 * @param student The StudentProfile data.
 * @param colleges Array of available College records.
 * @param weights Optional weights override.
 * @returns Array of ranked DecisionResults containing college data.
 */
export function makeCollegeDecision(
  student: StudentProfile,
  colleges: College[],
  weights: Record<string, number> = DEFAULT_COLLEGE_WEIGHTS,
  timestamp?: string
): DecisionResult<College>[] {
  // Filter colleges if student profile explicitly lists available colleges, otherwise score all
  const candidates =
    student.collegesAvailable.length > 0
      ? colleges.filter((c) => student.collegesAvailable.includes(c.id))
      : colleges;

  const results: Omit<DecisionResult<College>, "ranking">[] = [];

  for (const college of candidates) {
    // 1. Prepare scoring features with normalized values
    const features: Record<string, ScoringFeature> = {
      placementScore: {
        rawValue: college.placementScore,
        normalizedValue: college.placementScore / 10.0,
        weight: weights.placementScore || 0,
        explanation: `Scaled placement rating ${college.placementScore}/10 to [0,1] range.`,
      },
      roiScore: {
        rawValue: college.roiScore,
        normalizedValue: college.roiScore / 10.0,
        weight: weights.roiScore || 0,
        explanation: `Scaled return-on-investment rating ${college.roiScore}/10.`,
      },
      codingCultureScore: {
        rawValue: college.codingCultureScore,
        normalizedValue: college.codingCultureScore / 10.0,
        weight: weights.codingCultureScore || 0,
        explanation: `Scaled coding culture rating ${college.codingCultureScore}/10.`,
      },
      researchScore: {
        rawValue: college.researchScore,
        normalizedValue: college.researchScore / 10.0,
        weight: weights.researchScore || 0,
        explanation: `Scaled research rating ${college.researchScore}/10.`,
      },
      startupCultureScore: {
        rawValue: college.startupCultureScore,
        normalizedValue: college.startupCultureScore / 10.0,
        weight: weights.startupCultureScore || 0,
        explanation: `Scaled startup culture rating ${college.startupCultureScore}/10.`,
      },
      alumniNetworkScore: {
        rawValue: college.alumniNetworkScore,
        normalizedValue: college.alumniNetworkScore / 10.0,
        weight: weights.alumniNetworkScore || 0,
        explanation: `Scaled alumni network rating ${college.alumniNetworkScore}/10.`,
      },
      nirfRank: {
        rawValue: college.nirfRank,
        normalizedValue: normalizeInverseMinMax(college.nirfRank, 1, 200),
        weight: weights.nirfRank || 0,
        explanation: `NIRF rank of ${college.nirfRank} normalized inversely (assumed maximum limit: 200).`,
      },
    };

    // Evaluate base weighted sum
    const { traceItems } = ScoreEngine.score(features);

    // 2. Define custom dynamic business rules
    const rules: BusinessRule<College>[] = [
      // Rule A: Budget check (Fees exceeds budget -> Penalty)
      (c) => {
        const exceeded = c.fees > student.budget;
        return {
          ruleId: "budget-limit-check",
          type: "PENALTY",
          value: 20.0,
          passed: exceeded,
        };
      },
      // Rule B: Preferred Location check (Location matches -> Bonus)
      (c) => {
        const locationMatches = student.preferredLocation.some(
          (loc) => loc.toLowerCase().trim() === c.location.toLowerCase().trim()
        );
        return {
          ruleId: "preferred-location-match",
          type: "BONUS",
          value: 10.0,
          passed: locationMatches,
        };
      },
      // Rule C: Hostel preference check (Hostel needed and available -> Bonus)
      (c) => {
        const match = student.hostelPreference && c.hostelAvailable;
        return {
          ruleId: "hostel-preference-match",
          type: "BONUS",
          value: 5.0,
          passed: match,
        };
      },
      // Rule D: Interest specialization check (Specialization matches -> Bonus)
      (c) => {
        const matchesCount = intersectionCount(
          student.interests,
          c.specialization
        );
        return {
          ruleId: "specialization-interest-match",
          type: "BONUS",
          value: matchesCount * 3.0, // +3.0 bonus points per matching interest
          passed: matchesCount > 0,
        };
      },
    ];

    // Evaluate rules
    const { rulesApplied, bonusTotal, penaltyTotal } = RuleEngine.evaluate(
      college,
      rules
    );

    // 3. Compile final explainability trace log
    const trace = TraceEngine.compileTrace(
      traceItems,
      bonusTotal,
      penaltyTotal
    );

    // 4. Calculate dataset completeness
    // Count non-empty properties on student and college records
    const collegeProps = Object.values(college).filter(
      (v) => v !== undefined && v !== null && v !== ""
    ).length;
    const totalCollegeProps = Object.keys(college).length;
    const completenessRatio = collegeProps / totalCollegeProps;

    // Calculate confidence score
    const normalizedValues = traceItems.map((item) => item.normalizedValue);
    const confidence = ConfidenceEngine.calculate(
      normalizedValues,
      completenessRatio
    );

    // 5. Generate deterministic audit log record
    const ruleAuditList = rulesApplied.map((r) => ({
      ruleId: r.ruleId,
      type: r.type,
      value: r.value,
      passed: r.passed,
    }));

    const matchedSpecCount = intersectionCount(
      student.interests,
      college.specialization
    );
    const traceSummary =
      `College: ${college.name} scored ${trace.totalScore}/100. ` +
      `Base: ${trace.baseScore}. Adjustments: +${bonusTotal} / -${penaltyTotal}. ` +
      `Specialization matches: ${matchedSpecCount}. Location: ${college.location}.`;

    const audit = AuditEngine.createRecord(
      college.id,
      weights,
      ruleAuditList,
      confidence,
      traceSummary,
      "1.0.0",
      timestamp
    );

    results.push({
      data: college,
      score: trace.totalScore,
      confidence,
      trace,
      audit,
    });
  }

  // 6. Rank and return recommendations
  return RankingEngine.rank(results);
}
