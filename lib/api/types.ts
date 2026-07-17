import { StudentProfile } from "../../src/knowledge/schemas/student";
import { SummaryResponse } from "../../src/presentation/decision-summary-service";

export type PipelineStatus = 
  | "IDLE" 
  | "VALIDATING" 
  | "SUBMITTING" 
  | "PROCESSING" 
  | "SUCCESS" 
  | "FAILED";

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
