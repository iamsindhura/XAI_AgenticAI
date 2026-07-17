import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
} from "../types/agent";
import { College } from "../knowledge/schemas/college";
import { StudentProfile } from "../knowledge/schemas/student";
import { KnowledgeBase } from "../knowledge";
import { makeCollegeDecision } from "../decision-engine/modules/college-decision";
import { DecisionResult } from "../decision-engine/core/types";
import { intersectionCount } from "../decision-engine/utils/comparator";
import { AnalyzedStudentProfile } from "./profile-agent";

/**
 * Structured summary details describing the decision alignment.
 */
export interface CollegeDecisionSummary {
  overallScore: number;
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Recommendation item wrapping college data and structured decision summary.
 */
export interface CollegeRecommendationItem extends DecisionResult<College> {
  decisionSummary: CollegeDecisionSummary;
}

/**
 * Business Agent responsible for scoring and categorizing college recommendations.
 * Groups choices into Recommended, Backup, and Not Recommended catalogs.
 */
export class CollegeRecommendationAgent extends BaseAgent<AgentContext> {
  public readonly id = "college-recommendation-agent";
  public readonly name = "College Recommendation Agent";
  public readonly description =
    "Evaluates colleges from the Knowledge Base and categorizes them into Recommended, Backup, and Not Recommended options.";
  public readonly version = "1.0.0";
  public readonly priority = 70;
  public readonly dependencies: string[] = ["profile-agent"];

  /**
   * Executes college scoring and split categorization.
   */
  protected async run(
    context: AgentContext
  ): Promise<
    Pick<
      AgentResult,
      "status" | "data" | "reasoning" | "confidence" | "nextAgent"
    >
  > {
    const studentProfile = (context.studentProfile ||
      context.metadata.studentProfile) as StudentProfile | undefined;

    const analyzedProfile = context.analyzedStudentProfile as
      | AnalyzedStudentProfile
      | undefined;

    if (!studentProfile || !analyzedProfile) {
      return {
        status: AgentStatus.FAILED,
        reasoning:
          "College recommendation failed: Required profile objects 'studentProfile' and 'analyzedStudentProfile' are missing from context.",
        confidence: 0.0,
      };
    }

    this.logger.info(`Analyzing college recommendations for student: ${studentProfile.name}`);

    // 1. Map dynamic preference weights from profile analysis
    const preferences = analyzedProfile.decisionPreferences;
    const mappedWeights = {
      placementScore: preferences.placementPriority,
      roiScore: 0.5 * (1.0 - preferences.feeSensitivity) + 0.5 * preferences.placementPriority,
      nirfRank: 0.10,
      codingCultureScore: 0.15,
      researchScore: preferences.researchInterest,
      startupCultureScore: preferences.startupInterest,
      alumniNetworkScore: 0.10,
    };

    const timestamp = (context.metadata.timestamp as string) || "2026-07-16T22:00:00.000Z";

    // 2. Invoke Decision Engine College Decision Scorer
    const decisionList = makeCollegeDecision(
      studentProfile,
      KnowledgeBase.colleges,
      mappedWeights,
      timestamp
    );

    const recommendedColleges: CollegeRecommendationItem[] = [];
    const backupColleges: CollegeRecommendationItem[] = [];
    const notRecommendedColleges: CollegeRecommendationItem[] = [];

    // Map criteria identifiers to human readable labels for structured summary reports
    const criterionLabels: Record<string, string> = {
      placementScore: "High placement packages",
      roiScore: "Excellent return on investment",
      codingCultureScore: "Vibrant campus coding environment",
      researchScore: "Elite academic research opportunities",
      startupCultureScore: "Active startup culture and incubation support",
      alumniNetworkScore: "Vast alumni network",
      nirfRank: "Top-tier national rank standing",
    };

    // 3. Process and categorize every candidate college
    for (const result of decisionList) {
      const college = result.data;

      // Calculate criteria match density (percentage of trace items matching >= 0.6)
      const traceItems = result.trace.items;
      const matchingItems = traceItems.filter((item) => item.normalizedValue >= 0.6);
      const matchPercentage = Math.round(
        (matchingItems.length / traceItems.length) * 100
      );

      const strengths: string[] = [];
      const weaknesses: string[] = [];

      // Extract strengths (normalized score >= 0.8)
      for (const item of traceItems) {
        if (item.normalizedValue >= 0.8) {
          strengths.push(criterionLabels[item.criterion] || `Strong ${item.criterion}`);
        }
      }

      // Extract weaknesses (normalized score < 0.5)
      for (const item of traceItems) {
        if (item.normalizedValue < 0.5) {
          weaknesses.push(criterionLabels[item.criterion] || `Low ${item.criterion}`);
        }
      }

      // Append rule penalties/adjustments as explicit weaknesses
      const budgetCheck = result.audit.rulesApplied.find(
        (r) => r.ruleId === "budget-limit-check"
      );
      if (budgetCheck && budgetCheck.passed) {
        weaknesses.push("Tuition fees exceed student yearly budget limits");
      }

      const locationCheck = result.audit.rulesApplied.find(
        (r) => r.ruleId === "preferred-location-match"
      );
      if (locationCheck && !locationCheck.passed) {
        weaknesses.push("Campus location outside preferred regions");
      }

      const decisionSummary: CollegeDecisionSummary = {
        overallScore: result.score,
        matchPercentage,
        strengths,
        weaknesses,
      };

      const recommendationItem: CollegeRecommendationItem = {
        ...result,
        decisionSummary,
      };

      // Determine categorization bucket based on constraints and score thresholds
      const specializationOverlap = intersectionCount(
        studentProfile.interests,
        college.specialization
      );

      const isBudgetExceeded = college.fees > studentProfile.budget;
      const isSpecializationMismatch = specializationOverlap === 0;

      if (isBudgetExceeded || isSpecializationMismatch || result.score < 50) {
        // Relegate poor matches directly to Not Recommended
        notRecommendedColleges.push(recommendationItem);
      } else if (result.score >= 70) {
        recommendedColleges.push(recommendationItem);
      } else {
        backupColleges.push(recommendationItem);
      }
    }

    const collegeDecisionMetadata = {
      timestamp,
      totalScored: decisionList.length,
      recommendedCount: recommendedColleges.length,
      backupCount: backupColleges.length,
      notRecommendedCount: notRecommendedColleges.length,
      appliedWeights: mappedWeights,
    };

    // 4. Return results and update shared AgentContext
    return {
      status: AgentStatus.SUCCESS,
      data: {
        recommendedColleges,
        backupColleges,
        notRecommendedColleges,
        collegeDecisionMetadata,
      },
      reasoning:
        `Processed ${decisionList.length} colleges. ` +
        `Categorized: ${recommendedColleges.length} Recommended, ` +
        `${backupColleges.length} Backup, and ${notRecommendedColleges.length} Not Recommended choices.`,
      confidence:
        recommendedColleges.length > 0
          ? recommendedColleges[0].confidence
          : 90.0, // Top choice confidence or default high
    };
  }
}
