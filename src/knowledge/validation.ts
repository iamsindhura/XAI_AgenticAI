import { College } from "./schemas/college";
import { Career } from "./schemas/career";
import { Certification } from "./schemas/certification";
import { Roadmap, Milestone } from "./schemas/roadmap";
import { Course } from "./schemas/course";

// ==========================================
// TYPE PREDICATE HELPERS FOR STRICT CHECKING
// ==========================================

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function hasString(val: Record<string, unknown>, key: string): boolean {
  return typeof val[key] === "string" && (val[key] as string).trim().length > 0;
}

function hasNumber(val: Record<string, unknown>, key: string): boolean {
  return typeof val[key] === "number" && !isNaN(val[key] as number);
}

function hasBoolean(val: Record<string, unknown>, key: string): boolean {
  return typeof val[key] === "boolean";
}

function hasStringArray(val: Record<string, unknown>, key: string): boolean {
  if (!Array.isArray(val[key])) return false;
  return (val[key] as unknown[]).every((item) => typeof item === "string");
}



// ==========================================
// SCHEMAS INDIVIDUAL VALIDATORS
// ==========================================

/**
 * Validates the metadata header of a Dataset envelope.
 */
export function validateMetadata(envelope: unknown): boolean {
  if (!isRecord(envelope)) return false;
  const meta = envelope.metadata;
  if (!isRecord(meta)) return false;
  return (
    hasString(meta, "version") &&
    hasString(meta, "source") &&
    hasString(meta, "lastUpdated") &&
    hasNumber(meta, "recordCount")
  );
}

/**
 * Validates a single College record.
 */
export function validateCollege(college: unknown): college is College {
  if (!isRecord(college)) return false;

  return (
    hasString(college, "version") &&
    hasString(college, "lastUpdated") &&
    hasString(college, "id") &&
    hasString(college, "name") &&
    hasString(college, "location") &&
    hasNumber(college, "fees") &&
    hasNumber(college, "averagePackage") &&
    hasNumber(college, "highestPackage") &&
    hasStringArray(college, "branch") &&
    hasNumber(college, "researchScore") &&
    hasNumber(college, "codingCultureScore") &&
    hasNumber(college, "placementScore") &&
    hasBoolean(college, "hostelAvailable") &&
    hasNumber(college, "nirfRank") &&
    hasNumber(college, "roiScore") &&
    hasStringArray(college, "specialization") &&
    hasString(college, "campusType") &&
    hasNumber(college, "internshipSupportScore") &&
    hasNumber(college, "alumniNetworkScore") &&
    hasBoolean(college, "internationalOpportunities") &&
    hasNumber(college, "startupCultureScore")
  );
}

/**
 * Validates a single Career record.
 */
export function validateCareer(career: unknown): career is Career {
  if (!isRecord(career)) return false;

  const hasSalary =
    isRecord(career.salaryRange) &&
    hasNumber(career.salaryRange, "min") &&
    hasNumber(career.salaryRange, "max") &&
    hasString(career.salaryRange, "currency");

  return (
    hasString(career, "version") &&
    hasString(career, "lastUpdated") &&
    hasString(career, "id") &&
    hasString(career, "name") &&
    hasString(career, "description") &&
    hasString(career, "demand") &&
    hasSalary &&
    hasStringArray(career, "requiredSkills") &&
    hasStringArray(career, "recommendedBranch") &&
    hasString(career, "futureGrowth") &&
    hasString(career, "difficulty") &&
    hasString(career, "workMode") &&
    hasStringArray(career, "industryDomains") &&
    hasString(career, "averageLearningTime") &&
    hasStringArray(career, "topRecruiters")
  );
}

/**
 * Validates a single Certification record.
 */
export function validateCertification(
  cert: unknown
): cert is Certification {
  if (!isRecord(cert)) return false;

  return (
    hasString(cert, "version") &&
    hasString(cert, "lastUpdated") &&
    hasString(cert, "id") &&
    hasString(cert, "name") &&
    hasString(cert, "provider") &&
    hasString(cert, "level") &&
    hasString(cert, "duration") &&
    hasStringArray(cert, "prerequisites") &&
    hasStringArray(cert, "careerAlignment") &&
    hasString(cert, "difficulty") &&
    hasNumber(cert, "cost") &&
    hasString(cert, "officialLink") &&
    hasBoolean(cert, "examRequired") &&
    hasString(cert, "validity") &&
    hasNumber(cert, "recommendedSemester") &&
    hasNumber(cert, "recognitionScore")
  );
}

