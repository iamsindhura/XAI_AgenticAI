import { BaseSchema } from "./base";

/**
 * Representation of a student client profile seeking career and college guidance.
 */
export interface StudentProfile extends BaseSchema {
  /** Unique student profile identifier */
  id: string;
  /** Full name of the student */
  name: string;
  /** Competitive entrance exam taken (e.g. "JEE Mains", "GATE") */
  exam: string;
  /** Numerical rank achieved in the exam */
  rank: number;
  /** Array of registered College IDs matching student options or admissions */
  collegesAvailable: string[];
  /** Proposed/allocated engineering branch (e.g. "Mechanical Engineering") */
  branchAllocated: string;
  /** Maximum yearly financial budget limit for college fees */
  budget: number;
  /** Preferred cities or states for the college campus */
  preferredLocation: string[];
  /** Array of core interests or technology domains (e.g. ["Mobile Apps", "Mathematics"]) */
  interests: string[];
  /** Career path IDs the student aspires to enter */
  preferredCareer: string[];
  /** Flag representing student housing preference on campus */
  hostelPreference: boolean;
  /** List of developer or engineering skills already possessed */
  currentSkills: string[];
  /** Primary learning style preference ("VISUAL", "PRACTICAL", "THEORETICAL") */
  preferredLearningStyle: "VISUAL" | "PRACTICAL" | "THEORETICAL" | string;
  /** Preferred corporate scale target ("PRODUCT", "SERVICE", "STARTUP", "RESEARCH") */
  preferredCompanyType: string[];
  /** Boolean representing interest in post-graduate master's or PhD programs */
  higherStudiesInterest: boolean;
  /** Boolean representing aspirations of starting an independent venture */
  entrepreneurshipInterest: boolean;
  /** Optional metadata block for dynamic run configurations */
  metadata?: Record<string, unknown>;
}
