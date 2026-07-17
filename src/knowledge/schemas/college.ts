import { BaseSchema } from "./base";

/**
 * Representation of an academic college/university.
 */
export interface College extends BaseSchema {
  /** Unique college identifier (e.g. "college-iit-delhi") */
  id: string;
  /** Name of the university */
  name: string;
  /** City or region location of the campus */
  location: string;
  /** Annual or average academic fee in domestic currency (INR) */
  fees: number;
  /** Average annual package offered during placements in domestic currency (INR) */
  averagePackage: number;
  /** Highest annual package offered in domestic currency (INR) */
  highestPackage: number;
  /** Array of active departments/engineering branches offered (e.g. ["CSE", "ECE"]) */
  branch: string[];
  /** Rating indicating research environment, facilities, and publications (1.0 to 10.0) */
  researchScore: number;
  /** Rating reflecting active programming hubs, hackathons, and open source participation (1.0 to 10.0) */
  codingCultureScore: number;
  /** Rating showing placement efficiency and recruiting partnerships (1.0 to 10.0) */
  placementScore: number;
  /** Flag representing availability of on-campus student housing */
  hostelAvailable: boolean;
  /** National Institutional Ranking Framework rank status */
  nirfRank: number;
  /** Return On Investment score (1.0 to 10.0) computed using fee-to-placement ratio */
  roiScore: number;
  /** Targeted specializations or technology tracks (e.g., ["Artificial Intelligence", "Data Science"]) */
  specialization: string[];
  /** Categorized physical campus setting (e.g. "METRO", "URBAN", "RURAL") */
  campusType: string;
  /** Rating mapping internship tie-ups and pre-placement offers (1.0 to 10.0) */
  internshipSupportScore: number;
  /** Rating of alumni engagement and mentor availability (1.0 to 10.0) */
  alumniNetworkScore: number;
  /** Flag showing active international student exchange programs */
  internationalOpportunities: boolean;
  /** Rating reflecting student incubators and venture creation support (1.0 to 10.0) */
  startupCultureScore: number;
}
