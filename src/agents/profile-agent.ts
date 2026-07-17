import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
} from "../types/agent";
import { StudentProfile } from "../knowledge/schemas/student";
import { KnowledgeBase } from "../knowledge";
import { ScoreEngine, ScoringFeature } from "../decision-engine/core/score-engine";
import { TraceEngine } from "../decision-engine/core/trace-engine";
import { RuleEngine, BusinessRule } from "../decision-engine/core/rule-engine";
import { ConfidenceEngine } from "../decision-engine/core/confidence-engine";
import { AuditEngine } from "../decision-engine/core/audit-engine";
import { normalizeInverseMinMax } from "../decision-engine/utils/normalizer";

/**
 * Interface representing the detailed analysis of a student profile.
 */
export interface AnalyzedStudentProfile {
  budgetCategory: "LOW" | "MEDIUM" | "HIGH";
  priorityOrder: string[];
  interestVector: string[];
  preferredCareerDirection: string[];
  preferredIndustries: string[];
  preferredLearningStyle: string;
  strengths: string[];
  weaknesses: string[];
  skillGaps: string[];
  riskProfile: {
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    factors: string[];
  };
  recommendationConstraints: {
    maxFees: number;
    locations: string[];
    hostelRequired: boolean;
  };
  decisionPreferences: {
    placementPriority: number;
    feeSensitivity: number;
    researchInterest: number;
    startupInterest: number;
    higherStudiesPreference: number;
    locationPreference: number;
  };
  completeness: {
    score: number;
    missingFields: string[];
  };
}

/**
 * Business Agent responsible for analyzing raw student profile metrics.
 * Validates completeness, infers preference weights, maps skill gaps, and evaluates risk profiles.
 */
export class ProfileAgent extends BaseAgent<AgentContext> {
  public readonly id = "profile-agent";
  public readonly name = "Profile Agent";
  public readonly description =
    "Analyzes raw student profile metrics, validates data completeness, and infers recommendation preferences.";
  public readonly version = "1.0.0";
  public readonly priority = 90;
  public readonly dependencies: string[] = [];

