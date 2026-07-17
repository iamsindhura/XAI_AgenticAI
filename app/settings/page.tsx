import React from "react";
import { PageContainer } from "../../components/common/PageContainer";
import { SectionHeader } from "../../components/common/SectionHeader";
import { Card } from "../../components/common/Card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageContainer>
      <SectionHeader 
        title="Settings & Workspace Preferences" 
        subtitle="Manage weights, rules configuration thresholds, and framework variables."
      />
      <Card className="max-w-2xl mx-auto text-center space-y-6">
        <div className="mx-auto inline-flex items-center justify-center p-3 rounded-full bg-primary-50 border border-primary-100">
          <Settings className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Framework Configuration</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
          Here you will configure Decision Engine weights (e.g. ROI weight, placement importance) and system preference logs.
        </p>
      </Card>
    </PageContainer>
  );
}
