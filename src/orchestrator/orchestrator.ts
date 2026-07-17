import {
  AgentContext,
  AgentRegistry,
  AgentStatus,
  OrchestratorReport,
  ExecutionLogEntry,
  ExecutionPlan,
  AgentResult,
} from "../types/agent";
import { FrameworkEventEmitter } from "../services/event-emitter";
import { Logger, ConsoleLogger } from "../services/logger";
import { PlannerAgent } from "../agents/planner-agent";

/**
 * Orchestrator class responsible for running plans of agents,
 * validating execution dependencies, updating state context, routing next agents,
 * and emitting lifecycle events.
 */
export class AgentOrchestrator<TContext extends AgentContext = AgentContext> {
  private readonly registry: AgentRegistry<TContext>;
  private readonly eventEmitter: FrameworkEventEmitter;
  private readonly logger: Logger;
  private readonly maxExecutionLimit = 50; // Prevents infinite dynamic routing loops

  /**
   * Instantiates the AgentOrchestrator.
   * @param registry The central registry mapping agent IDs to implementations.
   * @param eventEmitter Optional FrameworkEventEmitter to dispatch event notifications.
   * @param logger Optional Logger service instance.
   */
  constructor(
    registry: AgentRegistry<TContext>,
    eventEmitter?: FrameworkEventEmitter,
    logger?: Logger
  ) {
    this.registry = registry;
    this.eventEmitter = eventEmitter || new FrameworkEventEmitter();
    this.logger = logger || new ConsoleLogger("Orchestrator");
  }

  /**
   * Exposes the Event Emitter so external code/UI can subscribe to framework events.
   */
  public getEvents(): FrameworkEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Exposes the Agent Registry.
   */
  public getRegistry(): AgentRegistry<TContext> {
    return this.registry;
  }

  /**
   * Deep-copies the initial context to ensure isolation and prevent memory leakage.
   */
  private createContext(initial?: Partial<TContext>): TContext {
    const defaultContext = {
      memory: {},
      metadata: {},
    } as unknown as TContext;

    if (!initial) {
      return defaultContext;
    }

    // Perform a safe deep copy for base primitives, allowing custom objects as-is
    return {
      ...defaultContext,
      ...initial,
      memory: {
        ...defaultContext.memory,
        ...(initial.memory || {}),
      },
      metadata: {
        ...defaultContext.metadata,
        ...(initial.metadata || {}),
      },
    };
  }

  /**
   * Validates if the planned execution sequence complies with dependency order constraints.
   * Throws an error if a dependency runs out of order or is not scheduled.
   * @param steps Ordered list of agent IDs.
   */
  private validateSequence(steps: string[]): void {
    const scheduled = new Set<string>();

    for (const id of steps) {
      const agent = this.registry.get(id);
      if (!agent) {
        throw new Error(
          `Dependency Validation Failure: Agent ID '${id}' in execution sequence is not registered.`
        );
      }

      for (const depId of agent.dependencies) {
        if (!scheduled.has(depId)) {
          throw new Error(
            `Dependency Violation: Agent '${agent.name}' (${id}) requires '${depId}' to run beforehand, but it is not scheduled prior in this plan.`
          );
        }
      }
      scheduled.add(id);
    }
  }

