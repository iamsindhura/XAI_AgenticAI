import { FrameworkEventType, FrameworkEventDataMap } from "../types/agent";

/**
 * Generic listener callback type mapped to the event payload.
 */
export type FrameworkEventListener<K extends FrameworkEventType> = (
  data: FrameworkEventDataMap[K]
) => void | Promise<void>;

/**
 * Lightweight, strictly-typed event emitter for broadcasting agentic pipeline milestones.
 */
export class FrameworkEventEmitter {
  private readonly listeners: {
    [K in FrameworkEventType]?: Set<unknown>;
  } = {};

  /**
   * Subscribes a listener to a framework event.
   * @param event The FrameworkEventType.
   * @param listener Callback function receiving the event details.
   */
  public on<K extends FrameworkEventType>(
    event: K,
    listener: FrameworkEventListener<K>
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set<FrameworkEventListener<K>>();
    }
    (this.listeners[event] as Set<FrameworkEventListener<K>>).add(listener);
  }

  /**
   * Unsubscribes a listener from a framework event.
   * @param event The FrameworkEventType.
   * @param listener Callback function to remove.
   */
  public off<K extends FrameworkEventType>(
    event: K,
    listener: FrameworkEventListener<K>
  ): void {
    const registry = this.listeners[event];
    if (registry) {
      (registry as Set<FrameworkEventListener<K>>).delete(listener);
    }
  }

  /**
   * Emits an event, triggering all registered listeners asynchronously.
   * @param event The FrameworkEventType.
   * @param data The payload structure corresponding to the event.
   */
  public emit<K extends FrameworkEventType>(
    event: K,
    data: FrameworkEventDataMap[K]
  ): void {
    const registry = this.listeners[event];
    if (!registry) return;

    // Trigger listeners asynchronously to prevent blocking orchestrator flow
    (registry as Set<FrameworkEventListener<K>>).forEach((listener) => {
      Promise.resolve()
        .then(() => listener(data))
        .catch((error) => {
          // Log listener failures without disrupting the main runtime
          console.error(
            `[EventEmitter] [ERROR] Unhandled exception in listener for event '${event}':`,
            error
          );
        });
    });
  }
}
