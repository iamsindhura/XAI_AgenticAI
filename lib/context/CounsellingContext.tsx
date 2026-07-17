"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { StudentProfile } from "../../src/knowledge/schemas/student";
import { SummaryResponse } from "../../src/presentation/decision-summary-service";
import { PipelineStatus, ApiError } from "../api/types";
import { CounsellingApi } from "../api/counselling";
import { useRouter } from "next/navigation";

interface CounsellingContextType {
  studentProfile: StudentProfile | null;
  summaryResponse: SummaryResponse | null;
  loading: boolean;
  error: ApiError | null;
  pipelineStatus: PipelineStatus;
  submitProfile: (profile: StudentProfile) => Promise<void>;
  resetStatus: () => void;
}

const CounsellingContext = createContext<CounsellingContextType | undefined>(undefined);

export const CounsellingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [summaryResponse, setSummaryResponse] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("IDLE");
  const router = useRouter();

  // Load persisted state from sessionStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedProfile = sessionStorage.getItem("studentProfile");
        const storedSummary = sessionStorage.getItem("summaryResponse");
        const storedStatus = sessionStorage.getItem("pipelineStatus");

        if (storedProfile) {
          setStudentProfile(JSON.parse(storedProfile));
        }
        if (storedSummary) {
          setSummaryResponse(JSON.parse(storedSummary));
        }
        if (storedStatus) {
          setPipelineStatus(storedStatus as PipelineStatus);
        }
      } catch (e) {
        console.error("Failed to parse counselling state from sessionStorage", e);
      }
    }
  }, []);

  // Persist state updates to sessionStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (studentProfile) {
        sessionStorage.setItem("studentProfile", JSON.stringify(studentProfile));
      } else {
        sessionStorage.removeItem("studentProfile");
      }
    }
  }, [studentProfile]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (summaryResponse) {
        sessionStorage.setItem("summaryResponse", JSON.stringify(summaryResponse));
      } else {
        sessionStorage.removeItem("summaryResponse");
      }
    }
  }, [summaryResponse]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pipelineStatus", pipelineStatus);
    }
  }, [pipelineStatus]);

  const submitProfile = async (profile: StudentProfile) => {
    setLoading(true);
    setError(null);
    setStudentProfile(profile);
    setPipelineStatus("VALIDATING");

    try {
      if (!profile.name || !profile.exam || !profile.rank) {
        throw new Error("Missing required profile fields for multi-agent execution.");
      }

      setPipelineStatus("SUBMITTING");
      router.push("/dashboard/loading");

      // Brief delay to allow transitions
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      setPipelineStatus("PROCESSING");
      const summary = await CounsellingApi.submitProfile(profile);

      setSummaryResponse(summary);
      setPipelineStatus("SUCCESS");
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setPipelineStatus("FAILED");
      const mappedError: ApiError = {
        message: err.message || "Failed to process recommendations",
        code: err.code || "SUBMISSION_FAILED",
        details: err.details || err,
      };
      setError(mappedError);
    }
  };

  const resetStatus = () => {
    setPipelineStatus("IDLE");
    setError(null);
    setSummaryResponse(null);
    setStudentProfile(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("studentProfile");
      sessionStorage.removeItem("summaryResponse");
      sessionStorage.setItem("pipelineStatus", "IDLE");
    }
  };

  return (
    <CounsellingContext.Provider
      value={{
        studentProfile,
        summaryResponse,
        loading,
        error,
        pipelineStatus,
        submitProfile,
        resetStatus,
      }}
    >
      {children}
    </CounsellingContext.Provider>
  );
};

export const useCounselling = () => {
  const context = useContext(CounsellingContext);
  if (context === undefined) {
    throw new Error("useCounselling must be used within a CounsellingProvider");
  }
  return context;
};
