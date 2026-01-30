import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-republish";
import dwsQueuesData from "../../../dws-queues.json";
import logger from "../logger";
import { DwsQueue, QueueResult } from "../types";
import { Card } from "./Card/Card";

// Import all queue result JSON files
const queueResultModules = import.meta.glob<QueueResult[]>("../../../dws-report/reports/*-queue-results.json", {
  eager: true,
  import: "default",
});

type SortColumn = "queueId" | "date" | "totalTests" | "passed" | "failed" | "passedRate" | "duration";
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

export const PodsQueueData: React.FC = () => {
  const [queueData, setQueueData] = useState<Map<string, QueueResult[]>>(new Map());
  const [queues, setQueues] = useState<DwsQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortStates, setSortStates] = useState<Map<string, SortState>>(new Map());
  const [expandedQueues, setExpandedQueues] = useState<Set<string>>(new Set(dwsQueuesData.map((q) => q.standardName)));

  useEffect(() => {
    loadQueueData();
  }, []);

  const toggleQueue = (standardName: string) => {
    setExpandedQueues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(standardName)) {
        newSet.delete(standardName);
      } else {
        newSet.add(standardName);
      }
      return newSet;
    });
  };

  const loadQueueData = async () => {
    try {
      // Load dws-queues.json (directly imported)
      const queuesJson = dwsQueuesData;
      setQueues(queuesJson);

      // Load queue results for each standardName
      const dataMap = new Map<string, QueueResult[]>();

      for (const queue of queuesJson) {
        const fileName = `${queue.standardName.toLowerCase()}-queue-results.json`;

        // Find the matching module
        const matchingModule = Object.entries(queueResultModules).find(([path]) => path.includes(fileName));

        if (matchingModule) {
          const results = matchingModule[1];
          dataMap.set(queue.standardName, results);
        } else {
          logger.warn(`File not found: ${fileName}`);
          dataMap.set(queue.standardName, []);
        }
      }

      setQueueData(dataMap);
      setLoading(false);
    } catch (error) {
      logger.error("Failed to load queue data:", error);
      setLoading(false);
    }
  };

  const exportToExcel = (standardName: string, results: QueueResult[]) => {
    // Prepare data for Excel
    const excelData = results.map((result) => ({
      "Queue ID": result.queueId,
      Date: result.date,
      "Total Tests": result.totalTests,
      Passed: result.passed,
      Failed: result.failed,
      "Pass Rate": result.passedRate,
      Duration: result.duration,
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historical Data");

    // Generate filename with current date
    const date = new Date().toISOString().split("T")[0];
    const filename = `${standardName}_Queue_Results_${date}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  };

  const handleSort = (standardName: string, column: SortColumn) => {
    setSortStates((prev) => {
      const newStates = new Map(prev);
      const currentState = newStates.get(standardName);
      const newDirection: SortDirection =
        currentState?.column === column && currentState.direction === "asc" ? "desc" : "asc";
      newStates.set(standardName, { column, direction: newDirection });
      return newStates;
    });
  };

  const sortResults = (results: QueueResult[], standardName: string): QueueResult[] => {
    const sortState = sortStates.get(standardName);
    if (!sortState) return results;

    const sorted = [...results].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortState.column) {
        case "queueId":
          aValue = a.queueId;
          bValue = b.queueId;
          break;
        case "date":
          aValue = a.date;
          bValue = b.date;
          break;
        case "totalTests":
          aValue = a.totalTests;
          bValue = b.totalTests;
          break;
        case "passed":
          aValue = a.passed;
          bValue = b.passed;
          break;
        case "failed":
          aValue = a.failed;
          bValue = b.failed;
          break;
        case "passedRate":
          aValue = Number.parseFloat(a.passedRate) || 0;
          bValue = Number.parseFloat(b.passedRate) || 0;
          break;
        case "duration":
          aValue = a.duration;
          bValue = b.duration;
          break;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortState.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortState.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return sorted;
  };

  const getSortIndicator = (standardName: string, column: SortColumn): string => {
    const sortState = sortStates.get(standardName);
    if (!sortState?.column || sortState.column !== column) return "⇅";
    return sortState.direction === "asc" ? "↑" : "↓";
  };

  const handleKeyDown = (e: React.KeyboardEvent, standardName: string, column: SortColumn) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSort(standardName, column);
    }
  };

  const getAriaSort = (standardName: string, column: SortColumn): "ascending" | "descending" | "none" => {
    const sortState = sortStates.get(standardName);
    if (sortState?.column === column) {
      return sortState.direction === "asc" ? "ascending" : "descending";
    }
    return "none";
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading queue data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
        {queues.map((queue) => {
          const results = queueData.get(queue.standardName) || [];
          const latestResult = results.length > 0 ? results[0] : null;

          return (
            <Card key={queue.standardName} title="" className="stat-card">
              <div style={{ padding: "1.5rem" }}>
                {latestResult ? (
                  <>
                    <div
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "600",
                        marginBottom: "1.5rem",
                        color: "#1e293b",
                        paddingBottom: "1rem",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      {queue.name}
                    </div>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "0.75rem", color: "#1e293b" }}>
                      {latestResult.passedRate}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.5rem", fontWeight: "500" }}>
                      Latest Pass Rate
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginBottom: "1rem" }}>
                      ({latestResult.date})
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "1rem",
                        paddingTop: "1rem",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{ fontSize: "1.5rem", fontWeight: "600", color: "#10b981", marginBottom: "0.25rem" }}
                        >
                          {latestResult.passed}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Passed
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{ fontSize: "1.5rem", fontWeight: "600", color: "#ef4444", marginBottom: "0.25rem" }}
                        >
                          {latestResult.failed}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Failed
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{ fontSize: "1.5rem", fontWeight: "600", color: "#475569", marginBottom: "0.25rem" }}
                        >
                          {latestResult.totalTests}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Total
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: "0.875rem", color: "#64748b", textAlign: "center", padding: "2rem" }}>
                    No data available
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {queues.map((queue) => {
        const results = queueData.get(queue.standardName) || [];
        if (results.length === 0) return null;

        const isExpanded = expandedQueues.has(queue.standardName);

        return (
          <Card key={`detail-${queue.standardName}`} title={`${queue.name} - Historical Data`}>
            <div
              onClick={() => toggleQueue(queue.standardName)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleQueue(queue.standardName);
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${queue.name} historical data section`}
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
                {results.length} historical record{results.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{isExpanded ? "▼" : "▶"}</span>
            </div>

            {isExpanded && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem", marginBottom: "0.5rem" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportToExcel(queue.standardName, results);
                    }}
                    className="export-button"
                    title="Export to Excel"
                  >
                    📊 Export
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th
                          onClick={() => handleSort(queue.standardName, "queueId")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "queueId")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "queueId")}
                          aria-label="Sort by Queue ID"
                          className="sortable-header"
                        >
                          Queue ID {getSortIndicator(queue.standardName, "queueId")}
                        </th>
                        <th
                          onClick={() => handleSort(queue.standardName, "date")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "date")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "date")}
                          aria-label="Sort by Date"
                          className="sortable-header"
                        >
                          Date {getSortIndicator(queue.standardName, "date")}
                        </th>
                        <th
                          onClick={() => handleSort(queue.standardName, "totalTests")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "totalTests")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "totalTests")}
                          aria-label="Sort by Total Tests"
                          className="sortable-header"
                        >
                          Total Tests {getSortIndicator(queue.standardName, "totalTests")}
                        </th>
                        <th
                          onClick={() => handleSort(queue.standardName, "passed")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "passed")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "passed")}
                          aria-label="Sort by Passed Tests"
                          className="sortable-header"
                        >
                          Passed {getSortIndicator(queue.standardName, "passed")}
                        </th>
                        <th
                          onClick={() => handleSort(queue.standardName, "failed")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "failed")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "failed")}
                          aria-label="Sort by Failed Tests"
                          className="sortable-header"
                        >
                          Failed {getSortIndicator(queue.standardName, "failed")}
                        </th>
                        <th
                          onClick={() => handleSort(queue.standardName, "passedRate")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "passedRate")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "passedRate")}
                          aria-label="Sort by Pass Rate"
                          className="sortable-header"
                        >
                          Pass Rate {getSortIndicator(queue.standardName, "passedRate")}
                        </th>
                        <th
                          onClick={() => handleSort(queue.standardName, "duration")}
                          onKeyDown={(e) => handleKeyDown(e, queue.standardName, "duration")}
                          role="button"
                          tabIndex={0}
                          aria-sort={getAriaSort(queue.standardName, "duration")}
                          aria-label="Sort by Duration"
                          className="sortable-header"
                        >
                          Duration {getSortIndicator(queue.standardName, "duration")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortResults(results, queue.standardName).map((result) => (
                        <tr key={`${queue.standardName}-${result.queueId}`}>
                          <td className="font-semibold">{result.queueId}</td>
                          <td>{result.date}</td>
                          <td>{result.totalTests}</td>
                          <td className="status-passed">{result.passed}</td>
                          <td className="status-failed">{result.failed}</td>
                          <td>
                            <span
                              className={`badge ${
                                Number.parseFloat(result.passedRate) >= 90 ? "badge-success" : "badge-warning"
                              }`}
                            >
                              {result.passedRate}
                            </span>
                          </td>
                          <td>{result.duration}</td>
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
    </>
  );
};
