import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = "",
  ...props
}) => {
  const baseStyle = "bg-white border border-slate-100 rounded-xl p-6 shadow-sm";
  const hoverStyle = hoverEffect ? "hover:shadow-md hover:border-slate-200 transition-all duration-300" : "";

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
