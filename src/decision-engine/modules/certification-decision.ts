import { Certification } from "../../knowledge/schemas/certification";
import { Career } from "../../knowledge/schemas/career";
import { StudentProfile } from "../../knowledge/schemas/student";
import { DecisionResult } from "../core/types";
import { DEFAULT_CERTIFICATION_WEIGHTS } from "../core/weights";
import { ScoreEngine, ScoringFeature } from "../core/score-engine";
import { TraceEngine } from "../core/trace-engine";
import { RuleEngine, BusinessRule } from "../core/rule-engine";
import { ConfidenceEngine } from "../core/confidence-engine";
import { RankingEngine } from "../core/ranking-engine";
import { normalizeInverseMinMax } from "../utils/normalizer";
import { intersectionCount } from "../utils/comparator";
import { AuditEngine } from "../core/audit-engine";

/**
 * Recommends and ranks certifications aligned to a career track and student profile.
 * @param student The StudentProfile data.
 * @param career The target Career path.
 * @param certifications Array of available Certification records.
 * @param weights Optional weights override.
 * @returns Array of ranked DecisionResults containing certification data.
 */
export function makeCertificationDecision(
  student: StudentProfile,
  career: Career,
  certifications: Certification[],
  weights: Record<string, number> = DEFAULT_CERTIFICATION_WEIGHTS,
  timestamp?: string
): DecisionResult<Certification>[] {
  // Filter certifications to only those aligned with the target career
  const candidates = certifications.filter((cert) =>
    cert.careerAlignment.includes(career.id)
  );

  const results: Omit<DecisionResult<Certification>, "ranking">[] = [];

  const currentSemester = (student.metadata?.currentSemester as number) || 4;

  for (const cert of candidates) {
    // 1. Map duration to normalized value (lower is better, mapped between 0.0 - 1.0)
    let durationValue = 0.5;
    const durStr = cert.duration.toLowerCase();
    if (durStr.includes("20 hours")) durationValue = 0.9;
    else if (durStr.includes("30 hours")) durationValue = 0.8;
    else if (durStr.includes("40 hours")) durationValue = 0.7;
    else if (durStr.includes("45 hours")) durationValue = 0.65;
    else if (durStr.includes("60 hours")) durationValue = 0.5;
    else if (durStr.includes("80 hours")) durationValue = 0.4;
    else if (durStr.includes("2 months")) durationValue = 0.3;
    else if (durStr.includes("3 months")) durationValue = 0.25;
    else if (durStr.includes("4 months")) durationValue = 0.2;
    else if (durStr.includes("5 months")) durationValue = 0.15;

    // 2. Normalize cost (lower cost is better, assumed maximum certification cost is 1500 USD)
    const costValue = normalizeInverseMinMax(cert.cost, 0, 1500);

    // 3. Normalize semester alignment (closer to the current semester is better)
    const semesterDiff = Math.abs(cert.recommendedSemester - currentSemester);
    const semesterValue = Math.max(0.0, 1.0 - semesterDiff / 8.0);

    const features: Record<string, ScoringFeature> = {
      recognitionScore: {
        rawValue: cert.recognitionScore,
        normalizedValue: cert.recognitionScore / 10.0,
        weight: weights.recognitionScore || 0,
        explanation: `Scaled recognition rating ${cert.recognitionScore}/10 to [0,1] range.`,
      },
      costScore: {
        rawValue: cert.cost,
        normalizedValue: costValue,
        weight: weights.costScore || 0,
        explanation: `Normalized cost of $${cert.cost} inversely against range [0, 1500].`,
      },
      durationScore: {
        rawValue: cert.duration,
        normalizedValue: durationValue,
        weight: weights.durationScore || 0,
        explanation: `Mapped duration descriptor '${cert.duration}' to normalized score of ${durationValue}.`,
      },
      semesterAlignmentScore: {
        rawValue: `Cert Sem: ${cert.recommendedSemester} vs Student Sem: ${currentSemester}`,
        normalizedValue: semesterValue,
        weight: weights.semesterAlignmentScore || 0,
        explanation: `Proximity of cert semester to student's current semester. Diff: ${semesterDiff}.`,
      },
    };

    // Calculate base weighted score
    const { traceItems } = ScoreEngine.score(features);

    // 4. Define business rules
    const rules: BusinessRule<Certification>[] = [
      // Rule A: Level alignment (If student has few skills, beginners certs get a bonus)
      (c) => {
        const isEntryFit = c.level === "BEGINNER" && student.currentSkills.length < 3;
        return {
          ruleId: "entry-level-booster",
          type: "BONUS",
          value: 10.0,
          passed: isEntryFit,
        };
      },
      // Rule B: Prerequisite overlap (Possessing prerequisites gives a bonus)
      (c) => {
        const matchesCount = intersectionCount(
          c.prerequisites,
          student.currentSkills
        );
        return {
          ruleId: "prerequisite-possession-bonus",
          type: "BONUS",
          value: matchesCount * 5.0, // +5.0 points per matching prerequisite skill
          passed: matchesCount > 0,
        };
      },
      // Rule C: Exam exemption (Easier/non-proctored credentials get a small bonus)
      (c) => {
        const noExam = !c.examRequired;
        return {
          ruleId: "non-proctored-ease",
          type: "BONUS",
          value: 5.0,
          passed: noExam,
        };
      },
    ];

    // Evaluate rules
    const { rulesApplied, bonusTotal, penaltyTotal } = RuleEngine.evaluate(
      cert,
      rules
    );

    // 5. Compile explainability trace
    const trace = TraceEngine.compileTrace(
      traceItems,
      bonusTotal,
      penaltyTotal
    );

    // 6. Calculate data completeness ratio
    const certProps = Object.values(cert).filter(
      (v) => v !== undefined && v !== null && v !== ""
    ).length;
    const totalCertProps = Object.keys(cert).length;
    const completenessRatio = certProps / totalCertProps;

    const normalizedValues = traceItems.map((item) => item.normalizedValue);
    const confidence = ConfidenceEngine.calculate(
      normalizedValues,
      completenessRatio
    );

    // 7. Generate deterministic audit log
    const ruleAuditList = rulesApplied.map((r) => ({
      ruleId: r.ruleId,
      type: r.type,
      value: r.value,
      passed: r.passed,
    }));

    const traceSummary =
      `Certification: ${cert.name} scored ${trace.totalScore}/100. ` +
      `Base: ${trace.baseScore}. Adjustments: +${bonusTotal} / -${penaltyTotal}. ` +
      `Cost: $${cert.cost}. Target Sem: ${cert.recommendedSemester}. Provider: ${cert.provider}.`;

    const audit = AuditEngine.createRecord(
      cert.id,
      weights,
      ruleAuditList,
      confidence,
      traceSummary,
      "1.0.0",
      timestamp
    );

    results.push({
      data: cert,
      score: trace.totalScore,
      confidence,
      trace,
      audit,
    });
  }

  // 8. Rank recommendations and return
  return RankingEngine.rank(results);
}
