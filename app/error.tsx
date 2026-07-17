"use client";
import React, { useEffect } from "react";
import { PageContainer } from "../components/common/PageContainer";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled frontend boundary error:", error);
  }, [error]);

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="max-w-md w-full text-center space-y-6">
        <h2 className="text-4xl font-bold text-rose-600">Error Encountered</h2>
        <p className="text-slate-500 text-sm">
          Something went wrong during component render. Please retry or reload.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Button onClick={() => reset()}>Retry Render</Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload App
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