  /**
   * Executes the student profiling analysis cycle.
   */
  protected async run(
    context: AgentContext
  ): Promise<
    Pick<
      AgentResult,
      "status" | "data" | "reasoning" | "confidence" | "nextAgent"
    >
  > {
    const student = (context.studentProfile ||
      context.metadata.studentProfile) as StudentProfile | undefined;

    if (!student) {
      return {
        status: AgentStatus.FAILED,
        reasoning: "Profiling failed: No StudentProfile object found in context.",
        confidence: 0.0,
      };
    }

    this.logger.info(`Analyzing student profile: ${student.name} (${student.id})`);

    // ==========================================
    // 1. CALCULATE PROFILE COMPLETENESS
    // ==========================================
    const coreFields: (keyof StudentProfile)[] = [
      "id",
      "name",
      "exam",
      "rank",
      "branchAllocated",
      "budget",
      "preferredLocation",
      "interests",
      "preferredCareer",
      "hostelPreference",
      "currentSkills",
      "preferredLearningStyle",
      "preferredCompanyType",
    ];

    const missingFields: string[] = [];
    let filledCount = 0;

    for (const key of coreFields) {
      const val = student[key];
      const isPopulated =
        val !== undefined &&
        val !== null &&
        (Array.isArray(val) ? val.length > 0 : String(val).trim().length > 0);

      if (isPopulated) {
        filledCount++;
      } else {
        missingFields.push(key);
      }
    }

    const completenessScore = Math.round((filledCount / coreFields.length) * 100);

    // ==========================================
    // 2. INFER DECISION PREFERENCES WEIGHTS
    // ==========================================
    // placementPriority: High if higher studies interest is low
    const placementPriority = student.higherStudiesInterest ? 0.4 : 0.95;

    // feeSensitivity: Higher sensitivity for lower budgets (clamped between 0.0 and 1.0)
    const feeSensitivity = Number(
      Math.max(0.0, 1.0 - student.budget / 800000).toFixed(2)
    );

    // researchInterest: High if higher studies interest is set or if research is in interests list
    const hasResearchInterest = student.interests.some((i) =>
      i.toLowerCase().includes("research")
    );
    const researchInterest = student.higherStudiesInterest
      ? 0.9
      : hasResearchInterest
      ? 0.8
      : 0.3;

    // startupInterest: High if entrepreneurship interest is flag is set
    const startupInterest = student.entrepreneurshipInterest ? 0.95 : 0.25;

    // higherStudiesPreference: Maps directly to higher studies interest
    const higherStudiesPreference = student.higherStudiesInterest ? 1.0 : 0.2;

    // locationPreference: High if student explicitly restricted preferred cities
    const locationPreference = student.preferredLocation.length > 0 ? 0.85 : 0.15;

    const decisionPreferences = {
      placementPriority,
      feeSensitivity,
      researchInterest,
      startupInterest,
      higherStudiesPreference,
      locationPreference,
    };

    // ==========================================
    // 3. MAP BUDGET CATEGORY AND PRIORITIES
    // ==========================================
    let budgetCategory: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
    if (student.budget < 150000) budgetCategory = "LOW";
    else if (student.budget > 350000) budgetCategory = "HIGH";

    // Sort priority vector based on calculated sensitivities and student options
    const priorities = [
      { name: "FEES", value: feeSensitivity },
      { name: "LOCATION", value: locationPreference },
      { name: "PLACEMENTS", value: placementPriority },
      { name: "RESEARCH", value: researchInterest },
      { name: "STARTUP", value: startupInterest },
    ];
    priorities.sort((a, b) => b.value - a.value);
    const priorityOrder = priorities.map((p) => p.name);

    // ==========================================
    // 4. MAP SKILL GAPS (Cross-reference Knowledge Base)
    // ==========================================
    const skillGapsSet = new Set<string>();
    const studentSkillsLower = new Set(
      student.currentSkills.map((s) => s.toLowerCase().trim())
    );

    // Scan student's preferred careers in the knowledge base and add skills they don't have
    for (const careerId of student.preferredCareer) {
      const career = KnowledgeBase.careers.find((c) => c.id === careerId);
      if (career) {
        for (const skill of career.requiredSkills) {
          if (!studentSkillsLower.has(skill.toLowerCase().trim())) {
            skillGapsSet.add(skill);
          }
        }
      }
    }
    const skillGaps = Array.from(skillGapsSet);

    // ==========================================
    // 5. DETERMINE STRENGTHS, WEAKNESSES AND INDUSTRY DOMAINS
    // ==========================================
    const strengths = [...student.currentSkills];
    const weaknesses: string[] = [];
    if (student.currentSkills.length < 3) {
      weaknesses.push("Limited technical skill portfolio");
    }
    if (skillGaps.length > 3) {
      weaknesses.push("Significant skill gaps for aligned career targets");
    }

    // Infer domains from student interests
    const preferredIndustriesSet = new Set<string>();
    for (const interest of student.interests) {
      const lowerInt = interest.toLowerCase();
      if (lowerInt.includes("intelligence") || lowerInt.includes("machine")) {
        preferredIndustriesSet.add("Artificial Intelligence");
        preferredIndustriesSet.add("Data Science");
      } else if (lowerInt.includes("software") || lowerInt.includes("web") || lowerInt.includes("app")) {
        preferredIndustriesSet.add("Software Engineering");
        preferredIndustriesSet.add("SaaS");
      } else if (lowerInt.includes("hardware") || lowerInt.includes("embedded") || lowerInt.includes("iot")) {
        preferredIndustriesSet.add("Internet of Things");
        preferredIndustriesSet.add("Hardware Systems");
      }
    }
    // Fallback if no specific clusters matched
    if (preferredIndustriesSet.size === 0) {
      preferredIndustriesSet.add("General Technology");
    }
    const preferredIndustries = Array.from(preferredIndustriesSet);

    // ==========================================
    // 6. BUILD RISK PROFILE & CONSTRAINTS
    // ==========================================
    const riskFactors: string[] = [];
    if (student.rank > 20000) {
      riskFactors.push("High competitive exam rank limits top-tier college choices.");
    }
    if (budgetCategory === "LOW") {
      riskFactors.push("Low yearly fee budget limits private college options.");
    }
    if (student.preferredLocation.length === 1) {
      riskFactors.push("Highly restrictive geographic location preference.");
    }
    if (skillGaps.length > 4) {
      riskFactors.push("Substantial technical upskilling required for career alignment.");
    }

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (riskFactors.length >= 3) riskLevel = "HIGH";
    else if (riskFactors.length > 0) riskLevel = "MEDIUM";

    const riskProfile = {
      riskLevel,
      factors: riskFactors,
    };

    const recommendationConstraints = {
      maxFees: student.budget,
      locations: student.preferredLocation,
      hostelRequired: student.hostelPreference,
    };

    const analyzedProfile: AnalyzedStudentProfile = {
      budgetCategory,
      priorityOrder,
      interestVector: student.interests,
      preferredCareerDirection: student.preferredCareer,
      preferredIndustries,
      preferredLearningStyle: student.preferredLearningStyle,
      strengths,
      weaknesses,
      skillGaps,
      riskProfile,
      recommendationConstraints,
      decisionPreferences,
      completeness: {
        score: completenessScore,
        missingFields,
      },
    };

    // ==========================================
    // 7. COMPILE SCORING FEATURES & DECISION TRACE
    // ==========================================
    // We score the student's profile quality deterministically
    const features: Record<string, ScoringFeature> = {
      completenessScore: {
        rawValue: `${completenessScore}%`,
        normalizedValue: completenessScore / 100.0,
        weight: 0.5,
        explanation: `Determined profile completeness based on ${filledCount}/${coreFields.length} populated fields.`,
      },
      academicStanding: {
        rawValue: student.rank,
        normalizedValue: normalizeInverseMinMax(student.rank, 1, 50000), // Assumes rank limit of 50000
        weight: 0.3,
        explanation: `Normalized entrance rank of ${student.rank} inversely against scale [1, 50000].`,
      },
      skillsBase: {
        rawValue: student.currentSkills.length,
        normalizedValue: Math.min(1.0, student.currentSkills.length / 5), // Target 5 skills
        weight: 0.2,
        explanation: `Student holds ${student.currentSkills.length} skills (target: 5 for max score).`,
      },
    };

    const { traceItems } = ScoreEngine.score(features);

    // Business Rules
    const rules: BusinessRule<AnalyzedStudentProfile>[] = [
      // Rule A: Elite Rank Booster (Top 2000 rank gets bonus points)
      () => {
        const topRank = student.rank <= 2000;
        return {
          ruleId: "elite-rank-booster",
          type: "BONUS",
          value: 10.0,
          passed: topRank,
        };
      },
      // Rule B: Skill Deficit Penalty (Zero current skills gets a penalty)
      () => {
        const noSkills = student.currentSkills.length === 0;
        return {
          ruleId: "zero-skills-deficit",
          type: "PENALTY",
          value: 15.0,
          passed: noSkills,
        };
      },
    ];

    const { rulesApplied, bonusTotal, penaltyTotal } = RuleEngine.evaluate(
      analyzedProfile,
      rules
    );

    const trace = TraceEngine.compileTrace(
      traceItems,
      bonusTotal,
      penaltyTotal
    );

    // ==========================================
    // 8. GENERATE CONFIDENCE & DETERMINISTIC AUDIT
    // ==========================================
    const completenessRatio = completenessScore / 100.0;
    const baseConfidence = ConfidenceEngine.calculate(
      traceItems.map((ti) => ti.normalizedValue),
      completenessRatio
    );
    // Profile completeness directly scales final confidence!
    const finalConfidence = Number(
      (baseConfidence * completenessRatio).toFixed(1)
    );

    const ruleAuditList = rulesApplied.map((r) => ({
      ruleId: r.ruleId,
      type: r.type,
      value: r.value,
      passed: r.passed,
    }));

    const traceSummary =
      `Student profile '${student.name}' analyzed. Fit Score: ${trace.totalScore}/100. ` +
      `Completeness: ${completenessScore}%. Target Career: ${student.preferredCareer.join(
        ", "
      )}. Budget: ${budgetCategory} (${student.budget} INR).`;

    const audit = AuditEngine.createRecord(
      student.id,
      {
        completenessScore: 0.5,
        academicStanding: 0.3,
        skillsBase: 0.2,
      },
      ruleAuditList,
      finalConfidence,
      traceSummary,
      "1.0.0",
      context.metadata.timestamp as string || "2026-07-16T22:00:00.000Z"
    );

    // ==========================================
    // 9. RETURN AGENT RESULT
    // ==========================================
    return {
      status: AgentStatus.SUCCESS,
      data: {
        analyzedStudentProfile: {
          ...analyzedProfile,
          score: trace.totalScore,
          confidence: finalConfidence,
          trace,
          audit,
        },
      },
      reasoning:
        `Student profile successfully analyzed with ${completenessScore}% completeness. ` +
        `Identified ${priorityOrder.join(" > ")} priorities. Aligned career: ${student.preferredCareer.join(
          ", "
        )}. Skill gaps: ${skillGaps.length} missing skills.`,
      confidence: finalConfidence,
    };
  }
}
