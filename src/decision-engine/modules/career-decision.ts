import { Career } from "../../knowledge/schemas/career";
import { StudentProfile } from "../../knowledge/schemas/student";
import { DecisionResult } from "../core/types";
import { DEFAULT_CAREER_WEIGHTS } from "../core/weights";
import { ScoreEngine, ScoringFeature } from "../core/score-engine";
import { TraceEngine } from "../core/trace-engine";
import { RuleEngine, BusinessRule } from "../core/rule-engine";
import { ConfidenceEngine } from "../core/confidence-engine";
import { RankingEngine } from "../core/ranking-engine";
import { normalizeMinMax } from "../utils/normalizer";
import { jaccardSimilarity, inclusionRatio } from "../utils/comparator";
import { AuditEngine } from "../core/audit-engine";

/**
 * Ranks and scores career alignments based on student interests and skills.
 * @param student The StudentProfile data.
 * @param careers Array of available Career records.
 * @param weights Optional weights override.
 * @returns Array of ranked DecisionResults containing career data.
 */
export function makeCareerDecision(
  student: StudentProfile,
  careers: Career[],
  weights: Record<string, number> = DEFAULT_CAREER_WEIGHTS,
  timestamp?: string
): DecisionResult<Career>[] {
  const results: Omit<DecisionResult<Career>, "ranking">[] = [];

  for (const career of careers) {
    // 1. Map demand levels to normalized scores
    let demandValue = 0.5;
    if (career.demand === "HIGH") demandValue = 1.0;
    else if (career.demand === "MEDIUM") demandValue = 0.6;
    else if (career.demand === "LOW") demandValue = 0.2;

    // 2. Extract growth percentage or keywords deterministically
    let growthValue = 0.5;
    const growthStr = career.futureGrowth.toLowerCase();
    if (growthStr.includes("35%")) growthValue = 1.0;
    else if (growthStr.includes("30%")) growthValue = 0.9;
    else if (growthStr.includes("25%")) growthValue = 0.8;
    else if (growthStr.includes("20%")) growthValue = 0.75;
    else if (growthStr.includes("18%")) growthValue = 0.7;
    else if (growthStr.includes("15%")) growthValue = 0.6;

    // 3. Normalize salary average range
    const avgSalary = (career.salaryRange.min + career.salaryRange.max) / 2;
    // Assume salary normalizer limits: Min 500,000, Max 4,000,000 INR
    const salaryValue = normalizeMinMax(avgSalary, 500000, 4000000);

    // 4. Interest similarity match
    const interestSimilarity = jaccardSimilarity(
      student.interests,
      career.requiredSkills
    );

    const features: Record<string, ScoringFeature> = {
      demandScore: {
        rawValue: career.demand,
        normalizedValue: demandValue,
        weight: weights.demandScore || 0,
        explanation: `Mapped demand level '${career.demand}' to normalized score of ${demandValue}.`,
      },
      growthScore: {
        rawValue: career.futureGrowth,
        normalizedValue: growthValue,
        weight: weights.growthScore || 0,
        explanation: `Parsed growth details containing growth: ${growthValue}.`,
      },
      salaryScore: {
        rawValue: `${career.salaryRange.min}-${career.salaryRange.max} ${career.salaryRange.currency}`,
        normalizedValue: salaryValue,
        weight: weights.salaryScore || 0,
        explanation: `Normalized average salary of ${avgSalary} INR against range [500k, 4M].`,
      },
      interestMatchScore: {
        rawValue: `Interests: [${student.interests.join(
          ", "
        )}] vs Skills: [${career.requiredSkills.join(", ")}]`,
        normalizedValue: interestSimilarity,
        weight: weights.interestMatchScore || 0,
        explanation: `Jaccard similarity between student interests and career required skills.`,
      },
    };

    // Calculate base weighted score
    const { traceItems } = ScoreEngine.score(features);

    // 5. Define business rules
    const rules: BusinessRule<Career>[] = [
      // Rule A: Branch Recommendation Match (Alumni/academic branch overlap -> Bonus)
      (car) => {
        const matchesBranch = car.recommendedBranch.some(
          (b) => b.toLowerCase().trim() === student.branchAllocated.toLowerCase().trim()
        );
        return {
          ruleId: "branch-alignment-match",
          type: "BONUS",
          value: 10.0,
          passed: matchesBranch,
        };
      },
      // Rule B: Preferred Career choice (Student explicitly targetting this -> Bonus)
      (car) => {
        const matchesPreference = student.preferredCareer.includes(car.id);
        return {
          ruleId: "preferred-career-match",
          type: "BONUS",
          value: 15.0,
          passed: matchesPreference,
        };
      },
      // Rule C: Pre-existing skills fit (Possesses required skills -> Bonus)
      (car) => {
        const skillsCoverage = inclusionRatio(
          car.requiredSkills,
          student.currentSkills
        );
        return {
          ruleId: "skills-coverage-bonus",
          type: "BONUS",
          value: skillsCoverage * 15.0, // Up to +15.0 bonus if skills are already met
          passed: skillsCoverage > 0,
        };
      },
    ];

    // Evaluate rules
    const { rulesApplied, bonusTotal, penaltyTotal } = RuleEngine.evaluate(
      career,
      rules
    );

    // 6. Compile explainability trace
    const trace = TraceEngine.compileTrace(
      traceItems,
      bonusTotal,
      penaltyTotal
    );

    // 7. Calculate data completeness ratio
    const careerProps = Object.values(career).filter(
      (v) => v !== undefined && v !== null && v !== ""
    ).length;
    const totalCareerProps = Object.keys(career).length;
    const completenessRatio = careerProps / totalCareerProps;

    const normalizedValues = traceItems.map((item) => item.normalizedValue);
    const confidence = ConfidenceEngine.calculate(
      normalizedValues,
      completenessRatio
    );

    // 8. Generate deterministic audit log
    const ruleAuditList = rulesApplied.map((r) => ({
      ruleId: r.ruleId,
      type: r.type,
      value: r.value,
      passed: r.passed,
    }));

    const skillsCoverage = inclusionRatio(
      career.requiredSkills,
      student.currentSkills
    );
    const traceSummary =
      `Career: ${career.name} scored ${trace.totalScore}/100. ` +
      `Base: ${trace.baseScore}. Adjustments: +${bonusTotal} / -${penaltyTotal}. ` +
      `Skills coverage: ${(skillsCoverage * 100).toFixed(0)}%. Preferred: ${
        student.preferredCareer.includes(career.id) ? "YES" : "NO"
      }.`;

    const audit = AuditEngine.createRecord(
      career.id,
      weights,
      ruleAuditList,
      confidence,
      traceSummary,
      "1.0.0",
      timestamp
    );

    results.push({
      data: career,
      score: trace.totalScore,
      confidence,
      trace,
      audit,
    });
  }

  // 9. Rank recommendations and return
  return RankingEngine.rank(results);
}
