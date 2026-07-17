import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
  ExecutionPlan,
  AgentRegistry,
} from "../types/agent";

/**
 * Specialized Agent responsible for parsing a user's goal, discovering
 * relevant registered agents, and resolving their dependency graph to output
 * a linear execution plan.
 */
export class PlannerAgent extends BaseAgent<AgentContext> {
  public readonly id = "planner-agent";
  public readonly name = "Planner Agent";
  public readonly description =
    "Analyzes goals and schedules agent executions based on dependency resolution.";
  public readonly version = "1.0.0";
  public readonly priority = 100;
  public readonly dependencies: string[] = [];

  private readonly registry: AgentRegistry;

  /**
   * Instantiates the Planner Agent.
   * @param registry The central registry from which to discover available agents.
   */
  constructor(registry: AgentRegistry) {
    super();
    this.registry = registry;
  }

  /**
   * Executes the planning cycle. Resolves dependencies topologically to avoid execution crashes.
   */
  protected async run(
    context: AgentContext
  ): Promise<
    Pick<
      AgentResult,
      "status" | "data" | "reasoning" | "confidence" | "nextAgent"
    >
  > {
    const goal = context.metadata.goal as string;
    if (!goal) {
      return {
        status: AgentStatus.FAILED,
        reasoning: "Execution aborted: No target goal was set in context.metadata.goal.",
        confidence: 0.0,
      };
    }

    this.logger.info(`Analyzing agent graph to satisfy goal: "${goal}"`);

    // 1. Identify target agents whose profiles align with the goal description
    const allAgents = this.registry
      .getAll()
      .filter((agent) => agent.id !== this.id);
    const targetAgentIds = new Set<string>();

    const normalizedGoal = goal.toLowerCase();
    const cleanWord = (w: string) => w.replace(/[^a-z0-9]/g, "");
    const goalWords = normalizedGoal
      .split(/\s+/)
      .map(cleanWord)
      .filter((w: string) => w.length > 2);

    for (const agent of allAgents) {
      const agentText = `${agent.id} ${agent.name} ${agent.description}`.toLowerCase();
      const agentWords = agentText
        .split(/\s+/)
        .map(cleanWord)
        .filter((w: string) => w.length > 2);

      // Check for bidirectional substring overlap of tokens with a length difference limit
      const hasOverlap = goalWords.some((gWord: string) =>
        agentWords.some((aWord: string) => {
          const isSubstring = aWord.includes(gWord) || gWord.includes(aWord);
          const lengthDiff = Math.abs(aWord.length - gWord.length);
          return isSubstring && lengthDiff <= 2;
        })
      );

      if (hasOverlap) {
        targetAgentIds.add(agent.id);
      }
    }

    // Default: If no specific keywords matched, run all registered agents to be thorough
    if (targetAgentIds.size === 0) {
      this.logger.info(
        "No explicit keyword matches found in agent registry. Enlisting all active agents."
      );
      allAgents.forEach((agent) => targetAgentIds.add(agent.id));
    }

    // 2. Perform topological sort with cycle detection to determine execution order
    const orderedSteps: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const dfsResolve = (agentId: string) => {
      if (visiting.has(agentId)) {
        throw new Error(
          `Dependency deadlock: Circular dependency loop detected containing agent '${agentId}'.`
        );
      }
      if (visited.has(agentId)) {
        return;
      }

      visiting.add(agentId);

      const agent = this.registry.get(agentId);
      if (!agent) {
        throw new Error(
          `Unresolved dependency: Agent '${agentId}' is requested but not registered in registry.`
        );
      }

      // Sort dependencies by priority (higher priority first if they have no explicit dependencies between each other)
      const deps = [...agent.dependencies]
        .map((depId) => this.registry.get(depId))
        .filter((a): a is Exclude<typeof a, undefined> => a !== undefined)
        .sort((a, b) => b.priority - a.priority)
        .map((a) => a.id);

      for (const depId of deps) {
        dfsResolve(depId);
      }

      visiting.delete(agentId);
      visited.add(agentId);
      orderedSteps.push(agentId);
    };

    try {
      // Traverse targets. Sort targets by priority to ensure higher priority targets resolve their hierarchies first
      const sortedTargets = Array.from(targetAgentIds)
        .map((id) => this.registry.get(id))
        .filter((a): a is Exclude<typeof a, undefined> => a !== undefined)
        .sort((a, b) => b.priority - a.priority)
        .map((a) => a.id);

      for (const id of sortedTargets) {
        dfsResolve(id);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        status: AgentStatus.FAILED,
        reasoning: `Dependency resolution failure: ${msg}`,
        confidence: 0.0,
      };
    }

    const plan: ExecutionPlan = {
      goal,
      steps: orderedSteps,
      reasoning: `Topologically resolved dependencies. Planned order: ${orderedSteps.join(
        " -> "
      )}`,
    };

    return {
      status: AgentStatus.SUCCESS,
      data: {
        executionPlan: plan,
      },
      reasoning: `Created execution plan with ${plan.steps.length} steps.`,
      confidence: 1.0,
    };
  }
}
