import { BaseSchema } from "./base";

/**
 * Representation of an industry certification or credential.
 */
export interface Certification extends BaseSchema {
  /** Unique credential identifier (e.g. "cert-aws-solutions-architect") */
  id: string;
  /** Name of the certification */
  name: string;
  /** Issuing organization or authority (e.g. "Amazon Web Services", "Coursera") */
  provider: string;
  /** Target skill bracket ("BEGINNER", "INTERMEDIATE", "ADVANCED") */
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  /** Average time required to complete preparation and exam (e.g. "40 hours", "3 months") */
  duration: string;
  /** Prerequisite skills or exams required beforehand */
  prerequisites: string[];
  /** Array of aligned career IDs (e.g. ["career-cloud-engineer"]) */
  careerAlignment: string[];
  /** Exam complexity tier ("EASY", "MEDIUM", "HARD") */
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  /** Certification/Exam cost in USD or equivalent currency values */
  cost: number;
  /** Reference link to official credential syllabus */
  officialLink: string;
  /** Flag representing if a proctored/formal examination is mandatory to pass */
  examRequired: boolean;
  /** Duration of validity before expiration (e.g. "3 years", "Lifetime") */
  validity: string;
  /** Suggested university study semester to pursue this credential (e.g. 5) */
  recommendedSemester: number;
  /** Rating of global recognition and HR preference in hiring (1.0 to 10.0) */
  recognitionScore: number;
}
