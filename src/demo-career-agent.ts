import { DefaultAgentRegistry } from "./agents/registry";
import { PlannerAgent } from "./agents/planner-agent";
import { ProfileAgent } from "./agents/profile-agent";
import { CollegeRecommendationAgent } from "./agents/college-recommendation-agent";
import { ComparisonAgent } from "./agents/comparison-agent";
import { CareerRecommendationAgent } from "./agents/career-recommendation-agent";
import { AgentOrchestrator } from "./orchestrator/orchestrator";
import { FrameworkEventEmitter } from "./services/event-emitter";
import { ConsoleLogger } from "./services/logger";
import { StudentProfile } from "./knowledge/schemas/student";
import { AgentContext } from "./types/agent";

async function runCareerAgentDemo() {
  const logger = new ConsoleLogger("CareerAgentDemo");
  logger.info("Initializing Career Recommendation Agent Demonstration...");

  // 1. Initialize Event Emitter & Registries
  const eventEmitter = new FrameworkEventEmitter();
  const registry = new DefaultAgentRegistry();

  const profileAgent = new ProfileAgent();
  const collegeAgent = new CollegeRecommendationAgent();
  const comparisonAgent = new ComparisonAgent();
  const careerAgent = new CareerRecommendationAgent();
  const plannerAgent = new PlannerAgent(registry);

  registry.register(profileAgent);
  registry.register(collegeAgent);
  registry.register(comparisonAgent);
  registry.register(careerAgent);
  registry.register(plannerAgent);

  logger.info("Registered Planner, Profile, College, Comparison, and Career agents.");

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

  // 4. Subscribe to Event Milestones
  eventEmitter.on("AgentStarted", (data) => {
    console.log(
      `\x1b[36m[EVENT: AgentStarted]      Agent: ${data.agentName} (${data.agentId}) started execution.\x1b[0m`
    );
  });

  eventEmitter.on("AgentCompleted", (data) => {
    console.log(
      `\x1b[32m[EVENT: AgentCompleted]    Agent: ${data.agentName} (${data.agentId}) succeeded. Confidence: ${data.result.confidence}%\x1b[0m`
    );
  });

  eventEmitter.on("ContextUpdated", (data) => {
    console.log(
      `\x1b[35m[EVENT: ContextUpdated]    Agent: ${data.agentId} modified keys: [${data.updatedKeys.join(
        ", "
      )}]\x1b[0m`
    );
  });

  // 5. Run Planner-Driven Pipeline Execution
  logger.info("----------------------------------------------------------------");
  logger.info("RUNNING PIPELINE: PLANNER-DRIVEN RECONSTRUCTED WORKFLOW");
  logger.info("----------------------------------------------------------------");

  const report = await orchestrator.executePlanner(
    "Please analyze the student, recommend colleges, compare them, and recommend careers.",
    initialContext
  );

  logger.info("----------------------------------------------------------------");
  logger.info("PLANNER RUN COMPLETED.");
  logger.info(`Pipeline success status: ${report.success}`);
  logger.info(`Total Execution Time: ${report.totalExecutionTime.toFixed(2)}ms`);

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: RECOMMENDED CAREERS (TOP MATCH)");
  logger.info("----------------------------------------------------------------");
  const topCareer = (report.finalContext.recommendedCareers as any[])[0] || (report.finalContext.backupCareers as any[])[0];
  console.log(JSON.stringify(topCareer, null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: OTHER CAREERS LISTINGS (BACKUP & NOT RECOMMENDED)");
  logger.info("----------------------------------------------------------------");
  console.log(
    JSON.stringify(
      {
        backupCount: (report.finalContext.backupCareers as any[]).length,
        notRecommendedCount: (report.finalContext.notRecommendedCareers as any[]).length,
        backupTitles: (report.finalContext.backupCareers as any[]).map((c) => c.data.name),
        notRecommendedTitles: (report.finalContext.notRecommendedCareers as any[]).map(
          (c) => c.data.name
        ),
      },
      null,
      2
    )
  );

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: CAREER DECISION METADATA");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(report.finalContext.careerMetadata, null, 2));
}

runCareerAgentDemo().catch((err) => console.error("Fatal Error running career demo:", err));
