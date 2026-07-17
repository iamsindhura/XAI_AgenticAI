/**
 * Interface defining a structured application logger.
 */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Standard implementation of the Logger interface outputting directly to the system console.
 */
export class ConsoleLogger implements Logger {
  private readonly context: string;

  constructor(context: string = "Framework") {
    this.context = context;
  }

  private formatMeta(meta?: Record<string, unknown>): string {
    if (!meta || Object.keys(meta).length === 0) return "";
    try {
      return ` | Context: ${JSON.stringify(meta)}`;
    } catch {
      return " | [Unserializable Context]";
    }
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    console.log(`[INFO] [${this.context}] [${new Date().toISOString()}] ${message}${this.formatMeta(meta)}`);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] [${this.context}] [${new Date().toISOString()}] ${message}${this.formatMeta(meta)}`);
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] [${this.context}] [${new Date().toISOString()}] ${message}${this.formatMeta(meta)}`);
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[DEBUG] [${this.context}] [${new Date().toISOString()}] ${message}${this.formatMeta(meta)}`);
  }
}
