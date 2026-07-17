import React from "react";
import { Check, AlertCircle } from "lucide-react";

// ==========================================
// 1. Input Component
// ==========================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-0.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
              ${error ? "border-rose-400 bg-rose-50/10 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200"}
              ${className}
            `}
            {...props}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 flex items-center pointer-events-none">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ==========================================
// 2. Select Component
// ==========================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-0.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <select
          ref={ref}
          className={`
            w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${error ? "border-rose-400 bg-rose-50/10 focus:ring-rose-500/20 focus:border-rose-500" : "border-slate-200"}
            ${className}
          `}
          {...props}
        >
          <option value="">Select option...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ==========================================
// 3. Multi Select Component
// ==========================================
interface MultiSelectProps {
  label: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  error,
  required,
  options,
  selectedValues,
  onChange,
}) => {
  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="w-full space-y-2 text-left">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-0.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                ${
                  isSelected
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
};

// ==========================================
// 4. Radio Group Component
// ==========================================
interface RadioGroupProps {
  label: string;
  error?: string;
  required?: boolean;
  name: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  error,
  required,
  name,
  options,
  selectedValue,
  onChange,
}) => {
  return (
    <div className="w-full space-y-2 text-left">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-0.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`
                flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all text-center
                ${
                  isSelected
                    ? "bg-primary-50 text-primary-700 border-primary-500 ring-2 ring-primary-500/10 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }
              `}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => {}}
                className="sr-only"
              />
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
};

// ==========================================
// 5. Checkbox Component
// ==========================================
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  error,
}) => {
  return (
    <div className="space-y-1 text-left">
      <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`
            flex items-center justify-center h-5 w-5 rounded border transition-all
            ${
              checked
                ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                : "bg-white border-slate-300 group-hover:border-slate-400"
            }
          `}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
        </div>
        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
          {label}
        </span>
      </label>
      {error && <p className="text-xs font-medium text-rose-600 pl-8">{error}</p>}
    </div>
  );
};

// ==========================================
// 6. Stepper Component
// ==========================================
interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full flex items-center justify-between py-4 border-b border-slate-100 mb-8 overflow-x-auto gap-4">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;

        return (
          <div key={step} className="flex items-center gap-2.5 shrink-0">
            <div
              className={`
                h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isActive
                    ? "bg-primary-600 border-primary-600 text-white ring-4 ring-primary-500/10"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }
              `}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
            </div>
            <span
              className={`
                text-xs font-semibold tracking-wide
                ${isActive ? "text-primary-700 font-bold" : isCompleted ? "text-emerald-600" : "text-slate-400"}
              `}
            >
              {step}
            </span>
            {idx < steps.length - 1 && (
              <div className="h-[1px] w-8 bg-slate-200 hidden sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 7. Progress Header Component
// ==========================================
interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  currentStep,
  totalSteps,
  stepName,
}) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-end">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">
            Step {currentStep} of {totalSteps}
          </p>
          <h2 className="text-xl font-extrabold text-slate-900">{stepName}</h2>
        </div>
        <span className="text-sm font-semibold text-slate-500">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary-600 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
