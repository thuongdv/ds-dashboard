import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = "", actions }) => {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "red" | "yellow";
}

const colorStyles = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "bg-blue-100 text-blue-700",
    label: "text-slate-600",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "bg-green-100 text-green-700",
    label: "text-slate-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "bg-red-100 text-red-700",
    label: "text-slate-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "bg-yellow-100 text-yellow-700",
    label: "text-slate-600",
  },
};

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, trend, color = "blue" }) => {
  const styles = colorStyles[color];

  return (
    <div
      className={`${styles.bg} border ${styles.border} rounded-lg px-6 py-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
    >
      <div className="flex items-center gap-5">
        <div className={`${styles.icon} w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className={`text-xs font-medium uppercase tracking-wider ${styles.label} m-0`}>{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1 m-0 leading-tight">{value}</p>
          {trend && (
            <p
              className={`text-xs font-semibold flex items-center gap-1 mt-2 m-0 ${
                trend.isPositive ? "text-green-700" : "text-red-700"
              }`}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              {trend.value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
