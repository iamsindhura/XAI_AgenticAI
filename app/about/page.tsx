import React from "react";
import { PageContainer } from "../../components/common/PageContainer";
import { SectionHeader } from "../../components/common/SectionHeader";
import { Card } from "../../components/common/Card";
import { ShieldCheck, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <PageContainer>
      <SectionHeader 
        title="About the Project" 
        subtitle="Exploring deterministic reasoning modeling for high-fidelity academic counseling."
      />
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary-600" />
            <h3 className="text-xl font-bold text-slate-900">Project Mission</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Standard recommender pipelines rely on probabilistic models that can yield stochastic, inconsistent pathways for students. 
            Our platform utilizes deterministic operations, ensuring that the same student profile always yields the exact same ranked counseling matches, upskilling sequences, and milestones.
          </p>
        </Card>
        
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary-600" />
            <h3 className="text-xl font-bold text-slate-900">Explainable AI Framework</h3>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            By avoiding black-box neural recommendation architectures, our decision engine logs absolute traces for every criteria score (roi, placement, coding, growth). 
            This grounded approach allows students and parents to transparently analyze the exact metrics influencing a recommendation.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
