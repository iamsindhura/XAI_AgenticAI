import { Agent, AgentContext, AgentRegistry } from "../types/agent";

/**
 * Concrete implementation of the central Agent Registry.
 * Decouples the orchestrator from direct agent initialization.
 */
export class DefaultAgentRegistry<TContext extends AgentContext = AgentContext>
  implements AgentRegistry<TContext>
{
  private readonly agents = new Map<string, Agent<TContext>>();

  /**
   * Registers an agent. Throws if an agent with the same ID already exists.
   * @param agent The Agent instance.
   */
  public register(agent: Agent<TContext>): void {
    if (!agent.id) {
      throw new Error("Cannot register an agent without a valid ID.");
    }
    if (this.agents.has(agent.id)) {
      throw new Error(
        `Registration collision: Agent with ID '${agent.id}' is already registered.`
      );
    }
    this.agents.set(agent.id, agent);
  }

  /**
   * Resolves an agent by its unique identifier.
   * @param id The agent ID.
   * @returns The Agent instance if found, or undefined.
   */
  public get(id: string): Agent<TContext> | undefined {
    return this.agents.get(id);
  }

  /**
   * Retrieves all registered agent instances.
   * @returns Array of registered agents.
   */
  public getAll(): Agent<TContext>[] {
    return Array.from(this.agents.values());
  }

  /**
   * Checks if an agent with the given ID exists.
   * @param id The agent ID.
   * @returns True if registered, false otherwise.
   */
  public has(id: string): boolean {
    return this.agents.has(id);
  }
}
