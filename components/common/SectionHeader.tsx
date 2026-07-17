import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  align = "left",
}) => {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : "text-left"}`}>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-lg text-slate-500 max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
};
