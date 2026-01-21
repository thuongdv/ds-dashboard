import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { generateSummaryRows, loadAllReports, ReportData } from "../dataLoader";
import logger from "../logger";
import { FlakyTest, SummaryRow } from "../types";
import { calculateFlakyTests, openTestOnDWS, parseTestReport, PROJECT_NAMES } from "../utils";
import { Card, StatCard } from "./Card/Card";
import { Header } from "./Layout/Header";
import { Sidebar } from "./Layout/Sidebar";
import { PodsQueueData } from "./PodsQueueData";

export const Dashboard: React.FC = () => {
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [flakyTestsByProject, setFlakyTestsByProject] = useState<Map<string, FlakyTest[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"summary" | "flaky" | "pods">("summary");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(PROJECT_NAMES));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const toggleProject = (projectName: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectName)) {
        newSet.delete(projectName);
      } else {
        newSet.add(projectName);
      }
      return newSet;
    });
  };

  const loadData = async () => {
    try {
      const reportsData = await loadAllReports();
      const summary = generateSummaryRows(reportsData);
      setSummaryRows(summary);

      // Calculate flaky tests across all reports
      const allTests = reportsData.flatMap((rd: ReportData) => rd.reports.flatMap((report) => parseTestReport(report)));

      const flakyMap = new Map<string, FlakyTest[]>();
      for (const projectName of PROJECT_NAMES) {
        const flakyTests = calculateFlakyTests(allTests, projectName);
        if (flakyTests.length > 0) {
          flakyMap.set(projectName, flakyTests);
        }
      }

      setFlakyTestsByProject(flakyMap);
      setLoading(false);
    } catch (error) {
      logger.error("Failed to load reports:", error);
      setLoading(false);
    }
  };

  if (loading && activeView !== "pods") {
    return (
      <div className="app-container">
        <Sidebar activeView={activeView} onViewChange={setActiveView} onCollapseChange={setSidebarCollapsed} />
        <div className={`main-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
          <Header title="Test Results Dashboard" subtitle="Automated Testing Overview" />
          <div className="content-wrapper">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading test results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall statistics
  const totalTests = summaryRows.reduce((sum, row) => sum + row.total, 0);
  const totalPassed = summaryRows.reduce((sum, row) => sum + row.passed, 0);
  const totalFailed = summaryRows.reduce((sum, row) => sum + row.notPassed, 0);
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";
  const totalFlakyTests = Array.from(flakyTestsByProject.values()).reduce((sum, tests) => sum + tests.length, 0);

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onCollapseChange={setSidebarCollapsed} />
      <div className={`main-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Header
          title="Test Results Dashboard"
          subtitle="Monitor your automated testing performance and track flaky tests"
        />
        <div className="content-wrapper">
          {activeView === "summary" && (
            <>
              <div className="stats-grid">
                <StatCard icon="📊" label="Total Tests" value={totalTests.toLocaleString()} color="blue" />
                <StatCard icon="✅" label="Passed" value={totalPassed.toLocaleString()} color="green" />
                <StatCard icon="❌" label="Failed" value={totalFailed.toLocaleString()} color="red" />
                <StatCard
                  icon="📈"
                  label="Pass Rate"
                  value={`${overallPassRate}%`}
                  color={Number.parseFloat(overallPassRate) >= 90 ? "green" : "yellow"}
                />
              </div>

              <Card title="Test Results Summary">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Pass Rate</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryRows.map((row) => (
                        <tr key={`${row.date}-${row.reportPath}`}>
                          <td className="font-semibold">{row.date}</td>
                          <td>{row.total}</td>
                          <td className="status-passed">{row.passed}</td>
                          <td className="status-failed">{row.notPassed}</td>
                          <td>
                            <span
                              className={`badge ${
                                Number.parseFloat(row.passedRate) >= 90 ? "badge-success" : "badge-warning"
                              }`}
                            >
                              {row.passedRate}
                            </span>
                          </td>
                          <td>
                            <Link to={row.reportPath} className="btn-link">
                              View Details →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {activeView === "flaky" && (
            <>
              <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                <StatCard icon="⚠️" label="Total Flaky Tests" value={totalFlakyTests.toLocaleString()} color="yellow" />
              </div>

              {PROJECT_NAMES.map((projectName) => {
                const flakyTests = flakyTestsByProject.get(projectName);
                if (!flakyTests || flakyTests.length === 0) return null;

                const isExpanded = expandedProjects.has(projectName);

                return (
                  <Card key={projectName} title={projectName} className="flaky-card">
                    <div
                      onClick={() => toggleProject(projectName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleProject(projectName);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${projectName} flaky tests section`}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem",
                        marginBottom: "0.5rem",
                        borderRadius: "0.375rem",
                        backgroundColor: "var(--card-hover-bg, #f9fafb)",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--card-hover-bg-hover, #f3f4f6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--card-hover-bg, #f9fafb)";
                      }}
                    >
                      <span style={{ fontWeight: "500", fontSize: "0.95rem" }}>
                        {flakyTests.length} flaky test{flakyTests.length !== 1 ? "s" : ""} found
                      </span>
                      <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{isExpanded ? "▼" : "▶"}</span>
                    </div>

                    {isExpanded && (
                      <div className="table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Test Name</th>
                              <th>Scenario</th>
                              <th>Total Runs</th>
                              <th>Pass</th>
                              <th>Fail</th>
                              <th>Flaky Rate</th>
                              <th>Last Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flakyTests.map((test, index) => (
                              <tr key={`${test.testName}-${test.scenario}`}>
                                <td className="text-muted">{index + 1}</td>
                                <td className="font-semibold">
                                  <div className="test-name-container">
                                    <div>
                                      {test.jiraKey ? (
                                        <a
                                          title={`${test.testName}`}
                                          href={`${import.meta.env.VITE_JIRA_BASE_URL || ""}/browse/${test.jiraKey}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="jira-link"
                                        >
                                          {test.testName}
                                        </a>
                                      ) : (
                                        <span>{test.testName}</span>
                                      )}
                                    </div>
                                    <div className="test-name-actions">
                                      <button
                                        onClick={() => openTestOnDWS(test.testName)}
                                        className="test-name-copy-button"
                                        title="Open test on DWS Dashboard"
                                        type="button"
                                      >
                                        🔗
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td>{test.scenario}</td>
                                <td>{test.totalRuns}</td>
                                <td className="status-passed">{test.pass}</td>
                                <td className="status-failed">{test.notPassed}</td>
                                <td>
                                  <span className="badge badge-warning">{test.flakyRate}</span>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      test.lastStatus === "PASSED" ? "badge-success" : "badge-danger"
                                    }`}
                                  >
                                    {test.lastStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                );
              })}

              {flakyTestsByProject.size === 0 && (
                <Card>
                  <div className="empty-state">
                    <span className="empty-icon">🎉</span>
                    <h3>No Flaky Tests Detected</h3>
                    <p>All tests are running consistently. Great job!</p>
                  </div>
                </Card>
              )}
            </>
          )}

          {activeView === "pods" && <PodsQueueData />}
        </div>
      </div>
    </div>
  );
};
