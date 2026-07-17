import { College } from "./schemas/college";
import { Career } from "./schemas/career";
import { Certification } from "./schemas/certification";
import { Roadmap } from "./schemas/roadmap";
import { Course } from "./schemas/course";

import collegesDataset from "./datasets/colleges.json";
import careersDataset from "./datasets/careers.json";
import certificationsDataset from "./datasets/certifications.json";
import roadmapsDataset from "./datasets/roadmaps.json";
import coursesDataset from "./datasets/courses.json";

import {
  validateCollegesDataset,
  validateCareersDataset,
  validateCertificationsDataset,
  validateRoadmapsDataset,
  validateCoursesDataset,
} from "./validation";

// Re-export all schemas
export * from "./schemas/base";
export * from "./schemas/college";
export * from "./schemas/career";
export * from "./schemas/certification";
export * from "./schemas/roadmap";
export * from "./schemas/student";
export * from "./schemas/course";

// Re-export all validators
export * from "./validation";

/**
 * Unified static KnowledgeBase wrapper accessing validated catalog configurations.
 */
export const KnowledgeBase = {
  /** Unwrapped array of standard College catalog items */
  get colleges(): College[] {
    return collegesDataset.data as College[];
  },

  /** Unwrapped array of standard Career catalog items */
  get careers(): Career[] {
    return careersDataset.data as Career[];
  },

  /** Unwrapped array of standard Certification catalog items */
  get certifications(): Certification[] {
    return certificationsDataset.data as Certification[];
  },

  /** Unwrapped array of standard Roadmap catalog items */
  get roadmaps(): Roadmap[] {
    return roadmapsDataset.data as Roadmap[];
  },

  /** Unwrapped array of standard Course catalog items */
  get courses(): Course[] {
    return coursesDataset.data as Course[];
  },

  /**
   * Run structural schema tests on all loaded database configuration documents.
   * @returns True if all datasets conform strictly, false otherwise.
   */
  validateAll(): boolean {
    const collegesOk = validateCollegesDataset(collegesDataset);
    const careersOk = validateCareersDataset(careersDataset);
    const certsOk = validateCertificationsDataset(certificationsDataset);
    const roadmapsOk = validateRoadmapsDataset(roadmapsDataset);
    const coursesOk = validateCoursesDataset(coursesDataset);

    return collegesOk && careersOk && certsOk && roadmapsOk && coursesOk;
  },
};
