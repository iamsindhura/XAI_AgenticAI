import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "../components/layout/LayoutWrapper";
import { CounsellingProvider } from "../lib/context/CounsellingContext";

export const metadata: Metadata = {
  title: "Antigravity AI | College & Career Counselling",
  description: "Next-gen counseling system powered by topological sorting decision engines and explainable AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <CounsellingProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CounsellingProvider>
      </body>
    </html>
  );
}
