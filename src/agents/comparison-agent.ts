import { BaseAgent } from "./base-agent";
import {
  AgentContext,
  AgentResult,
  AgentStatus,
} from "../types/agent";
import { StudentProfile } from "../knowledge/schemas/student";
import { intersectionCount } from "../decision-engine/utils/comparator";
import { CollegeRecommendationItem } from "./college-recommendation-agent";

/**
 * Structured analysis describing why a college wasn't recommended.
 */
export interface WhyNotItem {
  criterion: string;
  expectedValue: string;
  actualValue: string;
  scoreImpact: number;
  recommendation: string;
}

/**
 * Why Not report for a candidate college.
 */
export interface WhyNotReport {
  collegeId: string;
  collegeName: string;
  reasons: WhyNotItem[];
}

/**
 * Struct representing a single row in the decision matrix.
 */
export interface ComparisonMatrixItem {
  criterion: string;
  collegeAValue: string | number;
  collegeBValue: string | number;
  winner: string;
  importanceWeight: number;
  scoreImpact: number;
}

/**
 * Complete comparison record between two colleges.
 */
export interface CollegeComparisonReport {
  collegeAId: string;
  collegeBId: string;
  collegeAName: string;
  collegeBName: string;
  decisionMatrix: ComparisonMatrixItem[];
  comparisonSummary: {
    overallWinner: string;
    overallMargin: number;
    keyStrengths: string[];
    keyWeaknesses: string[];
    comparisonConfidence: number;
  };
}

/**
 * Business Agent responsible for compiling why-not rejection analyses
 * and structuring side-by-side college decision matrices.
 */
export class ComparisonAgent extends BaseAgent<AgentContext> {
  public readonly id = "comparison-agent";
  public readonly name = "Comparison Agent";
  public readonly description =
    "Generates structured rejection reasons (Why Not) and compiles side-by-side college comparison matrices.";
  public readonly version = "1.0.0";
  public readonly priority = 60;
  public readonly dependencies: string[] = ["college-recommendation-agent"];

