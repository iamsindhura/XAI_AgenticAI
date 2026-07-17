import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
} from "../types/agent";
import { Certification } from "../knowledge/schemas/certification";
import { StudentProfile } from "../knowledge/schemas/student";
import { KnowledgeBase } from "../knowledge";
import { makeCertificationDecision } from "../decision-engine/modules/certification-decision";
import { DecisionResult } from "../decision-engine/core/types";
import { AnalyzedStudentProfile } from "./profile-agent";
import { CareerRecommendationItem } from "./career-recommendation-agent";

/**
 * Fit score metrics assessing overall and specific alignment factors.
 */
export interface CertificationFitAnalysis {
  overallFit: number;
  skillCoverage: number;
  careerAlignment: number;
  recognitionScore: number;
  difficultyFit: number;
  costFit: number;
  timeCommitmentFit: number;
}

/**
 * Learning benefits outcome summary.
 */
export interface CertificationLearningBenefits {
  skillsCovered: string[];
  prerequisites: string[];
  expectedOutcome: string;
  estimatedPreparationTime: string;
  recommendedSemester: number;
}

/**
 * Recommendation item wrapping certification details, fit analysis, priority, and outcomes.
 */
export interface CertificationRecommendationItem extends Omit<DecisionResult<Certification>, "ranking"> {
  certificationScore: number;
  ranking: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  certificationFitAnalysis: CertificationFitAnalysis;
  learningBenefits: CertificationLearningBenefits;
}

/**
 * Structured step in the certification sequence.
 */
export interface CertificationPathItem {
  order: number;
  certificationId: string;
  certificationName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendedSemester: number;
  estimatedPreparationTime: string;
  dependency?: string;
}

/**
 * Business Agent responsible for evaluating, ranking, and sequencing industry certifications.
 * Builds upskilling priority logs, assesses study loads, and maps certification learning paths.
 */
export class CertificationRecommendationAgent extends BaseAgent<AgentContext> {
  public readonly id = "certification-recommendation-agent";
  public readonly name = "Certification Recommendation Agent";
  public readonly description =
    "Recommends industry-recognized certifications, maps upskilling priority, and sequences learning paths.";
  public readonly version = "1.0.0";
  public readonly priority = 40;
  public readonly dependencies: string[] = ["career-recommendation-agent"];

