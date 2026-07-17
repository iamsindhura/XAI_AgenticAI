import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
} from "../types/agent";
import { Career } from "../knowledge/schemas/career";
import { StudentProfile } from "../knowledge/schemas/student";
import { KnowledgeBase } from "../knowledge";
import { makeCareerDecision } from "../decision-engine/modules/career-decision";
import { DecisionResult } from "../decision-engine/core/types";
import { jaccardSimilarity } from "../decision-engine/utils/comparator";
import { AnalyzedStudentProfile } from "./profile-agent";

/**
 * Fit score metrics assessing overall and specific alignment ratios.
 */
export interface CareerFitAnalysis {
  overallFit: number;
  technicalFit: number;
  interestFit: number;
  marketDemandFit: number;
  futureGrowthFit: number;
}

/**
 * Skill gaps diagnostics report.
 */
export interface CareerSkillGapAnalysis {
  requiredSkills: string[];
  existingSkills: string[];
  missingSkills: string[];
  learningDifficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedLearningTime: string;
}

/**
 * Recommendation item wrapping course details and dynamic prioritization.
 */
export interface RecommendedCourseItem {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendedSemester: number;
  estimatedWeeklyHours: number;
  prerequisites: string[];
  skillsCovered: string[];
  learningOutcome: string;
}

/**
 * Recommendation item wrapping career data, courses, sequences, and fit metrics.
 */
export interface CareerRecommendationItem extends Omit<DecisionResult<Career>, "ranking"> {
  careerScore: number;
  ranking: number;
  careerFitAnalysis: CareerFitAnalysis;
  skillGapAnalysis: CareerSkillGapAnalysis;
  recommendedCourses: RecommendedCourseItem[];
  learningSequence: string[];
  estimatedPreparationDuration: string;
}

/**
 * Business Agent responsible for evaluating, ranking, and detailing career path recommendations.
 * Computes skill gaps, maps coursework sequences, and maps fit analysis indicators.
 */
export class CareerRecommendationAgent extends BaseAgent<AgentContext> {
  public readonly id = "career-recommendation-agent";
  public readonly name = "Career Recommendation Agent";
  public readonly description =
    "Ranks career paths against student profile interests, identifies skill gaps, and recommends prioritized courses.";
  public readonly version = "1.0.0";
  public readonly priority = 50;
  public readonly dependencies: string[] = ["profile-agent"];

