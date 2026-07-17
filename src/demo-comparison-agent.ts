import { DefaultAgentRegistry } from "./agents/registry";
import { PlannerAgent } from "./agents/planner-agent";
import { ProfileAgent } from "./agents/profile-agent";
import { CollegeRecommendationAgent } from "./agents/college-recommendation-agent";
import { ComparisonAgent } from "./agents/comparison-agent";
import { AgentOrchestrator } from "./orchestrator/orchestrator";
import { FrameworkEventEmitter } from "./services/event-emitter";
import { ConsoleLogger } from "./services/logger";
import { StudentProfile } from "./knowledge/schemas/student";
import { AgentContext } from "./types/agent";

async function runComparisonAgentDemo() {
  const logger = new ConsoleLogger("ComparisonAgentDemo");
  logger.info("Initializing Why Not & College Comparison Agent Demonstration...");

  // 1. Initialize Event Emitter & Registries
  const eventEmitter = new FrameworkEventEmitter();
  const registry = new DefaultAgentRegistry();

  const profileAgent = new ProfileAgent();
  const collegeAgent = new CollegeRecommendationAgent();
  const comparisonAgent = new ComparisonAgent();
  const plannerAgent = new PlannerAgent(registry);

  registry.register(profileAgent);
  registry.register(collegeAgent);
  registry.register(comparisonAgent);
  registry.register(plannerAgent);

  logger.info("Registered Planner, Profile, College Scorer, and Comparison agents.");

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
      comparisonTargets: ["college-iit-delhi", "college-bits-pilani"], // Explict target comparison
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
  logger.info("RUNNING PIPELINE: PLANNER-DRIVEN REJECTION & COMPARISON");
  logger.info("----------------------------------------------------------------");

  const report = await orchestrator.executePlanner(
    "Please analyze the student profile, recommend colleges, explain rejections, and compare options.",
    initialContext
  );

  logger.info("----------------------------------------------------------------");
  logger.info("PLANNER RUN COMPLETED.");
  logger.info(`Pipeline success status: ${report.success}`);
  logger.info(`Total Execution Time: ${report.totalExecutionTime.toFixed(2)}ms`);

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: WHY NOT RESULTS (REJECTION ANALYSIS FOR A CANDIDATE)");
  logger.info("----------------------------------------------------------------");
  // Print why not result for BITS Pilani (which gets rejected due to fees > 300k budget)
  const bitsWhyNot = (report.finalContext.whyNotResults as any[]).find(
    (wn: { collegeId: string }) => wn.collegeId === "college-bits-pilani"
  );
  console.log(JSON.stringify(bitsWhyNot, null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: COLLEGE COMPARISON RESULTS (DECISION MATRIX & SUMMARY)");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(report.finalContext.comparisonResults, null, 2));

  logger.info("----------------------------------------------------------------");
  logger.info("JSON OUTPUT: COMPARISON METADATA");
  logger.info("----------------------------------------------------------------");
  console.log(JSON.stringify(report.finalContext.comparisonMetadata, null, 2));
}

runComparisonAgentDemo().catch((err) => console.error("Fatal Error running comparison demo:", err));
