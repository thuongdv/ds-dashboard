import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx-republish";
import { loadReportByIndex } from "../dataLoader";
import logger from "../logger";
import { ProjectSummary, TestCase } from "../types";
import {
  calculateSummary,
  calculateSummaryForTests,
  convertToTestCases,
  copyToClipboard,
  openTestOnDWS,
  parseTestReport,
  PROJECT_NAMES,
} from "../utils";
import { Card, StatCard } from "./Card/Card";
import { Header } from "./Layout/Header";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export const ReportDetail: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [projectSummaries, setProjectSummaries] = useState<ProjectSummary[]>([]);
  const [testCasesByProject, setTestCasesByProject] = useState<Map<string, TestCase[]>>(new Map());
  const [filterByProject, setFilterByProject] = useState<Map<string, string>>(new Map());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(PROJECT_NAMES));
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [screenshotModal, setScreenshotModal] = useState<{ isOpen: boolean; url: string; loading: boolean }>({
    isOpen: false,
    url: "",
    loading: false,
  });

  useEffect(() => {
    loadReportData();
  }, [reportId]);

  const loadReportData = async () => {
    try {
      const index = Number.parseInt(reportId || "0", 10);
      const loadedReports = await loadReportByIndex(index);

      const allTests = loadedReports.flatMap((report) => parseTestReport(report, report.filename));

      // Calculate overall summary for chart
      const summary = calculateSummary(allTests);
      setChartData({
        labels: ["PASSED", "NOT PASSED"],
        datasets: [
          {
            data: [summary.passed, summary.notPassed],
            backgroundColor: ["#4caf50", "#f44336"],
            borderColor: ["#388e3c", "#c62828"],
            borderWidth: 1,
          },
        ],
      });

      // Group reports by project name (extract project name from filename)
      const reportsByProjectName = new Map<string, typeof loadedReports>();
      for (const report of loadedReports) {
        if (report.filename) {
          // Extract project name (everything before the timestamp if present)
          // Example: "03.) JDEdwards Manufacturing_21-11-02" -> "03.) JDEdwards Manufacturing"
          const projectName = report.filename.includes("_")
            ? report.filename.substring(0, report.filename.lastIndexOf("_"))
            : report.filename;

          if (!reportsByProjectName.has(projectName)) {
            reportsByProjectName.set(projectName, []);
          }
          reportsByProjectName.get(projectName)!.push(report);
        }
      }

      // Calculate project summaries with display names
      const summaries: ProjectSummary[] = [];
      const testCasesMap = new Map<string, TestCase[]>();
      const filterMap = new Map<string, string>();
      const expandedSet = new Set<string>();

      for (const [projectName, reports] of reportsByProjectName.entries()) {
        const hasMultipleReports = reports.length > 1;

        if (hasMultipleReports) {
          // Show multiple rows with timestamps
          for (const report of reports) {
            const displayName = report.filename || projectName;
            const reportTests = parseTestReport(report, report.filename);

            // Use utility function to calculate summary
            summaries.push(calculateSummaryForTests(reportTests, displayName));

            // Use utility function to convert test results to test cases
            testCasesMap.set(displayName, convertToTestCases(reportTests));
            filterMap.set(displayName, "NOT PASSED");
            expandedSet.add(displayName);
          }
        } else {
          // Show single row with project name only (no timestamp)
          const allReportTests = reports.flatMap((r) => parseTestReport(r, r.filename));

          // Use utility function to calculate summary
          summaries.push(calculateSummaryForTests(allReportTests, projectName));

          // Use utility function to convert test results to test cases
          testCasesMap.set(projectName, convertToTestCases(allReportTests));
          filterMap.set(projectName, "NOT PASSED");
          expandedSet.add(projectName);
        }
      }

      setProjectSummaries(summaries);
      setTestCasesByProject(testCasesMap);
      setFilterByProject(filterMap);
      setExpandedProjects(expandedSet);

      setLoading(false);
    } catch (error) {
      logger.error("Failed to load report:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (projectName: string, status: string) => {
    const newFilter = new Map(filterByProject);
    newFilter.set(projectName, status);
    setFilterByProject(newFilter);
  };

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

  const exportToExcel = (projectName: string) => {
    const testCases = testCasesByProject.get(projectName) || [];
    const currentFilter = filterByProject.get(projectName) || "NOT PASSED";

    // Filter test cases based on current filter
    const filteredCases = currentFilter === "ALL" ? testCases : testCases.filter((tc) => tc.status === currentFilter);

    if (filteredCases.length === 0) {
      alert("No test cases to export with the current filter.");
      return;
    }

    // Prepare data for export
    const exportData = filteredCases.map((tc) => ({
      Index: tc.index,
      "Test Name": tc.testName,
      Scenario: tc.scenario,
      "Jira Key": tc.jiraKey || "",
      Error: tc.errorTitle ? `${tc.errorTitle}\n${tc.errorDescription}` : "",
      "Executed By": tc.executedBy,
      "Start Time": tc.startTime,
      "End Time": tc.endTime,
      Duration: tc.duration,
      Status: tc.status,
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

    // Auto-size columns
    const maxWidth = 50;
    const columnWidths = Object.keys(exportData[0] || {}).map((key) => {
      const maxLength = Math.max(key.length, ...exportData.map((row) => String(row[key as keyof typeof row]).length));
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = columnWidths;

    // Generate filename with project name and filter
    const filterSuffix = currentFilter === "ALL" ? "" : `_${currentFilter.split(" ").join("_")}`;
    const filename = `${projectName.replace(/[^a-z0-9]/gi, "_")}${filterSuffix}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  const getFilteredTestCases = (projectName: string): TestCase[] => {
    const testCases = testCasesByProject.get(projectName) || [];
    const filter = filterByProject.get(projectName) || "ALL";

    if (filter === "ALL") {
      return testCases;
    }

    return testCases.filter((tc) => tc.status === filter);
  };

  const openScreenshotModal = (url: string) => {
    // Convert local relative paths to proper URLs
    let imageUrl = url;
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      // Local screenshot path - convert to absolute path from the current origin
      // Collector emits relative paths like "screenshots/..." which are served alongside the app
      // Normalize to "/screenshots/..." (or "/<relative-path>") without assuming a specific subdirectory
      if (!url.startsWith("/")) {
        imageUrl = `/${url}`;
      }
    }
    setScreenshotModal({ isOpen: true, url: imageUrl, loading: true });
  };

  const closeScreenshotModal = () => {
    setScreenshotModal({ isOpen: false, url: "", loading: false });
  };

  const handleImageLoad = () => {
    setScreenshotModal((prev) => ({ ...prev, loading: false }));
  };

  const handleImageError = () => {
    // Stop showing the loader, clear the URL to avoid a broken <img>, and notify the user.
    setScreenshotModal((prev) => ({ ...prev, loading: false, url: "" }));
    alert("Failed to load screenshot. The screenshot file may be missing or unavailable.");
  };

  const copyTestNames = (projectName: string) => {
    const filteredTestCases = getFilteredTestCases(projectName);
    const testNames = filteredTestCases.map((tc) => tc.testName).join("\n");

    copyToClipboard(testNames).then(
      () => {
        alert(`Copied ${filteredTestCases.length} test names to clipboard!`);
      },
      (err) => {
        logger.error("Failed to copy test names:", err);
        alert("Failed to copy test names to clipboard.");
      },
    );
  };

  if (loading) {
    return (
      <div className="report-container">
        <div className="report-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overall statistics
  const totalTests = projectSummaries.reduce((sum, s) => sum + s.total, 0);
  const totalPassed = projectSummaries.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = projectSummaries.reduce((sum, s) => sum + s.notPassed, 0);
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0.0";

  return (
    <div className="report-container">
      <Header
        title="Test Report Details"
        subtitle="Detailed test execution results and statistics"
        actions={
          <button onClick={() => navigate("/")} className="back-button">
            <span>←</span> Back to Dashboard
          </button>
        }
      />
      <div className="report-content">
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

        <div className="summary-row-container">
          {chartData && (
            <Card title="Test Results Distribution" className="chart-card">
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    datalabels: {
                      color: "#fff",
                      font: {
                        weight: "bold",
                        size: 16,
                      },
                      formatter: (value: number, context: any) => {
                        const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${percentage}%`;
                      },
                    },
                  },
                }}
              />
            </Card>
          )}

          <Card title="Summary by Projects" className="summary-card">
            <div className="table-wrapper">
              <table className="project-summary-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Total</th>
                    <th>PASSED</th>
                    <th>NOT PASSED</th>
                    <th>Total Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {projectSummaries.map((summary) => (
                    <tr key={summary.project}>
                      <td>{summary.project}</td>
                      <td>{summary.total}</td>
                      <td className="passed">{summary.passed}</td>
                      <td className="not-passed">{summary.notPassed}</td>
                      <td>{summary.totalDuration}</td>
                    </tr>
                  ))}
                  <tr className="summary-row">
                    <td>
                      <strong>All Projects</strong>
                    </td>
                    <td>
                      <strong>{projectSummaries.reduce((sum, s) => sum + s.total, 0)}</strong>
                    </td>
                    <td className="passed">
                      <strong>{projectSummaries.reduce((sum, s) => sum + s.passed, 0)}</strong>
                    </td>
                    <td className="not-passed">
                      <strong>{projectSummaries.reduce((sum, s) => sum + s.notPassed, 0)}</strong>
                    </td>
                    <td>
                      <strong>
                        {(() => {
                          const totalSeconds = projectSummaries.reduce((sum, s) => {
                            // Duration format: "HH:MM:SS"
                            const parts = s.totalDuration.split(":");
                            if (parts.length === 3) {
                              const hours = Number.parseInt(parts[0], 10);
                              const minutes = Number.parseInt(parts[1], 10);
                              const seconds = Number.parseInt(parts[2], 10);
                              return sum + hours * 3600 + minutes * 60 + seconds;
                            }
                            return sum;
                          }, 0);

                          const hours = Math.floor(totalSeconds / 3600);
                          const minutes = Math.floor((totalSeconds % 3600) / 60);
                          const seconds = Math.floor(totalSeconds % 60);

                          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
                            seconds,
                          ).padStart(2, "0")}`;
                        })()}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="test-cases-section">
          {Array.from(testCasesByProject.keys()).map((projectName) => {
            const filteredTestCases = getFilteredTestCases(projectName);
            const currentFilter = filterByProject.get(projectName) || "ALL";
            const isExpanded = expandedProjects.has(projectName);
            const allTestCases = testCasesByProject.get(projectName) || [];

            return (
              <Card key={projectName} title={projectName} className="project-card">
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
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${projectName} test cases section`}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1rem",
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
                    {allTestCases.length} test case{allTestCases.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{isExpanded ? "▼" : "▶"}</span>
                </div>

                {isExpanded && (
                  <>
                    <div className="filter-controls">
                      <div>
                        <label htmlFor={`filter-${projectName}`}>Filter by Status: </label>
                        <select
                          id={`filter-${projectName}`}
                          value={currentFilter}
                          onChange={(e) => handleFilterChange(projectName, e.target.value)}
                          className="filter-select"
                        >
                          <option value="ALL">ALL</option>
                          <option value="PASSED">PASSED</option>
                          <option value="NOT PASSED">NOT PASSED</option>
                        </select>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToExcel(projectName);
                        }}
                        className="export-button"
                        title="Export to Excel"
                      >
                        📊 Export
                      </button>
                    </div>
                    <div className="table-wrapper">
                      <table className="test-cases-table">
                        <thead>
                          <tr>
                            <th>Index</th>
                            <th>
                              <div className="header-with-action">
                                Test Name
                                <button
                                  onClick={() => copyTestNames(projectName)}
                                  className="copy-button"
                                  title="Copy all test names"
                                  type="button"
                                >
                                  📋
                                </button>
                              </div>
                            </th>
                            <th>Scenario</th>
                            <th>Error</th>
                            <th>Screenshot</th>
                            <th>Executed By</th>
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTestCases.map((testCase) => (
                            <tr key={testCase.index}>
                              <td className="text-muted">{testCase.index}</td>
                              <td className="font-semibold">
                                <div className="test-name-container">
                                  <div>
                                    {testCase.jiraKey ? (
                                      <a
                                        title={`${testCase.testName}`}
                                        href={`${import.meta.env.VITE_JIRA_BASE_URL || ""}/browse/${testCase.jiraKey}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="jira-link"
                                      >
                                        {testCase.testName}
                                      </a>
                                    ) : (
                                      <span>{testCase.testName}</span>
                                    )}
                                  </div>
                                  <div className="test-name-actions">
                                    <button
                                      onClick={() =>
                                        copyToClipboard(testCase.testName).then(
                                          () => {},
                                          (err) => logger.error("Failed to copy test name:", err),
                                        )
                                      }
                                      className="test-name-copy-button"
                                      title="Copy test name"
                                      type="button"
                                    >
                                      📋
                                    </button>
                                    <button
                                      onClick={() => openTestOnDWS(testCase.testName)}
                                      className="test-name-copy-button"
                                      title="Open test on DWS Dashboard"
                                      type="button"
                                    >
                                      🔗
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td>{testCase.scenario}</td>
                              <td className="error-cell">
                                {testCase.errorTitle && (
                                  <div>
                                    <strong>{testCase.errorTitle}</strong>
                                    {testCase.errorDescription && (
                                      <>
                                        <br />
                                        <span>{testCase.errorDescription}</span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>
                                {testCase.screenshot ? (
                                  <button
                                    onClick={() => openScreenshotModal(testCase.screenshot)}
                                    className="screenshot-link"
                                    type="button"
                                  >
                                    View
                                  </button>
                                ) : (
                                  ""
                                )}
                              </td>
                              <td>{testCase.executedBy}</td>
                              <td>{testCase.startTime}</td>
                              <td>{testCase.duration}</td>
                              <td>
                                <span
                                  className={`badge ${testCase.status === "PASSED" ? "badge-success" : "badge-danger"}`}
                                >
                                  {testCase.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {screenshotModal.isOpen && (
        <div className="screenshot-modal" onClick={closeScreenshotModal}>
          <div className="screenshot-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="screenshot-modal-close" onClick={closeScreenshotModal} type="button">
              ×
            </button>
            {screenshotModal.loading && (
              <div className="screenshot-loading">
                <div className="spinner" />
                <p>Loading screenshot...</p>
              </div>
            )}
            <img
              src={screenshotModal.url}
              alt="Screenshot"
              className="screenshot-modal-image"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: screenshotModal.loading ? "none" : "block" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
