import React from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg border border-slate-200">
            <span className="text-lg">📅</span>
            <span className="text-sm font-medium text-slate-700">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
