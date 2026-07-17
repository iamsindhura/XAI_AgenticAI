import { DefaultAgentRegistry } from "./agents/registry";
import { PlannerAgent } from "./agents/planner-agent";
import { ProfileAgent } from "./agents/profile-agent";
import { CollegeRecommendationAgent } from "./agents/college-recommendation-agent";
import { ComparisonAgent } from "./agents/comparison-agent";
import { CareerRecommendationAgent } from "./agents/career-recommendation-agent";
import { CertificationRecommendationAgent } from "./agents/certification-recommendation-agent";
import { LearningRoadmapAgent } from "./agents/learning-roadmap-agent";
import { ExplainabilityAgent } from "./agents/explainability-agent";
import { AgentOrchestrator } from "./orchestrator/orchestrator";
import { FrameworkEventEmitter } from "./services/event-emitter";
import { ConsoleLogger } from "./services/logger";
import { StudentProfile } from "./knowledge/schemas/student";
import { AgentContext } from "./types/agent";
import { DecisionSummaryService } from "./presentation/decision-summary-service";

async function runSummaryDemo() {
  const logger = new ConsoleLogger("SummaryDemo");
  logger.info("Initializing counseling pipeline for Final Summary Presentation...");

  // 1. Initialize Event Emitter & Registries
  const eventEmitter = new FrameworkEventEmitter();
  const registry = new DefaultAgentRegistry();

  const profileAgent = new ProfileAgent();
  const collegeAgent = new CollegeRecommendationAgent();
  const comparisonAgent = new ComparisonAgent();
  const careerAgent = new CareerRecommendationAgent();
  const certAgent = new CertificationRecommendationAgent();
  const roadmapAgent = new LearningRoadmapAgent();
  const explainAgent = new ExplainabilityAgent();
  const plannerAgent = new PlannerAgent(registry);

  registry.register(profileAgent);
  registry.register(collegeAgent);
  registry.register(comparisonAgent);
  registry.register(careerAgent);
  registry.register(certAgent);
  registry.register(roadmapAgent);
  registry.register(explainAgent);
  registry.register(plannerAgent);

  // 2. Define Mock Student Profile
  const mockStudent: StudentProfile = {
    version: "1.0.0",
    lastUpdated: "2026-07-16",
    id: "student-sindhu",
    name: "Sindhu Sharma",
    exam: "JEE Mains",
    rank: 4500,
    collegesAvailable: [],
    branchAllocated: "Mechanical Engineering",
    budget: 300000,
    preferredLocation: ["New Delhi", "Bengaluru"],
    interests: ["Artificial Intelligence", "Machine Learning", "Software Engineering"],
    preferredCareer: ["career-ai-engineer"],
    hostelPreference: true,
    currentSkills: ["Python", "Basic SQL", "Linear Algebra"],
    preferredLearningStyle: "PRACTICAL",
    preferredCompanyType: ["STARTUP", "PRODUCT"],
    higherStudiesInterest: false,
    entrepreneurshipInterest: true,
    metadata: {
      currentSemester: 4,
    },
  };

  // 3. Initialize Shared Agent Context
  const initialContext: Partial<AgentContext> = {
    studentProfile: mockStudent,
    metadata: {
      timestamp: "2026-07-16T22:00:00.000Z",
      comparisonTargets: ["college-iit-delhi", "college-bits-pilani"],
    },
  };

  const orchestrator = new AgentOrchestrator(registry, eventEmitter);

  // 4. Run full pipeline
  logger.info("Executing planner and running all counseling agents...");
  const report = await orchestrator.executePlanner(
    "Analyze profile, recommend colleges, compare, recommend careers, certifications, roadmaps, and generate explanations.",
    initialContext
  );

  logger.info(`Orchestrator pipeline finished with success: ${report.success}`);

  // 5. Assemble via DecisionSummaryService
  logger.info("----------------------------------------------------------------");
  logger.info("ASSEMBLING FINAL presentation PAYLOAD VIA SUMMARY SERVICE");
  logger.info("----------------------------------------------------------------");

  const summary = DecisionSummaryService.assemble(report.finalContext, report);

  logger.info("Validation Checks:");
  logger.info(`- Student Profile parsed: ${summary.studentProfile ? "OK" : "FAILED"}`);
  logger.info(`- Analyzed Profile parsed: ${summary.analyzedProfile ? "OK" : "FAILED"}`);
  logger.info(
    `- College recommendations: ${summary.collegeRecommendation.recommended.length} Recommended, ${summary.collegeRecommendation.backup.length} Backup`
  );
  logger.info(`- Rejection analyses: ${summary.whyNotAnalysis.length} college audits`);
  logger.info(`- Comparisons: ${summary.comparisonResults.length} reports`);
  logger.info(
    `- Career recommendations: ${summary.careerRecommendation.recommended.length} Recommended, ${summary.careerRecommendation.backup.length} Backup`
  );
  logger.info(`- Aligned courses: ${summary.recommendedCourses.length} items`);
  logger.info(`- Certification recommendations: ${summary.certificationRecommendation.recommended.length} items`);
  logger.info(`- Certification sequence path: ${summary.certificationPath.length} steps`);
  logger.info(`- Enriched Roadmap milestones: ${summary.personalizedRoadmap.roadmap.milestones.length} semesters`);
  logger.info(`- AI explanations loaded: ${summary.aiExplanation.overallExplanation ? "OK" : "FAILED"}`);
  logger.info(`- Metadata generated: Time: ${summary.metadata.pipelineExecutionTime.toFixed(2)}ms`);

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: PRESENTATION SUMMARY METADATA");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(summary.metadata, null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("DEMO COMPLETED SUCCESSFULLY.");
  logger.info("----------------------------------------------------------------");
}

runSummaryDemo().catch((err) => console.error("Fatal Error running summary demo:", err));
