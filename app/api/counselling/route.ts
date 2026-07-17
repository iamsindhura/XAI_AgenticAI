import { NextRequest, NextResponse } from "next/server";
import { DefaultAgentRegistry } from "../../../src/agents/registry";
import { ProfileAgent } from "../../../src/agents/profile-agent";
import { CollegeRecommendationAgent } from "../../../src/agents/college-recommendation-agent";
import { ComparisonAgent } from "../../../src/agents/comparison-agent";
import { CareerRecommendationAgent } from "../../../src/agents/career-recommendation-agent";
import { CertificationRecommendationAgent } from "../../../src/agents/certification-recommendation-agent";
import { LearningRoadmapAgent } from "../../../src/agents/learning-roadmap-agent";
import { ExplainabilityAgent } from "../../../src/agents/explainability-agent";
import { PlannerAgent } from "../../../src/agents/planner-agent";
import { AgentOrchestrator } from "../../../src/orchestrator/orchestrator";
import { FrameworkEventEmitter } from "../../../src/services/event-emitter";
import { DecisionSummaryService } from "../../../src/presentation/decision-summary-service";
import { StudentProfile } from "../../../src/knowledge/schemas/student";
import { AgentContext } from "../../../src/types/agent";

export async function POST(req: NextRequest) {
  try {
    const studentProfile = (await req.json()) as StudentProfile;

    if (!studentProfile || !studentProfile.name || !studentProfile.exam || !studentProfile.rank) {
      return NextResponse.json(
        { message: "Invalid student profile payload. Missing name, exam, or rank." },
        { status: 400 }
      );
    }

    const eventEmitter = new FrameworkEventEmitter();
    const registry = new DefaultAgentRegistry();

    const profileAgent = new ProfileAgent();
    const collegeAgent = new CollegeRecommendationAgent();
    const comparisonAgent = new ComparisonAgent();
    const careerAgent = new CareerRecommendationAgent();
    const certAgent = new CertificationRecommendationAgent();
    const roadmapAgent = new LearningRoadmapAgent();
    const explainAgent = new ExplainabilityAgent();
    const plannerAgent = new PlannerAgent(registry);

    registry.register(profileAgent);
    registry.register(collegeAgent);
    registry.register(comparisonAgent);
    registry.register(careerAgent);
    registry.register(certAgent);
    registry.register(roadmapAgent);
    registry.register(explainAgent);
    registry.register(plannerAgent);

    const initialContext: Partial<AgentContext> = {
      studentProfile,
      metadata: {
        timestamp: new Date().toISOString(),
        comparisonTargets: ["college-iit-delhi", "college-bits-pilani"],
      },
    };

    const orchestrator = new AgentOrchestrator(registry, eventEmitter);

    const report = await orchestrator.executePlanner(
      "Analyze profile, recommend colleges, compare, recommend careers, certifications, roadmaps, and generate explanations.",
      initialContext
    );

    if (!report.success) {
      return NextResponse.json(
        { message: "Orchestrator pipeline failed executing counseling steps.", error: report.error },
        { status: 500 }
      );
    }

    const summary = DecisionSummaryService.assemble(report.finalContext, report);

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("Error running counseling API route:", err);
    return NextResponse.json(
      { message: "Internal server error occurred processing student profile.", details: err.message || err },
      { status: 500 }
    );
  }
}
