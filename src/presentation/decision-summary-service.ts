import { StudentProfile } from "../knowledge/schemas/student";
import { AnalyzedStudentProfile } from "../agents/profile-agent";
import { CollegeRecommendationItem } from "../agents/college-recommendation-agent";
import { WhyNotReport, CollegeComparisonReport } from "../agents/comparison-agent";
import { CareerRecommendationItem, RecommendedCourseItem } from "../agents/career-recommendation-agent";
import { CertificationRecommendationItem, CertificationPathItem } from "../agents/certification-recommendation-agent";
import { EnrichedPersonalizedRoadmap, RoadmapSummary } from "../agents/learning-roadmap-agent";
import { AgentContext, OrchestratorReport } from "../types/agent";

/**
 * Unified presentation response container consumed directly by user interfaces.
 */
export interface SummaryResponse {
  studentProfile: StudentProfile;
  analyzedProfile: AnalyzedStudentProfile;
  collegeRecommendation: {
    recommended: CollegeRecommendationItem[];
    backup: CollegeRecommendationItem[];
    notRecommended: CollegeRecommendationItem[];
    metadata: {
      timestamp: string;
      totalScored: number;
      recommendedCount: number;
      backupCount: number;
      notRecommendedCount: number;
      appliedWeights: {
        researchScore: number;
        codingCultureScore: number;
        placementScore: number;
      };
    };
  };
  whyNotAnalysis: WhyNotReport[];
  comparisonResults: CollegeComparisonReport[];
  careerRecommendation: {
    recommended: CareerRecommendationItem[];
    backup: CareerRecommendationItem[];
    notRecommended: CareerRecommendationItem[];
    metadata: {
      timestamp: string;
      totalScored: number;
      recommendedCount: number;
      backupCount: number;
      notRecommendedCount: number;
      appliedWeights: {
        demandScore: number;
        growthScore: number;
        salaryScore: number;
        interestMatchScore: number;
      };
    };
  };
  recommendedCourses: RecommendedCourseItem[];
  certificationRecommendation: {
    recommended: CertificationRecommendationItem[];
    backup: CertificationRecommendationItem[];
    notRecommended: CertificationRecommendationItem[];
    metadata: {
      timestamp: string;
      totalScored: number;
      recommendedCount: number;
      backupCount: number;
      notRecommendedCount: number;
      pathLength: number;
    };
  };
  certificationPath: CertificationPathItem[];
  personalizedRoadmap: {
    roadmap: EnrichedPersonalizedRoadmap;
    summary: RoadmapSummary;
    metadata: {
      timestamp: string;
      careerId: string;
      careerName: string;
      milestonesCount: number;
    };
  };
  aiExplanation: {
    collegeExplanation: string;
    whyNotExplanation: string;
    comparisonExplanation: string;
    careerExplanation: string;
    courseExplanation: string;
    certificationExplanation: string;
    roadmapExplanation: string;
    overallExplanation: string;
    quality: {
      groundedEvidenceCoverage: number;
      traceReferencesUsed: string[];
      unsupportedClaims: string[];
      overallQuality: number;
    };
  };
  metadata: {
    pipelineExecutionTime: number;
    completedAgents: string[];
    agentExecutionOrder: string[];
    generatedAt: string;
    systemVersion: string;
  };
}

/**
 * Pure presentation aggregation service.
 * Gathers individual outputs from the context and formats them into a final response.
 */
export class DecisionSummaryService {
  /**
   * Compiles shared AgentContext outputs and OrchestratorReport metrics into a SummaryResponse.
   */
  public static assemble(
    context: AgentContext,
    report: OrchestratorReport
  ): SummaryResponse {
    const studentProfile = context.studentProfile as StudentProfile;
    const analyzedProfile = context.analyzedStudentProfile as AnalyzedStudentProfile;

    const collegeRecommendation = {
      recommended: (context.recommendedColleges || []) as CollegeRecommendationItem[],
      backup: (context.backupColleges || []) as CollegeRecommendationItem[],
      notRecommended: (context.notRecommendedColleges || []) as CollegeRecommendationItem[],
      metadata: (context.collegeDecisionMetadata || {}) as any,
    };

    const whyNotAnalysis = (context.whyNotResults || []) as WhyNotReport[];
    const comparisonResults = (context.comparisonResults || []) as CollegeComparisonReport[];

    const careerRecommendation = {
      recommended: (context.recommendedCareers || []) as CareerRecommendationItem[],
      backup: (context.backupCareers || []) as CareerRecommendationItem[],
      notRecommended: (context.notRecommendedCareers || []) as CareerRecommendationItem[],
      metadata: (context.careerMetadata || {}) as any,
    };

    // Extract courses recommended from the top-ranked career choice
    const targetCareerItem =
      careerRecommendation.recommended[0] || careerRecommendation.backup[0];
    const recommendedCourses = targetCareerItem
      ? targetCareerItem.recommendedCourses
      : [];

    const certificationRecommendation = {
      recommended: (context.recommendedCertifications || []) as CertificationRecommendationItem[],
      backup: (context.backupCertifications || []) as CertificationRecommendationItem[],
      notRecommended: (context.notRecommendedCertifications || []) as CertificationRecommendationItem[],
      metadata: (context.certificationMetadata || {}) as any,
    };

    const certificationPath = (context.certificationPath || []) as CertificationPathItem[];

    const personalizedRoadmap = {
      roadmap: (context.personalizedRoadmap || {}) as EnrichedPersonalizedRoadmap,
      summary: (context.roadmapSummary || {}) as RoadmapSummary,
      metadata: (context.roadmapMetadata || {}) as any,
    };

    const aiExplanation = {
      collegeExplanation: (context.collegeExplanation || "") as string,
      whyNotExplanation: (context.whyNotExplanation || "") as string,
      comparisonExplanation: (context.comparisonExplanation || "") as string,
      careerExplanation: (context.careerExplanation || "") as string,
      courseExplanation: (context.courseExplanation || "") as string,
      certificationExplanation: (context.certificationExplanation || "") as string,
      roadmapExplanation: (context.roadmapExplanation || "") as string,
      overallExplanation: (context.overallExplanation || "") as string,
      quality: (context.explanationQuality || {}) as any,
    };

    const completedAgents = report.logs
      .filter((s) => s.status === "SUCCESS")
      .map((s) => s.agentId);

    const agentExecutionOrder = report.logs.map((s) => s.agentId);

    const generatedAt = new Date().toISOString();
    const systemVersion = "1.0.0";

    return {
      studentProfile,
      analyzedProfile,
      collegeRecommendation,
      whyNotAnalysis,
      comparisonResults,
      careerRecommendation,
      recommendedCourses,
      certificationRecommendation,
      certificationPath,
      personalizedRoadmap,
      aiExplanation,
      metadata: {
        pipelineExecutionTime: report.totalExecutionTime,
        completedAgents,
        agentExecutionOrder,
        generatedAt,
        systemVersion,
      },
    };
  }
}
