import React from "react";
import Link from "next/link";
import { PageContainer } from "../components/common/PageContainer";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { 
  Zap, 
  Map, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      title: "Multi-Agent Intelligence",
      description: "Planned collaborative pipeline utilizing specialized profile, scoring, comparison, and sequencing agents.",
      icon: Cpu,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Deterministic Recommendations",
      description: "Rigorous weighted sum parameters resolving college, branch, and career fits without stochastic deviations.",
      icon: Zap,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Explainable AI (XAI)",
      description: "Every counseling choice prints structural trace criteria logs and immutable audit signatures for complete visibility.",
      icon: ShieldCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Personalized Roadmaps",
      description: "Generates custom semester-by-semester objectives, project lists, coding practices, and certification pathways.",
      icon: Map,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="flex-1 bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-primary-50/50 to-white">
        <PageContainer className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100/60 px-3 py-1 text-xs font-semibold text-primary-800 border border-primary-200">
                <span>Core Decision Engine v1.0 Active</span>
                <ChevronRight className="h-3 w-3" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Precision AI College & <br />
                <span className="text-primary-600">Career Counselling</span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-500 sm:text-xl">
                A fully deterministic, multi-agent student counselling system. 
                Build custom profiles, compare engineering options, and map semester milestones based on mathematical score traces.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/start">
                  <Button size="lg" className="gap-2">
                    Start Counselling <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="secondary" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Illustration placeholder */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 border border-primary-200/50 shadow-lg p-6 flex flex-col justify-between overflow-hidden">
                {/* Decorative background grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                
                <div className="flex justify-between items-start">
                  <div className="rounded-lg bg-white p-3 shadow-md border border-slate-100">
                    <Cpu className="h-6 w-6 text-primary-600 animate-pulse" />
                  </div>
                  <div className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Pipeline Synced
                  </div>
                </div>

                <div className="space-y-3 bg-white/70 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-sm relative z-10">
                  <div className="h-2 bg-slate-200 rounded-full w-2/3" />
                  <div className="h-2 bg-slate-200 rounded-full w-4/5" />
                  <div className="h-2.5 bg-primary-200 rounded-full w-1/2 animate-pulse" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-slate-400 font-mono">Trace Signature</span>
                    <span className="text-[10px] text-primary-600 font-semibold font-mono">#9AD4F8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Feature Cards Grid Section */}
      <section className="py-20 border-t border-slate-100 bg-slate-50/30">
        <PageContainer>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              System Architecture & Core Framework
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Deterministic, explainable reasoning agents cooperating on a unified student upskilling and college matching model.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card key={feat.title} hoverEffect className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className={`inline-flex rounded-lg p-3 border ${feat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feat.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