  /**
   * Executes career recommendation scoring, course prioritization, and sequence mapping.
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
          "Career recommendation failed: Required profile objects 'studentProfile' and 'analyzedStudentProfile' are missing from context.",
        confidence: 0.0,
      };
    }

    this.logger.info(`Analyzing career recommendations for student: ${studentProfile.name}`);

    const preferences = analyzedProfile.decisionPreferences;
    const mappedWeights = {
      demandScore: 0.25,
      growthScore: 0.25,
      salaryScore: 0.20,
      interestMatchScore: preferences.placementPriority, // scale interest weight based on placement priority
    };

    const timestamp = (context.metadata.timestamp as string) || "2026-07-16T22:00:00.000Z";

    // 1. Invoke Decision Engine Career Decision Scorer
    const decisionList = makeCareerDecision(
      studentProfile,
      KnowledgeBase.careers,
      mappedWeights,
      timestamp
    );

    const recommendedCareers: CareerRecommendationItem[] = [];
    const backupCareers: CareerRecommendationItem[] = [];
    const notRecommendedCareers: CareerRecommendationItem[] = [];

    const studentSkillsLower = new Set(
      studentProfile.currentSkills.map((s) => s.toLowerCase().trim())
    );

    let rankCounter = 1;

    // 2. Map and enrich every career alternative
    for (const result of decisionList) {
      const career = result.data;

      // Calculate skill gaps
      const requiredSkills = career.requiredSkills;
      const existingSkills = requiredSkills.filter((s) =>
        studentSkillsLower.has(s.toLowerCase().trim())
      );
      const missingSkills = requiredSkills.filter(
        (s) => !studentSkillsLower.has(s.toLowerCase().trim())
      );

      let learningDifficulty: "EASY" | "MEDIUM" | "HARD" = "EASY";
      if (missingSkills.length > 3) learningDifficulty = "HARD";
      else if (missingSkills.length > 1) learningDifficulty = "MEDIUM";

      const estimatedLearningTime =
        missingSkills.length === 0
          ? "1 month"
          : `${missingSkills.length * 2} months`;

      const skillGapAnalysis: CareerSkillGapAnalysis = {
        requiredSkills,
        existingSkills,
        missingSkills,
        learningDifficulty,
        estimatedLearningTime,
      };

      // Filter and map courses aligned with this career
      const alignedCourses = KnowledgeBase.courses.filter((course) =>
        course.careerAlignment.includes(career.id)
      );

      const recommendedCourses: RecommendedCourseItem[] = [];
      let totalDurationHours = 0;

      for (const course of alignedCourses) {
        // Evaluate dynamic course priority
        const coversGaps = course.skillsCovered.some((s) =>
          missingSkills.some((ms) => ms.toLowerCase().trim() === s.toLowerCase().trim())
        );

        let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
        if (coversGaps) {
          if (course.level === "BEGINNER") priority = "HIGH";
          else if (course.level === "INTERMEDIATE") priority = "MEDIUM";
          else priority = "LOW";
        } else {
          // If student already possesses the skills, set priority to LOW
          priority = "LOW";
        }

        // Parse hours to accumulate overall preparation estimate
        const durStr = course.duration.toLowerCase();
        let hours = 20; // default fallback
        const parsedHours = parseInt(durStr.replace(/\D/g, ""), 10);
        if (!isNaN(parsedHours)) {
          hours = parsedHours;
        }
        totalDurationHours += hours;

        recommendedCourses.push({
          id: course.id,
          title: course.title,
          provider: course.provider,
          duration: course.duration,
          level: course.level,
          priority,
          recommendedSemester: course.recommendedSemester,
          estimatedWeeklyHours: course.estimatedWeeklyHours,
          prerequisites: course.prerequisites,
          skillsCovered: course.skillsCovered,
          learningOutcome: course.learningOutcome,
        });
      }

      // Sort courses by priority (HIGH -> MEDIUM -> LOW) and recommended semester ascending
      const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      recommendedCourses.sort((a, b) => {
        const wtA = priorityWeights[a.priority];
        const wtB = priorityWeights[b.priority];
        if (wtA !== wtB) {
          return wtB - wtA; // sort priority descending
        }
        return a.recommendedSemester - b.recommendedSemester; // sort semester ascending
      });

      // Map learning sequence
      const learningSequence = recommendedCourses.map((c) => c.title);

      // Estimate preparation duration
      const calculatedMonths = Math.max(1, Math.round(totalDurationHours / 30));
      const estimatedPreparationDuration = `${totalDurationHours} hours of coursework (approx. ${calculatedMonths} months)`;

      // Map fit scores
      let demandValue = 0.5;
      if (career.demand === "HIGH") demandValue = 1.0;
      else if (career.demand === "MEDIUM") demandValue = 0.6;
      else if (career.demand === "LOW") demandValue = 0.2;

      let growthValue = 0.5;
      const growthStr = career.futureGrowth.toLowerCase();
      if (growthStr.includes("35%")) growthValue = 1.0;
      else if (growthStr.includes("30%")) growthValue = 0.9;
      else if (growthStr.includes("25%")) growthValue = 0.8;
      else if (growthStr.includes("20%")) growthValue = 0.75;
      else if (growthStr.includes("15%")) growthValue = 0.6;

      const interestSimilarity = jaccardSimilarity(
        studentProfile.interests,
        career.requiredSkills
      );

      const careerFitAnalysis: CareerFitAnalysis = {
        overallFit: result.score,
        technicalFit: Math.round(
          requiredSkills.length > 0 ? (existingSkills.length / requiredSkills.length) * 100 : 100
        ),
        interestFit: Math.round(interestSimilarity * 100),
        marketDemandFit: Math.round(demandValue * 100),
        futureGrowthFit: Math.round(growthValue * 100),
      };

      const recommendationItem: CareerRecommendationItem = {
        ...result,
        careerScore: result.score,
        ranking: rankCounter++,
        careerFitAnalysis,
        skillGapAnalysis,
        recommendedCourses,
        learningSequence,
        estimatedPreparationDuration,
      };

      // Categorize candidates based on overall score thresholds
      if (result.score >= 70.0) {
        recommendedCareers.push(recommendationItem);
      } else if (result.score >= 50.0) {
        backupCareers.push(recommendationItem);
      } else {
        notRecommendedCareers.push(recommendationItem);
      }
    }

    const careerMetadata = {
      timestamp,
      totalScored: decisionList.length,
      recommendedCount: recommendedCareers.length,
      backupCount: backupCareers.length,
      notRecommendedCount: notRecommendedCareers.length,
      appliedWeights: mappedWeights,
    };

    // 3. Update Shared AgentContext and return
    return {
      status: AgentStatus.SUCCESS,
      data: {
        recommendedCareers,
        backupCareers,
        notRecommendedCareers,
        careerMetadata,
      },
      reasoning:
        `Processed ${decisionList.length} careers. ` +
        `Categorized: ${recommendedCareers.length} Recommended, ` +
        `${backupCareers.length} Backup, and ${notRecommendedCareers.length} Not Recommended targets.`,
      confidence:
        recommendedCareers.length > 0
          ? recommendedCareers[0].confidence
          : 90.0,
    };
  }
}
