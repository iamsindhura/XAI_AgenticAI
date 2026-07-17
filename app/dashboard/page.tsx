"use client";
import React, { useState } from "react";
import { PageContainer } from "../../components/common/PageContainer";
import { SectionHeader } from "../../components/common/SectionHeader";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { useCounselling } from "../../lib/context/CounsellingContext";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Briefcase,
  Map,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Clock,
  Compass,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  User,
  Layers,
  MapPin,
  ListTodo,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const { summaryResponse, resetStatus } = useCounselling();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "colleges" | "careers" | "roadmap">("overview");

  if (!summaryResponse) {
    return (
      <PageContainer className="max-w-2xl min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <EmptyState
          title="No Active Counselling Session"
          description="We couldn't find any recommendation results. Please fill out the student profile wizard to run the AI counselling pipeline."
          actionLabel="Start Wizard Portal"
          onAction={() => {
            resetStatus();
            router.push("/start");
          }}
        />
      </PageContainer>
    );
  }

  const {
    studentProfile,
    collegeRecommendation,
    careerRecommendation,
    recommendedCourses,
    personalizedRoadmap,
    aiExplanation,
    metadata
  } = summaryResponse;

  const profileMetadata = (studentProfile?.metadata ?? {}) as Record<string, any>;

  const allColleges = [
    ...(collegeRecommendation?.recommended || []).map(c => ({ ...c, type: "Recommended" as const })),
    ...(collegeRecommendation?.backup || []).map(c => ({ ...c, type: "Backup" as const })),
    ...(collegeRecommendation?.notRecommended || []).map(c => ({ ...c, type: "Not Recommended" as const }))
  ];

  const topCareer =
    (careerRecommendation.recommended && careerRecommendation.recommended[0]) ||
    (careerRecommendation.backup && careerRecommendation.backup[0]) ||
    null;

  return (
    <PageContainer className="max-w-7xl space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <SectionHeader
            title="Counselling Recommendations Dashboard"
            subtitle="Explore decision engine matches, course milestones, and custom semester-by-semester roadmaps."
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            onClick={() => {
              resetStatus();
              router.push("/start");
            }}
            className="text-sm font-medium"
          >
            Restart Counselling
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "overview"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <User className="h-4 w-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab("colleges")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "colleges"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Matched Colleges ({allColleges.length})
        </button>
        <button
          onClick={() => setActiveTab("careers")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "careers"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Career & Skills
        </button>
        <button
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition-colors shrink-0 ${
            activeTab === "roadmap"
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Map className="h-4 w-4" />
          Personal Roadmap
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Student Profile Card */}
            <Card className="md:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-500" />
                Profile Demographics
              </h3>
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</span>
                  <span className="text-sm font-medium text-slate-800">{studentProfile?.name ?? "N/A"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Exam</span>
                    <Badge variant="primary">{studentProfile?.exam ?? "N/A"}</Badge>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Rank</span>
                    <span className="text-sm font-bold text-slate-800">#{studentProfile?.rank ?? "N/A"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
                    <span className="text-sm text-slate-700">{profileMetadata.category ?? "General"}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Yearly Budget</span>
                    <span className="text-sm text-slate-700">₹{studentProfile?.budget?.toLocaleString() ?? "0"}/yr</span>
                  </div>
                </div>
                {profileMetadata.homeState && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Origin Location</span>
                    <span className="text-sm text-slate-700 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {profileMetadata.homeCity ? `${profileMetadata.homeCity}, ` : ""}
                      {profileMetadata.homeState}
                    </span>
                  </div>
                )}
                {studentProfile?.interests && studentProfile.interests.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Tech Interests</span>
                    <div className="flex flex-wrap gap-1.5">
                      {studentProfile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {studentProfile?.currentSkills && studentProfile.currentSkills.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Existing Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {studentProfile.currentSkills.map((skill, idx) => (
                        <Badge key={idx} variant="success">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* AI Explanation Summary */}
            <Card className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Explainable AI (XAI) Insight
                </h3>
                <span className="text-xs text-slate-400 font-mono">Trace Confidence: 100%</span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                  {aiExplanation?.overallExplanation ?? "Our recommendation pipeline evaluated your profile against national college cutoffs and technology sector growth rates. No summary explanation found."}
                </p>
                
                {/* Pipeline Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Execution Time</span>
                    <span className="text-base font-bold text-primary-600">{metadata?.pipelineExecutionTime ?? 0} ms</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Agents Executed</span>
                    <span className="text-base font-bold text-slate-700">{metadata?.completedAgents?.length ?? 0}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">System Version</span>
                    <span className="text-sm font-semibold text-slate-600">{metadata?.systemVersion ?? "1.0.0"} (Deterministic)</span>
                  </div>
                </div>

                {metadata?.agentExecutionOrder && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-400 block mb-1">Agent Collaboration Order:</span>
                    <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] bg-slate-900 text-slate-300 p-2 rounded-lg border border-slate-800">
                      {metadata.agentExecutionOrder.map((agent: string, idx: number) => (
                        <React.Fragment key={idx}>
                          <span className="text-emerald-400">{agent}</span>
                          {idx < metadata.agentExecutionOrder.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Colleges */}
        {activeTab === "colleges" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recommended Engineering Institutions</h3>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Recommended
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Backup Choice
                </span>
              </div>
            </div>

            {allColleges.length === 0 ? (
              <Card className="text-center py-12 text-slate-400 space-y-2">
                <Info className="h-8 w-8 mx-auto text-slate-300 animate-pulse" />
                <p className="text-sm font-semibold">No Matched Colleges Found</p>
                <p className="text-xs text-slate-500">Your profile credentials did not align with institutional target criteria.</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {allColleges.map((college, idx) => {
                  const details = college.data;
                  const summary = college.decisionSummary;
                  const isRecommended = college.type === "Recommended";
                  const isBackup = college.type === "Backup";

                  return (
                    <Card key={idx} hoverEffect className="space-y-4 relative overflow-hidden flex flex-col justify-between">
                      {/* Top ribbon border based on category */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isRecommended ? "bg-emerald-500" : isBackup ? "bg-amber-500" : "bg-rose-500"
                      }`} />

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{details?.name ?? "Institution"}</h4>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {details?.location ?? "Unknown Location"}
                            </p>
                          </div>
                          <Badge variant={isRecommended ? "success" : isBackup ? "warning" : "danger"}>
                            {summary?.matchPercentage ?? 0}% Match
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <span className="text-[11px] text-slate-400 border border-slate-100 rounded bg-slate-50/50 px-1.5 py-0.5 font-mono">
                            NIRF Rank: {details?.nirfRank ?? "N/A"}
                          </span>
                          <span className="text-[11px] text-slate-400 border border-slate-100 rounded bg-slate-50/50 px-1.5 py-0.5 font-mono">
                            Fees: ₹{details?.fees?.toLocaleString() ?? "N/A"}/yr
                          </span>
                        </div>

                        {details?.specialization && details.specialization.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {details.specialization.map((spec, sIdx) => (
                              <Badge key={sIdx} variant="secondary">{spec}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Criteria Match Strength & Weakness List */}
                      <div className="border-t border-slate-100 pt-4 mt-2 space-y-3 flex-1">
                        {summary?.strengths && summary.strengths.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Key Strengths</span>
                            <ul className="space-y-1">
                              {summary.strengths.map((str, sIdx) => (
                                <li key={sIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-50 shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {summary?.weaknesses && summary.weaknesses.length > 0 && (
                          <div className="space-y-1 pt-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Considerations / Risks</span>
                            <ul className="space-y-1">
                              {summary.weaknesses.map((wk, wIdx) => (
                                <li key={wIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                  <XCircle className="h-3.5 w-3.5 text-rose-500 fill-rose-50 shrink-0 mt-0.5" />
                                  <span>{wk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Score Indicator Footer */}
                      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>Overall Score Weighting</span>
                        <span className="font-bold text-slate-800 text-sm">{summary?.overallScore?.toFixed(1) ?? "0.0"} / 100.0</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Careers */}
        {activeTab === "careers" && (
          <div className="space-y-6">
            {!topCareer ? (
              <Card className="text-center py-12 text-slate-400 space-y-2">
                <Info className="h-8 w-8 mx-auto text-slate-300 animate-pulse" />
                <p className="text-sm font-semibold">No Career Recommendation Available</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Career Profile Card */}
                <Card className="md:col-span-2 space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-slate-500" />
                        Target Career Path
                      </h3>
                      <h4 className="text-2xl font-extrabold text-primary-600 mt-2">{topCareer.data?.name ?? "Engineering Career"}</h4>
                      <p className="text-sm text-slate-500 mt-1">{topCareer.data?.description ?? "Core sector technical trajectory."}</p>
                    </div>
                    <Badge variant={topCareer.data?.demand === "HIGH" ? "danger" : "warning"}>
                      {topCareer.data?.demand ?? "MEDIUM"} Demand
                    </Badge>
                  </div>

                  {/* Fit Score Matrices */}
                  <div className="space-y-3 pt-1">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fit Score Analysis</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Overall Fit</span>
                        <span className="text-xl font-bold text-primary-600">{topCareer.careerFitAnalysis?.overallFit ?? 0}%</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Technical Fit</span>
                        <span className="text-xl font-bold text-emerald-600">{topCareer.careerFitAnalysis?.technicalFit ?? 0}%</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Interest Fit</span>
                        <span className="text-xl font-bold text-indigo-600">{topCareer.careerFitAnalysis?.interestFit ?? 0}%</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Growth Index</span>
                        <span className="text-xl font-bold text-amber-600">{topCareer.careerFitAnalysis?.futureGrowthFit ?? 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostics: Skill Gaps */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skill Gap Diagnostics</h5>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Existing Aligned Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {topCareer.skillGapAnalysis?.existingSkills?.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">No overlap identified yet.</span>
                          ) : (
                            topCareer.skillGapAnalysis?.existingSkills?.map((sk: string, idx: number) => (
                              <Badge key={idx} variant="success">{sk}</Badge>
                            ))
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Gaps / Skills to Acquire</span>
                        <div className="flex flex-wrap gap-1.5">
                          {topCareer.skillGapAnalysis?.missingSkills?.length === 0 ? (
                            <span className="text-xs text-emerald-600 font-medium">All target skills present!</span>
                          ) : (
                            topCareer.skillGapAnalysis?.missingSkills?.map((sk: string, idx: number) => (
                              <Badge key={idx} variant="danger">{sk}</Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-medium">
                      <span>Upskilling Path Complexity: <strong>{topCareer.skillGapAnalysis?.learningDifficulty ?? "MEDIUM"}</strong></span>
                      <span>Target Duration: <strong>{topCareer.skillGapAnalysis?.estimatedLearningTime ?? "4 months"}</strong></span>
                    </div>
                  </div>
                </Card>

                {/* Upskilling Courses */}
                <Card className="md:col-span-1 space-y-4 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-slate-500" />
                    Recommended Coursework
                  </h3>
                  <p className="text-xs text-slate-400">Structured modules to close skill gap discrepancies.</p>
                  
                  <div className="border-t border-slate-100 pt-3 space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
                    {recommendedCourses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No required courses scheduled.</p>
                    ) : (
                      recommendedCourses.map((course: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-slate-800 leading-tight block">{course.title}</span>
                            <Badge variant={course.priority === "HIGH" ? "danger" : course.priority === "MEDIUM" ? "warning" : "secondary"}>
                              {course.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>{course.provider}</span>
                            <span>{course.duration}</span>
                          </div>
                          {course.learningOutcome && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed border-t border-slate-100/50 pt-1 mt-1">
                              Outcome: {course.learningOutcome}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Roadmap */}
        {activeTab === "roadmap" && (
          <div className="space-y-6">
            {/* Roadmap Summary Card */}
            <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 border-none text-white">
              <div className="space-y-1 text-left">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">University Learning Sequence</span>
                <h4 className="text-xl font-bold text-white">Target Career: {personalizedRoadmap.metadata?.careerName ?? "Engineer"}</h4>
                <p className="text-xs text-slate-300">{personalizedRoadmap.summary?.totalEstimatedDuration ?? "4 years"}</p>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 text-center sm:text-right">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Semester Milestones</span>
                  <span className="text-lg font-extrabold text-primary-400">{personalizedRoadmap.roadmap?.milestones?.length ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Projects Assigned</span>
                  <span className="text-lg font-extrabold text-emerald-400">{personalizedRoadmap.summary?.totalProjects ?? 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Readiness Indicator</span>
                  <span className="text-lg font-extrabold text-amber-400">{personalizedRoadmap.summary?.readinessScore ?? 0}%</span>
                </div>
              </div>
            </Card>

            {/* Milestones Vertical List */}
            {personalizedRoadmap.roadmap?.milestones?.length === 0 ? (
              <Card className="text-center py-12 text-slate-400 space-y-2">
                <Info className="h-8 w-8 mx-auto text-slate-300 animate-pulse" />
                <p className="text-sm font-semibold">No Milestones Generated</p>
              </Card>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {personalizedRoadmap.roadmap.milestones.map((milestone: any, idx: number) => (
                  <div key={idx} className="relative pl-10">
                    {/* Circle Node on Timeline */}
                    <div className="absolute left-1.5 top-1.5 h-6 w-6 rounded-full bg-white border-4 border-primary-500 shadow-sm flex items-center justify-center z-10" />

                    <Card className="space-y-4">
                      {/* Milestone Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                        <div className="text-left">
                          <h4 className="font-extrabold text-slate-900 text-lg">Semester {milestone.semester} Milestone</h4>
                          <p className="text-xs text-slate-400 mt-0.5 font-medium italic">{milestone.objectives}</p>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1 inline shrink-0" />
                          {milestone.estimatedWeeklyHours} hrs/week load
                        </Badge>
                      </div>

                      {/* Main Semester Grid */}
                      <div className="grid gap-6 md:grid-cols-2 text-left">
                        {/* Left Column: Courses & Topics */}
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Focus Topics</span>
                            <div className="flex flex-wrap gap-1">
                              {milestone.skillsToLearn?.map((topic: string, tIdx: number) => (
                                <Badge key={tIdx} variant="primary">{topic}</Badge>
                              ))}
                            </div>
                          </div>

                          {milestone.recommendedCourses && milestone.recommendedCourses.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Semester Coursework</span>
                              <div className="space-y-1.5">
                                {milestone.recommendedCourses.map((c: any, cIdx: number) => (
                                  <div key={cIdx} className="bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 flex justify-between items-center text-xs">
                                    <span className="font-medium text-slate-700">{c.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{c.duration}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Projects & Prep */}
                        <div className="space-y-3">
                          {milestone.projects && milestone.projects.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Practical Projects</span>
                              <ul className="space-y-1">
                                {milestone.projects.map((proj: string, pIdx: number) => (
                                  <li key={pIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                                    <ListTodo className="h-3.5 w-3.5 text-primary-500 shrink-0 mt-0.5" />
                                    <span>{proj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Career & Coding Practice</span>
                            <p className="text-slate-600 leading-relaxed font-medium">{milestone.codingPractice}</p>
                            {milestone.interviewPreparation && (
                              <p className="text-slate-500 border-t border-slate-100/80 pt-1 mt-1 leading-relaxed">
                                <strong>Prep:</strong> {milestone.interviewPreparation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Outcomes */}
                      {milestone.expectedOutcome && (
                        <div className="border-t border-slate-100 pt-3 flex items-center gap-2 text-xs text-slate-500">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50 shrink-0" />
                          <span>Expected Outcome: <strong className="text-slate-700">{milestone.expectedOutcome}</strong></span>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