  /**
   * Executes certification scoring, prioritization, and path sequencing.
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

    const careerRecommended = (context.recommendedCareers || []) as CareerRecommendationItem[];
    const careerBackup = (context.backupCareers || []) as CareerRecommendationItem[];
    const targetCareerItem = careerRecommended[0] || careerBackup[0];

    if (!studentProfile || !analyzedProfile || !targetCareerItem) {
      return {
        status: AgentStatus.FAILED,
        reasoning:
          "Certification recommendation failed: Required context objects 'studentProfile', 'analyzedStudentProfile', or a target career are missing.",
        confidence: 0.0,
      };
    }

    const career = targetCareerItem.data;
    const missingSkills = targetCareerItem.skillGapAnalysis.missingSkills;
    const missingSkillsLower = new Set(missingSkills.map((s) => s.toLowerCase().trim()));

    this.logger.info(`Analyzing certification recommendations for career: '${career.name}'`);

    const timestamp = (context.metadata.timestamp as string) || "2026-07-16T22:00:00.000Z";

    // 1. Invoke Decision Engine Certification Scorer
    const decisionList = makeCertificationDecision(
      studentProfile,
      career,
      KnowledgeBase.certifications,
      undefined,
      timestamp
    );

    const recommendedCertifications: CertificationRecommendationItem[] = [];
    const backupCertifications: CertificationRecommendationItem[] = [];
    const notRecommendedCertifications: CertificationRecommendationItem[] = [];

    const studentSkillsLower = new Set(
      studentProfile.currentSkills.map((s) => s.toLowerCase().trim())
    );

    let rankCounter = 1;

    // 2. Process and enrich candidates
    for (const result of decisionList) {
      const cert = result.data;

      // Calculate skill coverage (fraction of cert skills already possessed by student)
      const certSkills = cert.prerequisites; // prerequisites holds skills in database
      const possessedCertSkills = certSkills.filter((s) =>
        studentSkillsLower.has(s.toLowerCase().trim())
      );
      const skillCoverage = Math.round(
        certSkills.length > 0 ? (possessedCertSkills.length / certSkills.length) * 100 : 100
      );

      // Check if certification addresses any of the student's skill gaps
      const addressesSkillGaps = certSkills.some((s) =>
        missingSkillsLower.has(s.toLowerCase().trim())
      );

      // Determine dynamic priority
      let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
      if (cert.recognitionScore >= 8.0 && addressesSkillGaps) {
        priority = "HIGH";
      } else if (cert.recognitionScore >= 7.0 || addressesSkillGaps) {
        priority = "MEDIUM";
      }

      // Map fit scores
      const costTrace = result.trace.items.find((ti) => ti.criterion === "costScore");
      const durationTrace = result.trace.items.find((ti) => ti.criterion === "durationScore");

      const costFit = costTrace ? Math.round(costTrace.normalizedValue * 100) : 50;
      const timeCommitmentFit = durationTrace ? Math.round(durationTrace.normalizedValue * 100) : 50;

      let difficultyFit = 70; // fallback
      if (cert.difficulty === "EASY") difficultyFit = 100;
      else if (cert.difficulty === "HARD") difficultyFit = 40;

      const certificationFitAnalysis: CertificationFitAnalysis = {
        overallFit: result.score,
        skillCoverage,
        careerAlignment: 100,
        recognitionScore: cert.recognitionScore * 10,
        difficultyFit,
        costFit,
        timeCommitmentFit,
      };

      const learningBenefits: CertificationLearningBenefits = {
        skillsCovered: cert.prerequisites,
        prerequisites: [],
        expectedOutcome: `Attain certified industry credential: ${cert.name}`,
        estimatedPreparationTime: cert.duration,
        recommendedSemester: cert.recommendedSemester,
      };

      const recommendationItem: CertificationRecommendationItem = {
        ...result,
        certificationScore: result.score,
        ranking: rankCounter++,
        priority,
        certificationFitAnalysis,
        learningBenefits,
      };

      // Group by score thresholds
      if (result.score >= 70.0) {
        recommendedCertifications.push(recommendationItem);
      } else if (result.score >= 50.0) {
        backupCertifications.push(recommendationItem);
      } else {
        notRecommendedCertifications.push(recommendationItem);
      }
    }

    // ==========================================
    // 3. GENERATE CERTIFICATION LEARNING PATH
    // ==========================================
    // Merge recommended and backup certifications to sequence the path
    const pathCandidates = [...recommendedCertifications, ...backupCertifications];

    // Sort: foundational first (lower semester ascending, then level difficulty ascending)
    pathCandidates.sort((a, b) => {
      if (a.data.recommendedSemester !== b.data.recommendedSemester) {
        return a.data.recommendedSemester - b.data.recommendedSemester;
      }
      const getDifficultyWeight = (diff: string) => {
        if (diff === "EASY") return 1;
        if (diff === "MEDIUM") return 2;
        return 3;
      };
      return getDifficultyWeight(a.data.difficulty) - getDifficultyWeight(b.data.difficulty);
    });

    const certificationPath: CertificationPathItem[] = pathCandidates.map((item, index) => {
      const cert = item.data;

      // Resolve dependency: if a prior cert in the path has the same provider and lower semester
      let dependency: string | undefined;
      for (let i = 0; i < index; i++) {
        const prevCert = pathCandidates[i].data;
        if (
          prevCert.provider === cert.provider &&
          prevCert.recommendedSemester < cert.recommendedSemester
        ) {
          dependency = prevCert.id;
          break;
        }
      }

      return {
        order: index + 1,
        certificationId: cert.id,
        certificationName: cert.name,
        priority: item.priority,
        recommendedSemester: cert.recommendedSemester,
        estimatedPreparationTime: cert.duration,
        dependency,
      };
    });

    const certificationMetadata = {
      timestamp,
      totalScored: decisionList.length,
      recommendedCount: recommendedCertifications.length,
      backupCount: backupCertifications.length,
      notRecommendedCount: notRecommendedCertifications.length,
      pathLength: certificationPath.length,
    };

    // 4. Update Shared AgentContext and return
    return {
      status: AgentStatus.SUCCESS,
      data: {
        recommendedCertifications,
        backupCertifications,
        notRecommendedCertifications,
        certificationPath,
        certificationMetadata,
      },
      reasoning:
        `Evaluated ${decisionList.length} certifications. ` +
        `Categorized: ${recommendedCertifications.length} Recommended, ` +
        `${backupCertifications.length} Backup. Sequence mapped ${certificationPath.length} certifications in the learning path.`,
      confidence:
        recommendedCertifications.length > 0
          ? recommendedCertifications[0].confidence
          : 90.0,
    };
  }
}
