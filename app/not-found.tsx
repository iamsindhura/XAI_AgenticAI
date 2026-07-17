import React from "react";
import Link from "next/link";
import { PageContainer } from "../components/common/PageContainer";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";

export default function NotFound() {
  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="max-w-md w-full text-center space-y-6">
        <h2 className="text-6xl font-extrabold text-primary-600 font-mono">404</h2>
        <h3 className="text-2xl font-bold text-slate-900">Page Not Found</h3>
        <p className="text-slate-500 text-sm">
          The requested engineering endpoint or counseling step does not exist.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
