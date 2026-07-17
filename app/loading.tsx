import React from "react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { PageContainer } from "../components/common/PageContainer";

export default function LoadingPage() {
  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading Counselling Workspace...
        </p>
      </div>
    </PageContainer>
  );
}
