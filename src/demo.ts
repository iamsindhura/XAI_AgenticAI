import { DefaultAgentRegistry } from "./agents/registry";
import { PlannerAgent } from "./agents/planner-agent";
import { BaseAgent } from "./agents/base-agent";
import { AgentOrchestrator } from "./orchestrator/orchestrator";
import { FrameworkEventEmitter } from "./services/event-emitter";
import { ConsoleLogger } from "./services/logger";
import { AgentContext, AgentResult, AgentStatus } from "./types/agent";
import { KnowledgeBase } from "./knowledge";

// ==========================================
// 1. DEFINE MOCK AGENTS
// ==========================================

/**
 * Agent 1: Analyzes raw input text. No dependencies.
 */
class InputAnalysisAgent extends BaseAgent<AgentContext> {
  public readonly id = "input-analysis-agent";
  public readonly name = "Input Analysis Agent";
  public readonly description = "Analyzes input text to extract metadata and sentiment clues.";
  public readonly version = "1.0.0";
  public readonly priority = 10;
  public readonly dependencies: string[] = [];

  protected async run(
    context: AgentContext
  ): Promise<
    Pick<AgentResult, "status" | "data" | "reasoning" | "confidence">
  > {
    const goal = (context.metadata.goal as string) || "";
    this.logger.info(`Analyzing goal characters and tone.`);

    const isPolite = goal.toLowerCase().includes("please") || goal.toLowerCase().includes("thank");
    const wordCount = goal.split(/\s+/).filter(Boolean).length;

    return {
      status: AgentStatus.SUCCESS,
      data: {
        memory: {
          analyzedText: goal,
          wordCount,
          sentiment: isPolite ? "polite" : "neutral",
        },
      },
      reasoning: `Goal text has ${wordCount} words. Detected ${
        isPolite ? "POLITE" : "NEUTRAL"
      } tone in the input.`,
      confidence: 0.95,
    };
  }
}

/**
 * Agent 2: Formats results. Depends on InputAnalysisAgent.
 * Suggests routing to PoliteGreetingAgent if polite sentiment is detected.
 */
class DataFormattingAgent extends BaseAgent<AgentContext> {
  public readonly id = "data-formatting-agent";
  public readonly name = "Data Formatting Agent";
  public readonly description = "Formats the analysis output into a structured string.";
  public readonly version = "1.0.0";
  public readonly priority = 5;
  public readonly dependencies = ["input-analysis-agent"];

  protected async run(
    context: AgentContext
  ): Promise<
    Pick<
      AgentResult,
      "status" | "data" | "reasoning" | "confidence" | "nextAgent"
    >
  > {
    const wordCount = (context.memory.wordCount as number) || 0;
    const sentiment = (context.memory.sentiment as string) || "unknown";

    this.logger.info("Formatting analysis data.");
    const formattedResult = `SUMMARY | Words: ${wordCount} | Tone: ${sentiment.toUpperCase()}`;

    // Decide dynamic routing next step based on state
    const nextAgent = sentiment === "polite" ? "polite-greeting-agent" : undefined;

    return {
      status: AgentStatus.SUCCESS,
      data: {
        formattedResult,
      },
      reasoning: `Formatted results to: "${formattedResult}". ${
        nextAgent
          ? "Polite tone detected, requesting dynamic nextAgent: polite-greeting-agent."
          : "No dynamic follow-up required."
      }`,
      confidence: 0.98,
      nextAgent,
    };
  }
}

/**
 * Agent 3: Optional Follow-up. Depends on DataFormattingAgent.
 * Only run dynamically if requested by the routing system.
 */
class PoliteGreetingAgent extends BaseAgent<AgentContext> {
  public readonly id = "polite-greeting-agent";
  public readonly name = "Polite Greeting Agent";
  public readonly description = "Generates appreciation log message for polite requests.";
  public readonly version = "1.0.0";
  public readonly priority = 1;
  public readonly dependencies = ["data-formatting-agent"];

  protected async run(
    context: AgentContext
  ): Promise<
    Pick<AgentResult, "status" | "data" | "reasoning" | "confidence">
  > {
    void context;
    this.logger.info("Generating polite acknowledgment.");
    return {
      status: AgentStatus.SUCCESS,
      data: {
        memory: {
          greetingMessage: "Hello! We hope you have an incredible day. Thank you for your request!",
        },
      },
      reasoning: "Politeness conditions satisfied. Greeting generated successfully.",
      confidence: 1.0,
    };
  }
}

