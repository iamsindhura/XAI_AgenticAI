import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
}) => {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border";
  
  const variants = {
    primary: "bg-primary-50 text-primary-700 border-primary-100",
    secondary: "bg-slate-50 text-slate-700 border-slate-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]}`}>
      {children}
    </span>
  );
};
