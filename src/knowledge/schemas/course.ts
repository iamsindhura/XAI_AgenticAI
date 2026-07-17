import { BaseSchema } from "./base";

/**
 * Representation of a structured online or university academic course.
 */
export interface Course extends BaseSchema {
  /** Unique course identifier (e.g. "course-python-ml") */
  id: string;
  /** Title of the course */
  title: string;
  /** Organization or institution hosting the course */
  provider: string;
  /** Estimated completion duration (e.g. "4 weeks", "60 hours") */
  duration: string;
  /** Intended skill bracket ("BEGINNER", "INTERMEDIATE", "ADVANCED") */
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  /** Core skill tags covered by the curriculum */
  skillsCovered: string[];
  /** Career IDs this course is aligned with */
  careerAlignment: string[];
  /** Recommended academic semester to pursue this course */
  recommendedSemester: number;
  /** Estimated study load hours per week */
  estimatedWeeklyHours: number;
  /** Prerequisite course IDs or skill requirements */
  prerequisites: string[];
  /** Expected learning outcome of the course */
  learningOutcome: string;
}
