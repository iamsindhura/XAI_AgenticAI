import { Roadmap } from "../../knowledge/schemas/roadmap";
import { Career } from "../../knowledge/schemas/career";
import { Certification } from "../../knowledge/schemas/certification";
import { StudentProfile } from "../../knowledge/schemas/student";
import { DecisionResult } from "../core/types";
import { ScoreEngine, ScoringFeature } from "../core/score-engine";
import { TraceEngine } from "../core/trace-engine";
import { RuleEngine, BusinessRule } from "../core/rule-engine";
import { ConfidenceEngine } from "../core/confidence-engine";
import { AuditEngine } from "../core/audit-engine";


/**
 * Single personalized step within the student's learning roadmap.
 */
export interface PersonalizedMilestone {
  semester: number;
  topicsToLearn: string[];
  topicsAlreadyKnown: string[];
  projects: string[];
  certifications: { id: string; name: string; score: number }[];
  expectedOutcome: string;
}

/**
 * Structured personalized learning roadmap.
 */
export interface PersonalizedRoadmap {
  id: string;
  careerId: string;
  careerName: string;
  milestones: PersonalizedMilestone[];
}

/**
 * Resolves and personalizes a career roadmap based on student profile and prioritized certifications.
 * @param student The StudentProfile data.
 * @param career The target aligned Career.
 * @param certRecommendations Ranked certification decision results.
 * @param roadmaps Array of available raw Roadmap guides from the Knowledge Base.
 * @returns A single DecisionResult envelope containing the PersonalizedRoadmap.
 */
export function makeRoadmapDecision(
  student: StudentProfile,
  career: Career,
  certRecommendations: DecisionResult<Certification>[],
  roadmaps: Roadmap[],
  timestamp?: string
): DecisionResult<PersonalizedRoadmap> {
  // 1. Locate aligned roadmap
  const rawRoadmap = roadmaps.find((r) => r.careerId === career.id);
  if (!rawRoadmap) {
    throw new Error(
      `Roadmap Resolution Failure: No roadmap registered for career ID '${career.id}'`
    );
  }

  const studentSkillsSet = new Set(
    student.currentSkills.map((s) => s.toLowerCase().trim())
  );

  let totalTopics = 0;
  let knownTopics = 0;
  const personalizedMilestones: PersonalizedMilestone[] = [];

  // Map recommended certifications by their suggested semesters for lookup
  const certsBySemester = new Map<number, typeof certRecommendations>();
  for (const certRec of certRecommendations) {
    const sem = certRec.data.recommendedSemester;
    if (!certsBySemester.has(sem)) {
      certsBySemester.set(sem, []);
    }
    certsBySemester.get(sem)!.push(certRec);
  }

  // 2. Personalize milestones
  for (const milestone of rawRoadmap.milestones) {
    const topicsToLearn: string[] = [];
    const topicsAlreadyKnown: string[] = [];

    for (const topic of milestone.topics) {
      totalTopics++;
      if (studentSkillsSet.has(topic.toLowerCase().trim())) {
        knownTopics++;
        topicsAlreadyKnown.push(topic);
      } else {
        topicsToLearn.push(topic);
      }
    }

    // Resolve certifications recommended for this specific semester, sorted by priority score descending
    const milestoneCerts = certsBySemester.get(milestone.semester) || [];
    const certsMapped = milestoneCerts.map((cr) => ({
      id: cr.data.id,
      name: cr.data.name,
      score: cr.score,
    }));

    personalizedMilestones.push({
      semester: milestone.semester,
      topicsToLearn,
      topicsAlreadyKnown,
      projects: [...milestone.projects],
      certifications: certsMapped,
      expectedOutcome: milestone.expectedOutcome,
    });
  }

  const personalizedRoadmap: PersonalizedRoadmap = {
    id: `personalized-${rawRoadmap.id}`,
    careerId: rawRoadmap.careerId,
    careerName: career.name,
    milestones: personalizedMilestones,
  };

  // 3. Score the roadmap alignment fit
  const skillsAlignmentValue = totalTopics > 0 ? knownTopics / totalTopics : 0.0;
  const certCoverageValue =
    rawRoadmap.milestones.filter((m) => (certsBySemester.get(m.semester) || []).length > 0).length /
    rawRoadmap.milestones.length;

  const weights = {
    skillsAlignment: 0.6,
    certCoverage: 0.4,
  };

  const features: Record<string, ScoringFeature> = {
    skillsAlignment: {
      rawValue: `${knownTopics}/${totalTopics} topics`,
      normalizedValue: skillsAlignmentValue,
      weight: weights.skillsAlignment,
      explanation: `Student already possesses ${(skillsAlignmentValue * 100).toFixed(0)}% of roadmap skills.`,
    },
    certCoverage: {
      rawValue: `${certsBySemester.size} semesters with certs`,
      normalizedValue: certCoverageValue,
      weight: weights.certCoverage,
      explanation: `Prioritized certifications available in ${(certCoverageValue * 100).toFixed(0)}% of milestone semesters.`,
    },
  };

  const { traceItems } = ScoreEngine.score(features);

  // 4. Define business rules
  const rules: BusinessRule<PersonalizedRoadmap>[] = [
    // Rule A: Preferred career fit (Adds a bonus if the target career aligns with preferred choices)
    () => {
      const preferredFit = student.preferredCareer.includes(career.id);
      return {
        ruleId: "roadmap-career-preference-alignment",
        type: "BONUS",
        value: 10.0,
        passed: preferredFit,
      };
    },
  ];

  const { rulesApplied, bonusTotal, penaltyTotal } = RuleEngine.evaluate(
    personalizedRoadmap,
    rules
  );

  // Compile explainability trace
  const trace = TraceEngine.compileTrace(traceItems, bonusTotal, penaltyTotal);

  // 5. Calculate data completeness ratio
  const roadmapProps = Object.values(rawRoadmap).filter(
    (v) => v !== undefined && v !== null && v !== ""
  ).length;
  const totalRoadmapProps = Object.keys(rawRoadmap).length;
  const completenessRatio = roadmapProps / totalRoadmapProps;

  const normalizedValues = traceItems.map((item) => item.normalizedValue);
  const confidence = ConfidenceEngine.calculate(
    normalizedValues,
    completenessRatio
  );

  // 6. Generate deterministic audit log record
  const ruleAuditList = rulesApplied.map((r) => ({
      ruleId: r.ruleId,
      type: r.type,
      value: r.value,
      passed: r.passed,
  }));

  const traceSummary =
    `Personalized roadmap resolved for ${career.name} with score ${trace.totalScore}/100. ` +
    `Base: ${trace.baseScore}. Adjustments: +${bonusTotal} / -${penaltyTotal}. ` +
    `Already knows ${knownTopics}/${totalTopics} skills.`;

  const audit = AuditEngine.createRecord(
    personalizedRoadmap.id,
    weights,
    ruleAuditList,
    confidence,
    traceSummary,
    "1.0.0",
    timestamp
  );

  return {
    data: personalizedRoadmap,
    score: trace.totalScore,
    confidence,
    ranking: 1, // Single personalized selection output
    trace,
    audit,
  };
}
