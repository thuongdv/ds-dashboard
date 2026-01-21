import React, { useState } from "react";

interface SidebarProps {
  activeView: "summary" | "flaky" | "pods";
  onViewChange: (view: "summary" | "flaky" | "pods") => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const navItems = [
    {
      id: "summary",
      label: "Summary",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
      color: "text-blue-600",
    },
    {
      id: "flaky",
      label: "Flaky Tests",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      ),
      color: "text-orange-600",
    },
    {
      id: "pods",
      label: "Queue History",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      ),
      color: "text-cyan-600",
    },
  ] as const;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-50 text-gray-900 flex flex-col shadow-md border-r border-gray-200 z-50 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="border-b border-gray-200 p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">Test Dashboard</h2>
            <p className="text-sm text-gray-600 font-normal mt-1">Automated Testing</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          title={isCollapsed ? "Expand" : "Collapse"}
          aria-label="Toggle sidebar"
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center px-4 py-3 transition-all duration-200 rounded-lg ${
                  activeView === item.id ? "bg-gray-200/70 text-gray-900" : "text-gray-700 hover:bg-gray-200/50"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`flex-shrink-0 ${item.color}`}>{item.icon}</span>
                {!isCollapsed && <span className="ml-3 flex-1 text-left font-normal text-sm">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <p className={`text-xs text-gray-500 text-center font-normal ${isCollapsed ? "hidden" : ""}`}>
          © 2025 Test Utilities
        </p>
      </div>
    </aside>
  );
};
