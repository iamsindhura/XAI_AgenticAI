/**
 * Configuration weight parameters for college, career, and certification scoring.
 * Weights are adjustable and do not need to sum to 1.0; engines will normalize them dynamically.
 */

export const DEFAULT_COLLEGE_WEIGHTS = {
  placementScore: 0.25,
  roiScore: 0.20,
  nirfRank: 0.10, // Inverse weight (lower rank is better)
  codingCultureScore: 0.15,
  researchScore: 0.10,
  startupCultureScore: 0.10,
  alumniNetworkScore: 0.10,
};

export const DEFAULT_CAREER_WEIGHTS = {
  demandScore: 0.25,
  growthScore: 0.25,
  salaryScore: 0.20,
  interestMatchScore: 0.30,
};

export const DEFAULT_CERTIFICATION_WEIGHTS = {
  recognitionScore: 0.40,
  costScore: 0.20, // Inverse weight (lower cost is better)
  durationScore: 0.20, // Inverse weight (shorter duration is better)
  semesterAlignmentScore: 0.20,
};
