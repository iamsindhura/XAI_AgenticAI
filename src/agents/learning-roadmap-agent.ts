import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
} from "../types/agent";
import { StudentProfile } from "../knowledge/schemas/student";
import { KnowledgeBase } from "../knowledge";
import { makeRoadmapDecision } from "../decision-engine/modules/roadmap-decision";
import { CareerRecommendationItem, RecommendedCourseItem } from "./career-recommendation-agent";
import { CertificationRecommendationItem, CertificationPathItem } from "./certification-recommendation-agent";

/**
 * Enrichment milestone details detailing practice, hours, and sequencing.
 */
export interface EnrichedRoadmapMilestone {
  semester: number;
  objectives: string;
  skillsToLearn: string[];
  recommendedCourses: RecommendedCourseItem[];
  certifications: CertificationPathItem[];
  projects: string[];
  codingPractice: string;
  interviewPreparation: string;
  expectedOutcome: string;
  estimatedWeeklyHours: number;
  milestoneTracking: {
    milestoneName: string;
    completionCriteria: string;
    dependencies: string[];
    estimatedDuration: string;
  };
}

/**
 * Personalized student learning roadmap.
 */
export interface EnrichedPersonalizedRoadmap {
  id: string;
  careerId: string;
  careerName: string;
  milestones: EnrichedRoadmapMilestone[];
}

/**
 * Structural summary for the roadmap.
 */
export interface RoadmapSummary {
  totalEstimatedDuration: string;
  totalCourses: number;
  totalCertifications: number;
  totalProjects: number;
  readinessScore: number;
}

/**
 * Business Agent responsible for personalizing learning roadmaps.
 * Merges coursework, certifications, milestones, study load estimates, and readiness metrics.
 */
export class LearningRoadmapAgent extends BaseAgent<AgentContext> {
  public readonly id = "learning-roadmap-agent";
  public readonly name = "Learning Roadmap Agent";
  public readonly description =
    "Generates personalized learning roadmaps detailing semester objectives, courses, projects, practice loads, and readiness.";
  public readonly version = "1.0.0";
  public readonly priority = 30;
  public readonly dependencies: string[] = ["certification-recommendation-agent"];

