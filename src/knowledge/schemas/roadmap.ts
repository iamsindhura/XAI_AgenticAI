import { BaseSchema } from "./base";

/**
 * Single developmental step or benchmark target within an academic/professional roadmap.
 */
export interface Milestone {
  /** The target academic semester (e.g. 3) */
  semester: number;
  /** Array of specific subjects or tech topics to learn (e.g. ["SQL Databases", "Express JS"]) */
  topics: string[];
  /** Expected project titles or descriptions to build for hands-on experience */
  projects: string[];
  /** Recommended Certification IDs aligned to validate this milestone's learning */
  certifications: string[];
  /** Measurable competency description resulting from completing this milestone */
  expectedOutcome: string;
}

/**
 * Representation of a structured developmental learning path towards a career.
 */
export interface Roadmap extends BaseSchema {
  /** Unique roadmap identifier (e.g. "roadmap-fullstack-developer") */
  id: string;
  /** Target Career ID that this learning plan supports (e.g. "career-fullstack-dev") */
  careerId: string;
  /** Chronological milestones mapping milestones semester by semester */
  milestones: Milestone[];
}