// ==========================================
// 2. DEMO PIPELINE EXECUTION
// ==========================================
async function runDemo() {
  const logger = new ConsoleLogger("DemoSystem");
  logger.info("Initializing Agentic AI Framework Demo...");

  logger.info("Validating Knowledge Base datasets...");
  const validationSuccess = KnowledgeBase.validateAll();
  if (validationSuccess) {
    logger.info("Knowledge Base validation: SUCCESS. All catalog datasets strictly conform to typescript schemas.");
  } else {
    logger.error("Knowledge Base validation: FAILED. Datasets contain structural schema anomalies. Aborting.");
    process.exit(1);
  }

  // Instantiate Event Emitter and Agent Registry
  const eventEmitter = new FrameworkEventEmitter();
  const registry = new DefaultAgentRegistry();

  // Register agents inside the registry
  const analysisAgent = new InputAnalysisAgent();
  const formatAgent = new DataFormattingAgent();
  const greetingAgent = new PoliteGreetingAgent();
  const plannerAgent = new PlannerAgent(registry);

  registry.register(analysisAgent);
  registry.register(formatAgent);
  registry.register(greetingAgent);
  registry.register(plannerAgent);

  logger.info(`Registered ${registry.getAll().length} agents in the registry.`);

  // Instantiate Orchestrator
  const orchestrator = new AgentOrchestrator(registry, eventEmitter);

  // ==========================================
  // 3. SUBSCRIBE TO LIFE-CYCLE EVENTS (Timeline visualization)
  // ==========================================
  eventEmitter.on("AgentStarted", (data) => {
    console.log(
      `\x1b[36m[EVENT: AgentStarted]      Agent: ${data.agentName} (${data.agentId}) has begun execution.\x1b[0m`
    );
  });

  eventEmitter.on("AgentCompleted", (data) => {
    console.log(
      `\x1b[32m[EVENT: AgentCompleted]    Agent: ${data.agentName} (${data.agentId}) succeeded with confidence ${data.result.confidence.toFixed(
        2
      )}.\x1b[0m`
    );
  });

  eventEmitter.on("AgentFailed", (data) => {
    console.log(
      `\x1b[31m[EVENT: AgentFailed]       Agent: ${data.agentName} (${data.agentId}) failed. Error: ${data.error}\x1b[0m`
    );
  });

  eventEmitter.on("ContextUpdated", (data) => {
    console.log(
      `\x1b[35m[EVENT: ContextUpdated]    Agent: ${data.agentId} updated context keys: [${data.updatedKeys.join(
        ", "
      )}]\x1b[0m`
    );
  });

  // ==========================================
  // 4. RUN PLANNER-DRIVEN EXECUTION WITH DYNAMIC ROUTING
  // ==========================================
  logger.info("----------------------------------------------------------------");
  logger.info("SCENARIO 1: Planner-driven execution with polite trigger (triggers dynamic routing)");
  logger.info("----------------------------------------------------------------");

  const politeGoal = "Please extract the text metadata and then format it nicely.";
  const report1 = await orchestrator.executePlanner(politeGoal);

  logger.info("----------------------------------------------------------------");
  logger.info("SCENARIO 1 REPORT:");
  logger.info(`Success: ${report1.success}`);
  logger.info(`Total Execution Time: ${report1.totalExecutionTime.toFixed(2)}ms`);
  logger.info(`Final Context Memory: ${JSON.stringify(report1.finalContext.memory, null, 2)}`);
  logger.info(`Final Context Output: ${JSON.stringify(report1.finalContext.formattedResult)}`);
  console.log("\nChronological Logs:");
  report1.logs.forEach((log, index) => {
    console.log(
      `  [Step ${index + 1}] ${log.agentName} -> Status: ${
        log.status
      } | Duration: ${log.executionDuration.toFixed(2)}ms | Reasoning: ${log.reasoningSummary}`
    );
  });

  // ==========================================
  // 5. RUN PLANNER-DRIVEN EXECUTION WITHOUT DYNAMIC ROUTING
  // ==========================================
  logger.info("\n----------------------------------------------------------------");
  logger.info("SCENARIO 2: Planner-driven execution with neutral trigger (no dynamic routing)");
  logger.info("----------------------------------------------------------------");

  const neutralGoal = "Format analysis text.";
  const report2 = await orchestrator.executePlanner(neutralGoal);

  logger.info("----------------------------------------------------------------");
  logger.info("SCENARIO 2 REPORT:");
  logger.info(`Success: ${report2.success}`);
  logger.info(`Total Execution Time: ${report2.totalExecutionTime.toFixed(2)}ms`);
  logger.info(`Final Context Memory: ${JSON.stringify(report2.finalContext.memory, null, 2)}`);
  logger.info(`Final Context Output: ${JSON.stringify(report2.finalContext.formattedResult)}`);
  console.log("\nChronological Logs:");
  report2.logs.forEach((log, index) => {
    console.log(
      `  [Step ${index + 1}] ${log.agentName} -> Status: ${
        log.status
      } | Duration: ${log.executionDuration.toFixed(2)}ms | Reasoning: ${log.reasoningSummary}`
    );
  });

  // ==========================================
  // 6. RUN SEQUENTIAL EXECUTION WITH DEPENDENCY VIOLATION
  // ==========================================
  logger.info("\n----------------------------------------------------------------");
  logger.info("SCENARIO 3: Direct Sequential execution with out-of-order dependencies (Fails Validation)");
  logger.info("----------------------------------------------------------------");

  // Invalid order: DataFormattingAgent depends on InputAnalysisAgent, but we scheduled formatting first!
  const invalidSteps = ["data-formatting-agent", "input-analysis-agent"];
  const report3 = await orchestrator.executeSequence(invalidSteps, {}, "Try running format before analysis.");

  logger.info("----------------------------------------------------------------");
  logger.info("SCENARIO 3 REPORT:");
  logger.info(`Success: ${report3.success}`);
  logger.info(`Pipeline Error Message: ${report3.error}`);
}

runDemo().catch((err) => console.error("Fatal Error running demo:", err));