  /**
   * Executes a list of agent IDs sequentially.
   * Includes dependency checks, event emission, merging context, and dynamic next-agent routing.
   * @param steps Initial planned sequence of agent IDs to run.
   * @param initialContext Initial starting values for context.
   * @param goal The high-level objective description.
   */
  public async executeSequence(
    steps: string[],
    initialContext?: Partial<TContext>,
    goal?: string
  ): Promise<OrchestratorReport<TContext>> {
    const startTime = performance.now();
    const contextSnapshot = this.createContext(initialContext);
    
    // Inject goal into metadata if provided
    if (goal) {
      contextSnapshot.metadata.goal = goal;
    }

    this.logger.info(
      `Starting pipeline execution for goal: "${goal || "Sequential Execution"}"`
    );

    // Validate the initial execution steps
    try {
      this.validateSequence(steps);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Validation aborted execution: ${msg}`);
      return {
        success: false,
        goal,
        initialContext: this.createContext(initialContext),
        finalContext: contextSnapshot,
        logs: [],
        totalExecutionTime: performance.now() - startTime,
        error: `Pipeline validation failed: ${msg}`,
      };
    }

    const logs: ExecutionLogEntry[] = [];
    const queue = [...steps];
    const completedSuccessfully = new Set<string>();
    let success = true;
    let stepCount = 0;
    let pipelineError: string | undefined;

    while (queue.length > 0) {
      stepCount++;
      if (stepCount > this.maxExecutionLimit) {
        pipelineError = `Pipeline safety limit exceeded: processed over ${this.maxExecutionLimit} steps. Possible dynamic routing loop.`;
        this.logger.error(pipelineError);
        success = false;
        break;
      }

      const currentId = queue.shift()!;
      const agent = this.registry.get(currentId);

      if (!agent) {
        pipelineError = `Execution failure: Agent '${currentId}' is missing from the registry.`;
        this.logger.error(pipelineError);
        success = false;
        break;
      }

      // Dynamic routing validation: if an agent was dynamically injected, verify its dependencies are satisfied
      const unsatisfiedDep = agent.dependencies.find(
        (depId) => !completedSuccessfully.has(depId)
      );
      if (unsatisfiedDep) {
        pipelineError = `Dynamic routing failure: Agent '${agent.name}' (${currentId}) was queued next, but its dependency '${unsatisfiedDep}' has not executed successfully in this run.`;
        this.logger.error(pipelineError);
        success = false;
        break;
      }

      // Emit AgentStarted Event
      this.eventEmitter.emit("AgentStarted", {
        agentId: agent.id,
        agentName: agent.name,
        context: contextSnapshot,
      });

      const stepStartTime = performance.now();
      
      // Execute the Agent
      const result: AgentResult = await agent.execute(contextSnapshot);
      
      const stepEndTime = performance.now();
      const duration = stepEndTime - stepStartTime;

      // Accumulate logs
      logs.push({
        agentId: agent.id,
        agentName: agent.name,
        startTime: stepStartTime,
        endTime: stepEndTime,
        executionDuration: duration,
        status: result.status,
        confidenceScore: result.confidence,
        reasoningSummary: result.reasoning,
        error: result.error,
      });

      if (result.status === AgentStatus.FAILED) {
        // Emit AgentFailed Event
        this.eventEmitter.emit("AgentFailed", {
          agentId: agent.id,
          agentName: agent.name,
          error: result.error || result.reasoning,
          context: contextSnapshot,
        });

        pipelineError = `Agent '${agent.name}' (${agent.id}) failed: ${result.reasoning}`;
        success = false;
        break; // Stop pipeline execution on failure
      }

      // Handle successful execution details
      if (result.status === AgentStatus.SUCCESS) {
        completedSuccessfully.add(agent.id);
      }

      // If data was returned, merge it into context and trigger update event
      if (result.data && Object.keys(result.data).length > 0) {
        const updatedKeys: string[] = [];
        
        for (const [key, value] of Object.entries(result.data)) {
          // If value is an object (like memory), do a shallow merge
          if (
            key === "memory" &&
            typeof value === "object" &&
            value !== null
          ) {
            contextSnapshot.memory = {
              ...contextSnapshot.memory,
              ...(value as Record<string, unknown>),
            };
            updatedKeys.push("memory");
          } else if (
            key === "metadata" &&
            typeof value === "object" &&
            value !== null
          ) {
            contextSnapshot.metadata = {
              ...contextSnapshot.metadata,
              ...(value as Record<string, unknown>),
            };
            updatedKeys.push("metadata");
          } else {
            (contextSnapshot as Record<string, unknown>)[key] = value;
            updatedKeys.push(key);
          }
        }

        // Emit ContextUpdated Event
        this.eventEmitter.emit("ContextUpdated", {
          agentId: agent.id,
          updatedKeys,
          context: contextSnapshot,
        });
      }

      // Emit AgentCompleted Event
      this.eventEmitter.emit("AgentCompleted", {
        agentId: agent.id,
        agentName: agent.name,
        result,
        context: contextSnapshot,
      });

      // Handle dynamic routing overrides
      if (result.nextAgent) {
        this.logger.info(
          `Agent '${agent.name}' requested dynamic next execution: '${result.nextAgent}'`
        );
        // Inject nextAgent at the front of the remaining steps queue
        queue.unshift(result.nextAgent);
      }
    }

    const totalDuration = performance.now() - startTime;
    this.logger.info(
      `Pipeline completed. Status: ${
        success ? "SUCCESS" : "FAILED"
      } | Total Time: ${totalDuration.toFixed(2)}ms`
    );

    return {
      success,
      goal,
      initialContext: this.createContext(initialContext),
      finalContext: contextSnapshot,
      logs,
      totalExecutionTime: totalDuration,
      error: pipelineError,
    };
  }

  /**
   * Planner-driven execution pipeline.
   * Runs the Planner Agent to build an ExecutionPlan, then executes it sequentially.
   * @param goal The natural language objective.
   * @param initialContext Initial starting values for context.
   */
  public async executePlanner(
    goal: string,
    initialContext?: Partial<TContext>
  ): Promise<OrchestratorReport<TContext>> {
    const startTime = performance.now();
    const contextSnapshot = this.createContext(initialContext);
    contextSnapshot.metadata.goal = goal;

    this.logger.info(`Starting planner-driven execution for goal: "${goal}"`);

    // 1. Locate Planner Agent
    const planner = this.registry.get("planner-agent") as
      | PlannerAgent
      | undefined;
    if (!planner) {
      return {
        success: false,
        goal,
        initialContext: this.createContext(initialContext),
        finalContext: contextSnapshot,
        logs: [],
        totalExecutionTime: performance.now() - startTime,
        error:
          "Orchestration Failure: 'planner-agent' is not registered in the Agent Registry.",
      };
    }

    // 2. Execute Planner to get the execution plan
    const plannerResult = await planner.execute(contextSnapshot);
    if (plannerResult.status !== AgentStatus.SUCCESS || !plannerResult.data?.executionPlan) {
      return {
        success: false,
        goal,
        initialContext: this.createContext(initialContext),
        finalContext: contextSnapshot,
        logs: [
          {
            agentId: planner.id,
            agentName: planner.name,
            startTime,
            endTime: performance.now(),
            executionDuration: performance.now() - startTime,
            status: plannerResult.status,
            confidenceScore: plannerResult.confidence,
            reasoningSummary: plannerResult.reasoning,
            error: plannerResult.error,
          },
        ],
        totalExecutionTime: performance.now() - startTime,
        error: `Planner failed to generate plan: ${plannerResult.reasoning}`,
      };
    }

    const plan = plannerResult.data.executionPlan as ExecutionPlan;
    this.logger.info(
      `Plan generated successfully by Planner Agent. Steps: ${plan.steps.join(
        ", "
      )}`
    );

    // 3. Hand off the execution steps to sequential executor
    const seqReport = await this.executeSequence(
      plan.steps,
      contextSnapshot,
      goal
    );

    // Prepend planner logs to the sequential execution logs
    const fullLogs: ExecutionLogEntry[] = [
      {
        agentId: planner.id,
        agentName: planner.name,
        startTime,
        endTime: startTime + plannerResult.executionTime,
        executionDuration: plannerResult.executionTime,
        status: plannerResult.status,
        confidenceScore: plannerResult.confidence,
        reasoningSummary: plannerResult.reasoning,
      },
      ...seqReport.logs,
    ];

    return {
      ...seqReport,
      logs: fullLogs,
      totalExecutionTime: performance.now() - startTime,
    };
  }
}
