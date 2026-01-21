import { SummaryRow, TestReport } from "./types";
import { calculatePassedRate, calculateSummary, parseTestReport } from "./utils";

// Dynamically import all JSON files from date-formatted folders using Vite's glob import
// Pattern matches: ../../dws-report/reports/{yyyy-MM-dd}/*.json
const reportModules = import.meta.glob<TestReport>(
  "../../dws-report/reports/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/*.json",
  {
    eager: true,
    import: "default",
  },
);

export interface ReportData {
  date: string;
  reports: TestReport[];
}

/**
 * Extract date from file path
 * @param path - File path containing date in format yyyy-MM-dd
 * @returns Date string in yyyy-MM-dd format
 */
function extractDateFromPath(path: string): string {
  const match = /(\d{4}-\d{2}-\d{2})/.exec(path);
  return match ? match[1] : "";
}

/**
 * Extract filename from file path (without extension)
 * @param path - Full file path
 * @returns Filename without extension
 */
function extractFilename(path: string): string {
  const parts = path.split("/");
  const filename = parts[parts.length - 1];
  return filename.replace(/\.json$/, "");
}

/**
 * Load all reports dynamically from date-formatted folders
 * @returns Array of report data grouped by date, sorted in descending order (newest first)
 */
export async function loadAllReports(): Promise<ReportData[]> {
  // Group reports by date
  const reportsByDate = new Map<string, TestReport[]>();

  for (const [path, report] of Object.entries(reportModules)) {
    const date = extractDateFromPath(path);
    const filename = extractFilename(path);
    if (date) {
      if (!reportsByDate.has(date)) {
        reportsByDate.set(date, []);
      }
      // Attach filename to report for later use
      const reportWithMetadata = { ...report, filename };
      reportsByDate.get(date)!.push(reportWithMetadata);
    }
  }

  // Convert to array and sort by date (newest first)
  const reportsData: ReportData[] = Array.from(reportsByDate.entries())
    .map(([date, reports]) => ({ date, reports }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return reportsData;
}

export function generateSummaryRows(reportsData: ReportData[]): SummaryRow[] {
  return reportsData.map((reportData, index) => {
    const allTests = reportData.reports.flatMap((report) => parseTestReport(report));
    const summary = calculateSummary(allTests);

    return {
      date: reportData.date,
      total: summary.total,
      passed: summary.passed,
      notPassed: summary.notPassed,
      passedRate: calculatePassedRate(summary.passed, summary.total),
      reportPath: `/report/${index}?date=${reportData.date}`, // Use index for routing
    };
  });
}

export async function loadReportByIndex(index: number): Promise<TestReport[]> {
  const allReports = await loadAllReports();
  if (index < 0 || index >= allReports.length) {
    throw new Error("Invalid report index");
  }
  return allReports[index].reports;
}