  /**
   * Executes roadmap sequencing, milestoning, and study load calculations.
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

    const careerRecommended = (context.recommendedCareers || []) as CareerRecommendationItem[];
    const careerBackup = (context.backupCareers || []) as CareerRecommendationItem[];
    const targetCareerItem = careerRecommended[0] || careerBackup[0];

    const certPath = (context.certificationPath || []) as CertificationPathItem[];

    const certRecommended = (context.recommendedCertifications || []) as CertificationRecommendationItem[];
    const certBackup = (context.backupCertifications || []) as CertificationRecommendationItem[];
    const certRecommendations = [...certRecommended, ...certBackup];

    if (!studentProfile || !targetCareerItem) {
      return {
        status: AgentStatus.FAILED,
        reasoning:
          "Roadmap personalization failed: Required context objects 'studentProfile' or 'targetCareer' are missing.",
        confidence: 0.0,
      };
    }

    const career = targetCareerItem.data;
    this.logger.info(`Personalizing learning roadmap for target career: '${career.name}'`);

    const timestamp = (context.metadata.timestamp as string) || "2026-07-16T22:00:00.000Z";

    // 1. Invoke Decision Engine Roadmap Scorer
    const roadmapDecision = makeRoadmapDecision(
      studentProfile,
      career,
      certRecommendations,
      KnowledgeBase.roadmaps,
      timestamp
    );

    const baseRoadmap = roadmapDecision.data;

    const enrichedMilestones: EnrichedRoadmapMilestone[] = [];
    let totalCoursesCount = 0;
    let totalCertsCount = 0;
    let totalProjectsCount = 0;

    const careerCourses = (targetCareerItem.recommendedCourses || []) as RecommendedCourseItem[];

    // 2. Enrich semester-by-semester milestones
    for (const milestone of baseRoadmap.milestones) {
      const sem = milestone.semester;

      // Filter courses scheduled for this semester
      const semCourses = careerCourses.filter((c) => c.recommendedSemester === sem);
      totalCoursesCount += semCourses.length;

      // Filter certifications scheduled for this semester
      const semCerts = certPath.filter((c) => c.recommendedSemester === sem);
      totalCertsCount += semCerts.length;

      totalProjectsCount += milestone.projects.length;

      // Determine semester-specific practice hours and descriptions
      let practiceHours = 5;
      let codingPractice = "Practice basic syntax structures and algorithm loops (5 hours/week)";
      let interviewPreparation = "Draft resume outline and write basic portfolio profile.";

      if (sem >= 7) {
        practiceHours = 10;
        codingPractice = "Practice advanced system design problems and mock interviews (10 hours/week)";
        interviewPreparation = "Refine GitHub repository profile, run mock HR/behavioral interviews, and submit job applications.";
      } else if (sem >= 5) {
        practiceHours = 8;
        codingPractice = "Practice intermediate algorithm patterns and solve LeetCode challenges (8 hours/week)";
        interviewPreparation = "Conduct technical mock interviews on core systems and database constructs.";
      }

      // Calculate total study load (courses load + practice load)
      const coursesWeeklyHours = semCourses.reduce((sum, c) => sum + c.estimatedWeeklyHours, 0);
      const estimatedWeeklyHours = coursesWeeklyHours + practiceHours;

      const objectiveSkills =
        milestone.topicsToLearn.length > 0
          ? milestone.topicsToLearn.join(", ")
          : "Practical integration and upskilling";
      const objectives = `Acquire proficiency in core skills: [${objectiveSkills}]`;

      const milestoneTracking = {
        milestoneName: `Semester ${sem} Upskilling Milestone`,
        completionCriteria:
          milestone.topicsToLearn.length > 0
            ? `Successfully acquire topics: [${milestone.topicsToLearn.join(
                ", "
              )}] and complete projects: [${milestone.projects.join(", ")}]`
            : `Successfully complete projects: [${milestone.projects.join(", ")}]`,
        dependencies: sem > 3 ? [`Semester ${sem - 1} Upskilling Milestone`] : [],
        estimatedDuration: "16 weeks",
      };

      enrichedMilestones.push({
        semester: sem,
        objectives,
        skillsToLearn: milestone.topicsToLearn,
        recommendedCourses: semCourses,
        certifications: semCerts,
        projects: milestone.projects,
        codingPractice,
        interviewPreparation,
        expectedOutcome: milestone.expectedOutcome,
        estimatedWeeklyHours,
        milestoneTracking,
      });
    }

    const personalizedRoadmap: EnrichedPersonalizedRoadmap = {
      id: baseRoadmap.id,
      careerId: baseRoadmap.careerId,
      careerName: baseRoadmap.careerName,
      milestones: enrichedMilestones,
    };

    // 3. Generate Overall Roadmap Summary
    const roadmapSummary: RoadmapSummary = {
      totalEstimatedDuration: `${enrichedMilestones.length * 16} weeks of university study (approx. ${enrichedMilestones.length * 4} months)`,
      totalCourses: totalCoursesCount,
      totalCertifications: totalCertsCount,
      totalProjects: totalProjectsCount,
      readinessScore: targetCareerItem.careerFitAnalysis.technicalFit, // percentage of target career skills already known
    };

    const roadmapMetadata = {
      timestamp,
      careerId: career.id,
      careerName: career.name,
      milestonesCount: enrichedMilestones.length,
    };

    // 4. Update Shared AgentContext and return SUCCESS
    return {
      status: AgentStatus.SUCCESS,
      data: {
        personalizedRoadmap,
        roadmapSummary,
        roadmapMetadata,
        roadmapDecision: {
          score: roadmapDecision.score,
          confidence: roadmapDecision.confidence,
          trace: roadmapDecision.trace,
          audit: roadmapDecision.audit,
        },
      },
      reasoning:
        `Personalized roadmap for career '${career.name}' mapped across ${enrichedMilestones.length} semesters. ` +
        `Total workload: ${totalCoursesCount} courses, ${totalCertsCount} certifications, and ${totalProjectsCount} projects. ` +
        `Calculated career readiness score: ${roadmapSummary.readinessScore}%.`,
      confidence: roadmapDecision.confidence,
    };
  }
}
