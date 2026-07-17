import { BaseSchema } from "./base";

/**
 * Representation of a specific professional career path.
 */
export interface Career extends BaseSchema {
  /** Unique career identifier (e.g. "career-ai-engineer") */
  id: string;
  /** Name of the career role */
  name: string;
  /** Detailed description of roles and duties */
  description: string;
  /** Current market hiring demand level ("HIGH", "MEDIUM", "LOW") */
  demand: "HIGH" | "MEDIUM" | "LOW" | string;
  /** Expected entry/mid-level annual salary bracket details */
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  /** Core skill requirements (e.g. ["Python", "Machine Learning"]) */
  requiredSkills: string[];
  /** Aligned academic engineering branches (e.g. ["CSE", "IT"]) */
  recommendedBranch: string[];
  /** Overview of future growth and technical relevance (e.g., "15% annual growth") */
  futureGrowth: string;
  /** Subjective entry difficulty level ("EASY", "MEDIUM", "HARD") */
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  /** Flexible employment setups allowed ("REMOTE", "HYBRID", "ON_SITE") */
  workMode: "REMOTE" | "HYBRID" | "ON_SITE" | string;
  /** Business domains that recruit heavily for this profile (e.g. ["FinTech", "Healthcare"]) */
  industryDomains: string[];
  /** Typical timeframe required to upskill into this role (e.g. "6-12 months") */
  averageLearningTime: string;
  /** Major enterprise recruiters for this profile (e.g. ["Google", "Meta"]) */
  topRecruiters: string[];
}