/**
 * Validates a single Milestone within a Roadmap.
 */
export function validateMilestone(milestone: unknown): milestone is Milestone {
  if (!isRecord(milestone)) return false;

  return (
    hasNumber(milestone, "semester") &&
    hasStringArray(milestone, "topics") &&
    hasStringArray(milestone, "projects") &&
    hasStringArray(milestone, "certifications") &&
    hasString(milestone, "expectedOutcome")
  );
}

/**
 * Validates a single Roadmap record.
 */
export function validateRoadmap(roadmap: unknown): roadmap is Roadmap {
  if (!isRecord(roadmap)) return false;

  if (!Array.isArray(roadmap.milestones)) return false;
  const milestonesValid = (roadmap.milestones as unknown[]).every(
    validateMilestone
  );

  return (
    hasString(roadmap, "version") &&
    hasString(roadmap, "lastUpdated") &&
    hasString(roadmap, "id") &&
    hasString(roadmap, "careerId") &&
    milestonesValid
  );
}

// ==========================================
// BULK DATASET ENVELOPE VALIDATORS
// ==========================================

/**
 * Asserts structural correctness of the colleges dataset.
 */
export function validateCollegesDataset(dataset: unknown): boolean {
  if (!validateMetadata(dataset)) return false;
  const envelope = dataset as { data: unknown[] };
  return envelope.data.every((item, index) => {
    const ok = validateCollege(item);
    if (!ok) {
      console.error(
        `[Validation Error] College at index ${index} failed schema validation.`,
        item
      );
    }
    return ok;
  });
}

/**
 * Asserts structural correctness of the careers dataset.
 */
export function validateCareersDataset(dataset: unknown): boolean {
  if (!validateMetadata(dataset)) return false;
  const envelope = dataset as { data: unknown[] };
  return envelope.data.every((item, index) => {
    const ok = validateCareer(item);
    if (!ok) {
      console.error(
        `[Validation Error] Career at index ${index} failed schema validation.`,
        item
      );
    }
    return ok;
  });
}

/**
 * Asserts structural correctness of the certifications dataset.
 */
export function validateCertificationsDataset(dataset: unknown): boolean {
  if (!validateMetadata(dataset)) return false;
  const envelope = dataset as { data: unknown[] };
  return envelope.data.every((item, index) => {
    const ok = validateCertification(item);
    if (!ok) {
      console.error(
        `[Validation Error] Certification at index ${index} failed schema validation.`,
        item
      );
    }
    return ok;
  });
}

/**
 * Asserts structural correctness of the roadmaps dataset.
 */
export function validateRoadmapsDataset(dataset: unknown): boolean {
  if (!validateMetadata(dataset)) return false;
  const envelope = dataset as { data: unknown[] };
  return envelope.data.every((item, index) => {
    const ok = validateRoadmap(item);
    if (!ok) {
      console.error(
        `[Validation Error] Roadmap at index ${index} failed schema validation.`,
        item
      );
    }
    return ok;
  });
}

/**
 * Validates a single Course record.
 */
export function validateCourse(course: unknown): course is Course {
  if (!isRecord(course)) return false;

  return (
    hasString(course, "version") &&
    hasString(course, "lastUpdated") &&
    hasString(course, "id") &&
    hasString(course, "title") &&
    hasString(course, "provider") &&
    hasString(course, "duration") &&
    hasString(course, "level") &&
    hasStringArray(course, "skillsCovered") &&
    hasStringArray(course, "careerAlignment") &&
    hasNumber(course, "recommendedSemester") &&
    hasNumber(course, "estimatedWeeklyHours") &&
    hasStringArray(course, "prerequisites") &&
    hasString(course, "learningOutcome")
  );
}

/**
 * Asserts structural correctness of the courses dataset.
 */
export function validateCoursesDataset(dataset: unknown): boolean {
  if (!validateMetadata(dataset)) return false;
  const envelope = dataset as { data: unknown[] };
  return envelope.data.every((item, index) => {
    const ok = validateCourse(item);
    if (!ok) {
      console.error(
        `[Validation Error] Course at index ${index} failed schema validation.`,
        item
      );
    }
    return ok;
  });
}
