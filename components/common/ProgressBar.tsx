import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showValueLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showValueLabel = false,
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      {(label || showValueLabel) && (
        <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-700">
          <span>{label}</span>
          {showValueLabel && <span>{percentage}%</span>}
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
