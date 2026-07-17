/**
 * Base properties shared across all database record schemas
 * to maintain version tracking and lifecycle information.
 */
export interface BaseSchema {
  /** The semantic version of the schema instance (e.g., "1.0.0") */
  version: string;
  /** ISO 8601 formatted date string indicating when this record was last modified */
  lastUpdated: string;
}

/**
 * Standard dataset envelope pattern wraps dynamic list objects
 * with standardized catalog metadata.
 */
export interface DatasetEnvelope<T> {
  metadata: {
    version: string;
    source: string;
    lastUpdated: string;
    recordCount: number;
  };
  data: T[];
}
