"use client";
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { PageContainer } from "../../components/common/PageContainer";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { 
  Input, 
  Select, 
  MultiSelect, 
  RadioGroup, 
  Checkbox, 
  Stepper, 
  ProgressHeader 
} from "../../components/common/WizardComponents";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useCounselling } from "../../lib/context/CounsellingContext";

// ==========================================
// Zod Validation Schema
// ==========================================
const profileSchema = z.object({
  // Step 1: Personal Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.string().min(1, "Please select your gender"),
  category: z.string().min(1, "Please select your category"),
  state: z.string().min(1, "Please enter your state"),
  city: z.string().min(1, "Please enter your city"),

  // Step 2: Academic Info
  entranceExam: z.string().min(1, "Please select entrance exam type"),
  rank: z.number().min(1, "Rank must be greater than 0"),
  boardPercentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
  preferredBranch: z.string().min(1, "Please select preferred branch"),
  preferredColleges: z.string().optional(),

  // Step 3: Preferences
  budget: z.number().min(0, "Budget cannot be negative"),
  hostelRequired: z.boolean(),
  preferredStates: z.array(z.string()).min(1, "Please select at least one preferred state"),
  preferredCities: z.array(z.string()).min(1, "Please select at least one preferred city"),
  higherStudiesInterest: z.boolean(),
  entrepreneurshipInterest: z.boolean(),

  // Step 4: Skills & Interests
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
  currentSkills: z.string().min(1, "Please list at least one skill"),
  learningStyle: z.string().min(1, "Please select preferred learning style"),
  preferredCompanyType: z.array(z.string()).min(1, "Please select at least one company preference"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const STEPS = [
  "Personal Information",
  "Academic Information",
  "Preferences",
  "Skills & Interests",
  "Review & Submit",
];

export default function StartPage() {
  const [step, setStep] = useState(1);
  const [submittedProfile, setSubmittedProfile] = useState<any | null>(null);
  const { submitProfile, loading: apiLoading, error: apiError } = useCounselling();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      gender: "",
      category: "",
      state: "",
      city: "",
      entranceExam: "",
      rank: 0,
      boardPercentage: 0,
      preferredBranch: "",
      preferredColleges: "",
      budget: 0,
      hostelRequired: false,
      preferredStates: [],
      preferredCities: [],
      higherStudiesInterest: false,
      entrepreneurshipInterest: false,
      interests: [],
      currentSkills: "",
      learningStyle: "",
      preferredCompanyType: [],
    },
  });

  // Step-based validation check before moving next
  const handleNext = async () => {
    let fieldsToValidate: (keyof ProfileFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["name", "gender", "category", "state", "city"];
    } else if (step === 2) {
      fieldsToValidate = ["entranceExam", "rank", "boardPercentage", "preferredBranch"];
    } else if (step === 3) {
      fieldsToValidate = ["budget", "preferredStates", "preferredCities"];
    } else if (step === 4) {
      fieldsToValidate = ["interests", "currentSkills", "learningStyle", "preferredCompanyType"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmitForm = (data: ProfileFormData) => {
    // Generate finalized StudentProfile JSON compliant with backend schemas
    const studentProfileEnvelope = {
      version: "1.0.0",
      lastUpdated: new Date().toISOString().split("T")[0],
      id: `student-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      exam: data.entranceExam,
      rank: data.rank,
      collegesAvailable: data.preferredColleges
        ? data.preferredColleges.split(",").map((c) => c.trim())
        : [],
      branchAllocated: data.preferredBranch,
      budget: data.budget,
      preferredLocation: [...data.preferredStates, ...data.preferredCities],
      interests: data.interests,
      preferredCareer: [],
      hostelPreference: data.hostelRequired,
      currentSkills: data.currentSkills.split(",").map((s) => s.trim()),
      preferredLearningStyle: data.learningStyle.toUpperCase(),
      preferredCompanyType: data.preferredCompanyType.map((c) => c.toUpperCase()),
      higherStudiesInterest: data.higherStudiesInterest,
      entrepreneurshipInterest: data.entrepreneurshipInterest,
      metadata: {
        gender: data.gender,
        category: data.category,
        homeState: data.state,
        homeCity: data.city,
        boardPercentage: data.boardPercentage,
      },
    };

    setSubmittedProfile(studentProfileEnvelope);
    setStep(5); // Go to JSON preview step
  };

  const GENDER_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const CATEGORY_OPTIONS = [
    { value: "General", label: "General" },
    { value: "OBC", label: "OBC" },
    { value: "SC", label: "SC" },
    { value: "ST", label: "ST" },
  ];

  const EXAM_OPTIONS = [
    { value: "JEE Mains", label: "JEE Mains" },
    { value: "JEE Advanced", label: "JEE Advanced" },
  ];

  const BRANCH_OPTIONS = [
    { value: "Computer Science & Engineering", label: "Computer Science & Engineering" },
    { value: "Information Technology", label: "Information Technology" },
    { value: "Electronics & Communication", label: "Electronics & Communication" },
    { value: "Electrical Engineering", label: "Electrical Engineering" },
    { value: "Mechanical Engineering", label: "Mechanical Engineering" },
    { value: "Civil Engineering", label: "Civil Engineering" },
  ];

  const STATE_OPTIONS = [
    { value: "New Delhi", label: "New Delhi" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
  ];

  const CITY_OPTIONS = [
    { value: "New Delhi", label: "New Delhi" },
    { value: "Bengaluru", label: "Bengaluru" },
    { value: "Mumbai", label: "Mumbai" },
    { value: "Chennai", label: "Chennai" },
  ];

  const INTEREST_OPTIONS = [
    { value: "AI", label: "Artificial Intelligence" },
    { value: "Web Development", label: "Web Development" },
    { value: "Cybersecurity", label: "Cybersecurity" },
    { value: "Robotics", label: "Robotics" },
    { value: "Cloud", label: "Cloud Computing" },
    { value: "Data Science", label: "Data Science" },
    { value: "Game Development", label: "Game Development" },
    { value: "IoT", label: "IoT" },
    { value: "Blockchain", label: "Blockchain" },
  ];

  const LEARNING_STYLE_OPTIONS = [
    { value: "Visual", label: "Visual (Images/Videos)" },
    { value: "Practical", label: "Practical (Coding/Labs)" },
    { value: "Reading", label: "Reading (Docs/Books)" },
    { value: "Video", label: "Video (Lectures)" },
  ];

  const COMPANY_OPTIONS = [
    { value: "Startup", label: "Startup" },
    { value: "MNC", label: "MNC" },
    { value: "Research", label: "Research Laboratory" },
    { value: "Government", label: "Government Undertaking" },
  ];

  return (
    <PageContainer className="max-w-4xl">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Counselling Wizard
        </h1>
        <p className="mt-2 text-slate-500 text-sm">
          Complete the steps to build your custom academic profile.
        </p>
      </div>

      <Card className="p-8">
        {/* Stepper indicator progress */}
        <Stepper currentStep={step} steps={STEPS} />

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ProgressHeader currentStep={1} totalSteps={5} stepName="Personal Information" />
                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Full Name"
                    required
                    placeholder="Enter your full name"
                    error={errors.name?.message}
                    {...register("name")}
                  />
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <Select
                        label="Gender"
                        required
                        options={GENDER_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.gender?.message}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        label="Category"
                        required
                        options={CATEGORY_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.category?.message}
                      />
                    )}
                  />
                  <Input
                    label="Home State"
                    required
                    placeholder="e.g. Karnataka"
                    error={errors.state?.message}
                    {...register("state")}
                  />
                  <Input
                    label="Home City"
                    required
                    placeholder="e.g. Bengaluru"
                    error={errors.city?.message}
                    {...register("city")}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Academic Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ProgressHeader currentStep={2} totalSteps={5} stepName="Academic Information" />
                <div className="grid gap-6 md:grid-cols-2">
                  <Controller
                    control={control}
                    name="entranceExam"
                    render={({ field }) => (
                      <Select
                        label="Entrance Exam"
                        required
                        options={EXAM_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.entranceExam?.message}
                      />
                    )}
                  />
                  <Input
                    label="Entrance Exam Rank"
                    required
                    type="number"
                    placeholder="e.g. 4500"
                    error={errors.rank?.message}
                    {...register("rank", { valueAsNumber: true })}
                  />
                  <Input
                    label="Board Percentage (12th)"
                    required
                    type="number"
                    step="0.01"
                    placeholder="e.g. 92.5"
                    error={errors.boardPercentage?.message}
                    {...register("boardPercentage", { valueAsNumber: true })}
                  />
                  <Controller
                    control={control}
                    name="preferredBranch"
                    render={({ field }) => (
                      <Select
                        label="Preferred Branch"
                        required
                        options={BRANCH_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.preferredBranch?.message}
                      />
                    )}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Preferred Colleges (Optional, comma-separated)"
                      placeholder="e.g. IIT Delhi, BITS Pilani"
                      error={errors.preferredColleges?.message}
                      {...register("preferredColleges")}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ProgressHeader currentStep={3} totalSteps={5} stepName="Preferences" />
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Yearly Budget Cap (INR)"
                      required
                      type="number"
                      placeholder="e.g. 300000"
                      error={errors.budget?.message}
                      {...register("budget", { valueAsNumber: true })}
                    />
                    <div className="flex items-center pt-8">
                      <Controller
                        control={control}
                        name="hostelRequired"
                        render={({ field }) => (
                          <Checkbox
                            label="Hostel Accommodation Required"
                            checked={field.value}
                            onChange={field.onChange}
                            error={errors.hostelRequired?.message}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <Controller
                    control={control}
                    name="preferredStates"
                    render={({ field }) => (
                      <MultiSelect
                        label="Preferred States"
                        required
                        options={STATE_OPTIONS}
                        selectedValues={field.value}
                        onChange={field.onChange}
                        error={errors.preferredStates?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="preferredCities"
                    render={({ field }) => (
                      <MultiSelect
                        label="Preferred Cities"
                        required
                        options={CITY_OPTIONS}
                        selectedValues={field.value}
                        onChange={field.onChange}
                        error={errors.preferredCities?.message}
                      />
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-2 border-t border-slate-100 pt-4">
                    <Controller
                      control={control}
                      name="higherStudiesInterest"
                      render={({ field }) => (
                        <Checkbox
                          label="Interested in Higher Studies (M.Tech/MS)"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="entrepreneurshipInterest"
                      render={({ field }) => (
                        <Checkbox
                          label="Interested in Entrepreneurship / Startups"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Skills & Interests */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ProgressHeader currentStep={4} totalSteps={5} stepName="Skills & Interests" />
                <div className="space-y-6">
                  <Controller
                    control={control}
                    name="interests"
                    render={({ field }) => (
                      <MultiSelect
                        label="Technology Interests"
                        required
                        options={INTEREST_OPTIONS}
                        selectedValues={field.value}
                        onChange={field.onChange}
                        error={errors.interests?.message}
                      />
                    )}
                  />

                  <Input
                    label="Current Skills (Comma-separated list)"
                    required
                    placeholder="e.g. Python, SQL, C++, HTML"
                    error={errors.currentSkills?.message}
                    {...register("currentSkills")}
                  />

                  <Controller
                    control={control}
                    name="learningStyle"
                    render={({ field }) => (
                      <RadioGroup
                        label="Preferred Learning Style"
                        required
                        name="learningStyle"
                        options={LEARNING_STYLE_OPTIONS}
                        selectedValue={field.value}
                        onChange={field.onChange}
                        error={errors.learningStyle?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="preferredCompanyType"
                    render={({ field }) => (
                      <MultiSelect
                        label="Preferred Employer Types"
                        required
                        options={COMPANY_OPTIONS}
                        selectedValues={field.value}
                        onChange={field.onChange}
                        error={errors.preferredCompanyType?.message}
                      />
                    )}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {step === 5 && submittedProfile && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <ProgressHeader currentStep={5} totalSteps={5} stepName="Review & Preview Profile" />
                
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-5 flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="font-bold text-emerald-800">Profile Structured Successfully</h3>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      All validations passed! The output is aggregated into the strongly typed JSON object below, ready to be dispatched to the counseling multi-agent orchestration.
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 text-left border-y border-slate-100 py-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Personal & Academic</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>Name: <span className="font-semibold text-slate-900">{getValues("name")}</span></li>
                      <li>Gender: <span className="font-semibold text-slate-900">{getValues("gender")}</span></li>
                      <li>Category: <span className="font-semibold text-slate-900">{getValues("category")}</span></li>
                      <li>Exam/Rank: <span className="font-semibold text-slate-900">{getValues("entranceExam")} (Rank: {getValues("rank")})</span></li>
                      <li>Branch: <span className="font-semibold text-slate-900">{getValues("preferredBranch")}</span></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Preferences & Skills</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                      <li>Budget: <span className="font-semibold text-slate-900">INR {getValues("budget")}</span></li>
                      <li>Hostel Needed: <span className="font-semibold text-slate-900">{getValues("hostelRequired") ? "Yes" : "No"}</span></li>
                      <li>Locations: <span className="font-semibold text-slate-900">{[...getValues("preferredStates"), ...getValues("preferredCities")].join(", ")}</span></li>
                      <li>Interests: <span className="font-semibold text-slate-900">{getValues("interests").join(", ")}</span></li>
                      <li>Learning: <span className="font-semibold text-slate-900">{getValues("learningStyle")}</span></li>
                    </ul>
                  </div>
                </div>

                <div className="text-left space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">JSON Preview Payload</span>
                  <pre className="bg-slate-900 text-slate-200 rounded-xl p-5 text-xs font-mono overflow-x-auto max-h-[300px] border border-slate-800 shadow-inner">
                    {JSON.stringify(submittedProfile, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Buttons Panel */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            {step > 1 && step < 5 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrevious}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
            ) : step === 5 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(4)}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Edit
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-1.5"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : step === 4 ? (
              <Button
                type="submit"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-100"
              >
                Compile Profile <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {apiError && (
                  <p className="text-xs font-semibold text-rose-600">{apiError.message}</p>
                )}
                <Button
                  type="button"
                  onClick={() => {
                    if (submittedProfile) {
                      submitProfile(submittedProfile);
                    }
                  }}
                  disabled={apiLoading}
                  className="gap-1.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800"
                >
                  {apiLoading ? "Generating..." : "Generate Recommendation"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