  /**
   * Executes rejection analysis and college comparison logs.
   */
  protected async run(
    context: AgentContext
  ): Promise<
    Pick<
      AgentResult,
      "status" | "data" | "reasoning" | "confidence" | "nextAgent"
    >
  > {
    const studentProfile = (context.studentProfile ||
      context.metadata.studentProfile) as StudentProfile | undefined;

    const recommended = context.recommendedColleges as
      | CollegeRecommendationItem[]
      | undefined;
    const backup = context.backupColleges as CollegeRecommendationItem[] | undefined;
    const notRecommended = context.notRecommendedColleges as
      | CollegeRecommendationItem[]
      | undefined;

    if (!studentProfile || !recommended || !backup || !notRecommended) {
      return {
        status: AgentStatus.FAILED,
        reasoning:
          "Comparison failed: Required collections 'studentProfile', 'recommendedColleges', 'backupColleges', and 'notRecommendedColleges' must be present in context.",
        confidence: 0.0,
      };
    }

    this.logger.info("Executing structured Why Not & College Comparison Analysis...");

    const timestamp = (context.metadata.timestamp as string) || "2026-07-16T22:00:00.000Z";

    // ==========================================
    // PART A: WHY NOT REJECTION ANALYSIS
    // ==========================================
    const whyNotResults: WhyNotReport[] = [];
    const candidatesToAnalyze = [...backup, ...notRecommended];

    for (const item of candidatesToAnalyze) {
      const college = item.data;
      const reasons: WhyNotItem[] = [];

      // A1. Budget Check
      if (college.fees > studentProfile.budget) {
        reasons.push({
          criterion: "Budget Limit",
          expectedValue: `<= ₹${(studentProfile.budget / 100000).toFixed(1)}L per year`,
          actualValue: `₹${(college.fees / 100000).toFixed(1)}L per year`,
          scoreImpact: -20.0,
          recommendation: "Increase your maximum budget limit or look for scholarship waivers.",
        });
      }

      // A2. Location Check
      const hasLocationMatch = studentProfile.preferredLocation.some(
        (loc) => loc.toLowerCase().trim() === college.location.toLowerCase().trim()
      );
      if (studentProfile.preferredLocation.length > 0 && !hasLocationMatch) {
        reasons.push({
          criterion: "Geographic Location Preference",
          expectedValue: `In: [${studentProfile.preferredLocation.join(", ")}]`,
          actualValue: `"${college.location}"`,
          scoreImpact: -10.0,
          recommendation: "Consider expanding your geographic preferences to other engineering hubs.",
        });
      }

      // A3. Specialization overlap
      const specializationOverlap = intersectionCount(
        studentProfile.interests,
        college.specialization
      );
      if (specializationOverlap === 0) {
        reasons.push({
          criterion: "Academic Specialization Fit",
          expectedValue: `Contains: [${studentProfile.interests.join(", ")}]`,
          actualValue: `Offers: [${college.specialization.join(", ")}]`,
          scoreImpact: 0.0,
          recommendation: "Target standard Computer Science branches or adjust interest tags.",
        });
      }

      // A4. Placement Score Check (Considered sub-optimal if rating < 8.0)
      if (college.placementScore < 8.0) {
        const placementTrace = item.trace.items.find(
          (ti) => ti.criterion === "placementScore"
        );
        const impact = placementTrace
          ? Number((placementTrace.contribution - placementTrace.weight).toFixed(2)) * 100
          : -5.0;

        reasons.push({
          criterion: "Placement Success Score",
          expectedValue: ">= 8.0 / 10",
          actualValue: `${college.placementScore} / 10`,
          scoreImpact: Number(impact.toFixed(1)),
          recommendation: "Plan to upskill for off-campus recruitment or lower package expectations.",
        });
      }

      // A5. ROI Check (Sub-optimal if rating < 7.0)
      if (college.roiScore < 7.0) {
        const roiTrace = item.trace.items.find((ti) => ti.criterion === "roiScore");
        const impact = roiTrace
          ? Number((roiTrace.contribution - roiTrace.weight).toFixed(2)) * 100
          : -5.0;

        reasons.push({
          criterion: "Return on Investment (ROI)",
          expectedValue: ">= 7.0 / 10",
          actualValue: `${college.roiScore} / 10`,
          scoreImpact: Number(impact.toFixed(1)),
          recommendation: "Verify if high tuition costs justify the historical placement averages.",
        });
      }

      whyNotResults.push({
        collegeId: college.id,
        collegeName: college.name,
        reasons,
      });
    }

    // ==========================================
    // PART B: COLLEGE COMPARISON ANALYSIS
    // ==========================================
    let comparisonResults: CollegeComparisonReport[] = [];

    // Resolve which two colleges to compare
    let targetA: CollegeRecommendationItem | undefined;
    let targetB: CollegeRecommendationItem | undefined;

    const metadataTargets = context.metadata.comparisonTargets as string[] | undefined;

    const allScored = [...recommended, ...backup, ...notRecommended];

    if (metadataTargets && metadataTargets.length >= 2) {
      targetA = allScored.find((c) => c.data.id === metadataTargets[0]);
      targetB = allScored.find((c) => c.data.id === metadataTargets[1]);
    }

    // Default Fallback: Compare top Recommended with top Not Recommended / Backup
    if (!targetA || !targetB) {
      if (recommended.length > 0) {
        targetA = recommended[0];
        if (notRecommended.length > 0) {
          targetB = notRecommended[0];
        } else if (backup.length > 0) {
          targetB = backup[0];
        } else if (recommended.length > 1) {
          targetB = recommended[1];
        }
      }
    }

    if (targetA && targetB) {
      const collA = targetA.data;
      const collB = targetB.data;

      // Extrapolate weights used in College agent
      const collegeMetadata = context.collegeDecisionMetadata as
        | { appliedWeights: Record<string, number> }
        | undefined;
      const weights = collegeMetadata?.appliedWeights || {};

      const decisionMatrix: ComparisonMatrixItem[] = [];

      // Helper to push rows into the matrix
      const addMatrixRow = (
        criterion: string,
        valA: string | number,
        valB: string | number,
        scoreKey: string,
        weight: number,
        higherIsBetter: boolean = true
      ) => {
        let winner = "TIE";
        if (valA !== valB) {
          if (typeof valA === "number" && typeof valB === "number") {
            winner = higherIsBetter
              ? valA > valB
                ? collA.name
                : collB.name
              : valA < valB
              ? collA.name
              : collB.name;
          } else {
            winner = String(valA).toLowerCase() > String(valB).toLowerCase() ? collA.name : collB.name;
          }
        }

        // Trace contributions
        const traceA = targetA!.trace.items.find((ti) => ti.criterion === scoreKey);
        const traceB = targetB!.trace.items.find((ti) => ti.criterion === scoreKey);
        const contributionA = traceA ? traceA.contribution : 0;
        const contributionB = traceB ? traceB.contribution : 0;
        const scoreImpact = Number(((contributionA - contributionB) * 100).toFixed(2));

        decisionMatrix.push({
          criterion,
          collegeAValue: valA,
          collegeBValue: valB,
          winner,
          importanceWeight: weight,
          scoreImpact,
        });
      };

      // Populate decision matrix (11 comparison criteria)
      addMatrixRow(
        "Placements (Avg Package)",
        `₹${(collA.averagePackage / 100000).toFixed(1)}L`,
        `₹${(collB.averagePackage / 100000).toFixed(1)}L`,
        "placementScore",
        weights.placementScore || 0
      );
      addMatrixRow(
        "Return on Investment (ROI)",
        `${collA.roiScore}/10`,
        `${collB.roiScore}/10`,
        "roiScore",
        weights.roiScore || 0
      );
      addMatrixRow(
        "Academic Yearly Fees",
        collA.fees,
        collB.fees,
        "roiScore", // Fees influence ROI
        weights.roiScore || 0,
        false // Lower fees are better
      );
      addMatrixRow(
        "Research Opportunities",
        `${collA.researchScore}/10`,
        `${collB.researchScore}/10`,
        "researchScore",
        weights.researchScore || 0
      );
      addMatrixRow(
        "Coding Culture",
        `${collA.codingCultureScore}/10`,
        `${collB.codingCultureScore}/10`,
        "codingCultureScore",
        weights.codingCultureScore || 0
      );
      addMatrixRow(
        "Startup Incubation Culture",
        `${collA.startupCultureScore}/10`,
        `${collB.startupCultureScore}/10`,
        "startupCultureScore",
        weights.startupCultureScore || 0
      );
      addMatrixRow(
        "Internship Support Score",
        `${collA.internshipSupportScore}/10`,
        `${collB.internshipSupportScore}/10`,
        "placementScore",
        weights.placementScore || 0
      );
      addMatrixRow(
        "Alumni Network Strength",
        `${collA.alumniNetworkScore}/10`,
        `${collB.alumniNetworkScore}/10`,
        "alumniNetworkScore",
        weights.alumniNetworkScore || 0
      );
      addMatrixRow(
        "International Collaborations",
        collA.internationalOpportunities ? "YES" : "NO",
        collB.internationalOpportunities ? "YES" : "NO",
        "researchScore",
        weights.researchScore || 0
      );
      addMatrixRow(
        "Branch Options Count",
        collA.branch.length,
        collB.branch.length,
        "placementScore",
        0.05
      );
      addMatrixRow(
        "Specialization Overlap",
        intersectionCount(studentProfile.interests, collA.specialization),
        intersectionCount(studentProfile.interests, collB.specialization),
        "specialization-interest-match",
        0.1
      );

      // 3. Compile Comparison Summary metrics
      const overallWinner =
        targetA.score > targetB.score
          ? collA.name
          : targetA.score < targetB.score
          ? collB.name
          : "TIE";

      const overallMargin = Number(Math.abs(targetA.score - targetB.score).toFixed(2));

      const keyStrengths: string[] = [];
      const keyWeaknesses: string[] = [];

      for (const row of decisionMatrix) {
        if (row.winner === collA.name) {
          keyStrengths.push(row.criterion);
        } else if (row.winner === collB.name) {
          keyWeaknesses.push(row.criterion);
        }
      }

      const comparisonConfidence = Number(
        ((targetA.confidence + targetB.confidence) / 2).toFixed(1)
      );

      comparisonResults.push({
        collegeAId: collA.id,
        collegeBId: collB.id,
        collegeAName: collA.name,
        collegeBName: collB.name,
        decisionMatrix,
        comparisonSummary: {
          overallWinner,
          overallMargin,
          keyStrengths,
          keyWeaknesses,
          comparisonConfidence,
        },
      });
    }

    const comparisonMetadata = {
      timestamp,
      whyNotProcessedCount: candidatesToAnalyze.length,
      comparisonsPerformedCount: comparisonResults.length,
    };

    // 4. Update AgentContext and return SUCCESS
    return {
      status: AgentStatus.SUCCESS,
      data: {
        whyNotResults,
        comparisonResults,
        comparisonMetadata,
      },
      reasoning:
        `Compiled Why Not analyses for ${candidatesToAnalyze.length} colleges. ` +
        `Completed ${comparisonResults.length} structured side-by-side comparison report(s).`,
      confidence: 100.0,
    };
  }
}
