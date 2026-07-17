"use client";
import React, { useEffect, useState } from "react";
import { useCounselling } from "../../../lib/context/CounsellingContext";
import { PageContainer } from "../../../components/common/PageContainer";
import { Card } from "../../../components/common/Card";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { Button } from "../../../components/common/Button";
import { useRouter } from "next/navigation";
import { Cpu, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

export default function DashboardLoadingPage() {
  const { pipelineStatus, error, summaryResponse } = useCounselling();
  const router = useRouter();
  const [pipelineSteps, setPipelineSteps] = useState([
    { name: "Validating student profile data", status: "PENDING" },
    { name: "Computing topological agent plan sequence", status: "PENDING" },
    { name: "Running student profile analysis & preferences", status: "PENDING" },
    { name: "Scoring college recommendations & fit matrices", status: "PENDING" },
    { name: "Generating comparative side-by-side matrices", status: "PENDING" },
    { name: "Resolving career gaps & course recommendations", status: "PENDING" },
    { name: "Compiling personalized semester roadmaps", status: "PENDING" },
    { name: "Generating explainable AI reasons", status: "PENDING" },
  ]);

  useEffect(() => {
    if (pipelineStatus === "VALIDATING") {
      setPipelineSteps((prev) =>
        prev.map((step, idx) =>
          idx === 0 ? { ...step, status: "RUNNING" } : step
        )
      );
    } else if (pipelineStatus === "SUBMITTING") {
      setPipelineSteps((prev) =>
        prev.map((step, idx) =>
          idx === 0 ? { ...step, status: "COMPLETED" } : idx === 1 ? { ...step, status: "RUNNING" } : step
        )
      );
    } else if (pipelineStatus === "PROCESSING") {
      setPipelineSteps((prev) =>
        prev.map((step, idx) =>
          idx < 2 ? { ...step, status: "COMPLETED" } : idx === 2 || idx === 3 || idx === 4 ? { ...step, status: "RUNNING" } : step
        )
      );
    } else if (pipelineStatus === "SUCCESS") {
      setPipelineSteps((prev) =>
        prev.map((step) => ({ ...step, status: "COMPLETED" }))
      );
    } else if (pipelineStatus === "FAILED") {
      setPipelineSteps((prev) =>
        prev.map((step) =>
          step.status === "RUNNING" || step.status === "PENDING"
            ? { ...step, status: "FAILED" }
            : step
        )
      );
    }
  }, [pipelineStatus]);

  return (
    <PageContainer className="max-w-2xl min-h-[calc(100vh-12rem)] flex items-center justify-center">
      <Card className="w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-75" />
            <div className="relative rounded-full bg-white p-4 shadow-md border border-slate-100">
              <Cpu className="h-8 w-8 text-primary-600 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {pipelineStatus === "SUCCESS"
              ? "Recommendations Ready!"
              : pipelineStatus === "FAILED"
              ? "Pipeline Processing Failed"
              : "Generating Recommendations..."}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Our multi-agent system is currently processing score fits, upskilling sequences, and explanation reports.
          </p>
        </div>

        <div className="border border-slate-100 rounded-xl bg-slate-50/50 p-5 text-left space-y-3.5">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
              <span
                className={`font-semibold ${
                  step.status === "COMPLETED"
                    ? "text-slate-700 line-through decoration-slate-300"
                    : step.status === "RUNNING"
                    ? "text-primary-700 font-bold"
                    : step.status === "FAILED"
                    ? "text-rose-600"
                    : "text-slate-400"
                }`}
              >
                {step.name}
              </span>
              <span>
                {step.status === "COMPLETED" && (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 fill-emerald-50" />
                )}
                {step.status === "RUNNING" && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                )}
                {step.status === "FAILED" && (
                  <XCircle className="h-4.5 w-4.5 text-rose-500 fill-rose-50" />
                )}
                {step.status === "PENDING" && (
                  <div className="h-4 w-4 rounded-full border border-slate-200 bg-white" />
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
          {pipelineStatus === "SUCCESS" && (
            <div className="space-y-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 text-base"
              >
                View Recommendation Dashboard <ChevronRight className="h-5 w-5" />
              </Button>
              {summaryResponse && (
                <div className="text-left space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Response Payload Summary</span>
                  <pre className="bg-slate-900 text-slate-200 rounded-xl p-4 text-[10px] font-mono overflow-x-auto max-h-[150px] border border-slate-800">
                    {JSON.stringify(
                      {
                        student: summaryResponse.studentProfile.name,
                        collegesCount: summaryResponse.collegeRecommendation.recommended.length,
                        careersCount: summaryResponse.careerRecommendation.recommended.length,
                        coursesCount: summaryResponse.recommendedCourses.length,
                        certificationsCount: summaryResponse.certificationRecommendation.recommended.length,
                        roadmapMilestones: summaryResponse.personalizedRoadmap.roadmap.milestones.length,
                        executionTimeMs: summaryResponse.metadata.pipelineExecutionTime,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}

          {pipelineStatus === "FAILED" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-left">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">Error Details:</span>
                <p className="text-sm text-rose-600 mt-1">{error?.message || "An unknown orchestrator error occurred."}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push("/start")}
                className="w-full py-3"
              >
                Back to Start Portal
              </Button>
            </div>
          )}

          {pipelineStatus !== "SUCCESS" && pipelineStatus !== "FAILED" && (
            <div className="flex items-center justify-center gap-2.5 text-sm text-slate-500 font-medium">
              <LoadingSpinner />
              <span>Processing algorithms...</span>
            </div>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
