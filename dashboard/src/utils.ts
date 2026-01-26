import dwsQueues from "../../dws-queues.json";
import logger from "./logger";
import { FlakyTest, ProjectSummary, TestCase, TestReport, TestResult } from "./types";

export const PROJECT_NAMES = dwsQueues.map((queue) => queue.name);

/**
 * Extract project name from filename format: '<projectName>_<hh-mm-ss>'
 * @param filename - Filename without extension (e.g., '02.) Account Payable_09-14-55')
 * @returns Project name (e.g., '02.) Account Payable')
 */
function extractProjectNameFromFilename(filename: string): string {
  // Filename format: <projectName>_<hh-mm-ss>
  // Extract everything before the last underscore followed by time format
  const match = /^(.+)_\d{2}-\d{2}-\d{2}$/.exec(filename);
  return match ? match[1] : "";
}

export function parseTestReport(data: TestReport, filename?: string): TestResult[] {
  const projectNameFromFile = filename ? extractProjectNameFromFilename(filename) : undefined;
  return data.data.Value.map((test) => ({
    ...test,
    // Override projectName with the one extracted from filename if available
    projectName: projectNameFromFile || test.projectName,
  }));
}

export function calculateSummary(testResults: TestResult[]): { total: number; passed: number; notPassed: number } {
  const total = testResults.length;
  const passed = testResults.filter((t) => t.successful === "SUCCESS").length;
  const notPassed = total - passed;
  return { total, passed, notPassed };
}

export function calculatePassedRate(passed: number, total: number): string {
  if (total === 0) return "0%";
  return `${((passed / total) * 100).toFixed(2)}%`;
}

export function parseDuration(duration: string): number {
  // Duration format: "00:02:21.0643353"
  const parts = duration.split(":");
  if (parts.length !== 3) return 0;

  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);
  const seconds = Number.parseFloat(parts[2]);

  return hours * 3600 + minutes * 60 + seconds;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function groupTestsByName(testResults: TestResult[]): Map<string, TestResult[]> {
  const grouped = new Map<string, TestResult[]>();

  for (const test of testResults) {
    const key = `${test.testName}-${test.scenarioName}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(test);
  }

  return grouped;
}

export function calculateFlakyTests(testResults: TestResult[], projectName: string): FlakyTest[] {
  const projectTests = testResults.filter((t) => t.projectName === projectName);
  const grouped = groupTestsByName(projectTests);
  const flakyTests: FlakyTest[] = [];

  for (const tests of grouped.values()) {
    if (tests.length > 1) {
      const totalRuns = tests.length;
      const pass = tests.filter((t) => t.successful === "SUCCESS").length;
      const notPassed = totalRuns - pass;

      // Consider flaky if it has both passes and failures
      if (pass > 0 && notPassed > 0) {
        const flakyRate = ((notPassed / totalRuns) * 100).toFixed(2) + "%";
        const lastStatus = tests[tests.length - 1].successful === "SUCCESS" ? "PASSED" : "NOT PASSED";

        flakyTests.push({
          testName: tests[0].testName,
          scenario: tests[0].scenarioName,
          totalRuns,
          pass,
          notPassed,
          flakyRate,
          lastStatus,
          jiraKey: tests[0].cJiraKey || undefined,
        });
      }
    }
  }

  return flakyTests;
}

export function calculateProjectSummary(testResults: TestResult[], projectName: string): ProjectSummary {
  const projectTests = testResults.filter((t) => t.projectName === projectName);
  const summary = calculateSummary(projectTests);
  const totalDurationSeconds = projectTests.reduce((acc, test) => acc + parseDuration(test.duration), 0);

  return {
    project: projectName,
    total: summary.total,
    passed: summary.passed,
    notPassed: summary.notPassed,
    totalDuration: formatDuration(totalDurationSeconds),
  };
}

/**
 * Calculate summary for a given set of test results without filtering by project
 * @param testResults - Array of test results
 * @param displayName - Display name for the summary
 * @returns ProjectSummary object
 */
export function calculateSummaryForTests(testResults: TestResult[], displayName: string): ProjectSummary {
  const summary = calculateSummary(testResults);
  const totalDurationSeconds = testResults.reduce((acc, test) => acc + parseDuration(test.duration), 0);

  return {
    project: displayName,
    total: summary.total,
    passed: summary.passed,
    notPassed: summary.notPassed,
    totalDuration: formatDuration(totalDurationSeconds),
  };
}

export function getTestCases(testResults: TestResult[], projectName: string): TestCase[] {
  const projectTests = testResults.filter((t) => t.projectName === projectName);

  return projectTests.map((test, index) => ({
    index: index + 1,
    testName: test.testName,
    scenario: test.scenarioName,
    errorTitle: test.cErrorTitle || "",
    errorDescription: test.cErrorDescription || "",
    screenshot: test.cImageUrl || "",
    executedBy: test.executedByUserName,
    startTime: new Date(test.executionStartTimeStamp).toLocaleString(),
    endTime: new Date(test.executionEndTimeStamp).toLocaleString(),
    duration: test.duration.split(".")[0],
    status: test.successful === "SUCCESS" ? "PASSED" : "NOT PASSED",
    jiraKey: test.cJiraKey || undefined,
  }));
}

/**
 * Convert test results to test cases without filtering by project
 * @param testResults - Array of test results
 * @returns Array of TestCase objects
 */
export function convertToTestCases(testResults: TestResult[]): TestCase[] {
  return testResults.map((test, index) => ({
    index: index + 1,
    testName: test.testName,
    scenario: test.scenarioName,
    errorTitle: test.cErrorTitle || "",
    errorDescription: test.cErrorDescription || "",
    screenshot: test.cImageUrl || "",
    executedBy: test.executedByUserName,
    startTime: new Date(test.executionStartTimeStamp).toLocaleString(),
    endTime: new Date(test.executionEndTimeStamp).toLocaleString(),
    duration: test.duration.split(".")[0],
    status: test.successful === "SUCCESS" ? "PASSED" : "NOT PASSED",
    jiraKey: test.cJiraKey || undefined,
  }));
}

export function extractDateFromPath(path: string): string {
  const match = /(\d{4}-\d{2}-\d{2})/.exec(path);
  return match ? match[1] : "";
}

/**
 * Opens the DWS Dashboard with the test name filter pre-filled
 * Copies the test name to clipboard and provides instructions to the user
 */
/**
 * Copies text to clipboard using modern Clipboard API or fallback method
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves when copy succeeds or rejects on failure
 */
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for older browsers or non-secure contexts
  return new Promise<void>((resolve, reject) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        resolve();
      } else {
        reject(new Error("Copy command failed"));
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Opens a test on the DWS Dashboard by copying the test name to clipboard and opening the DWS page
 * @param testName - Name of the test to open on DWS
 */
export function openTestOnDWS(testName: string): void {
  const dwsExecutionUrl = import.meta.env.VITE_DWS_EXECUTION_URL || "https://www.dwsdimension.com/SwifTest/Execution";

  copyToClipboard(testName)
    .then(() => {
      // Open DWS Execution page in new window
      window.open(dwsExecutionUrl, "_blank", "noopener,noreferrer");

      // Show notification to user
      alert(
        `Test name "${testName}" has been copied to clipboard!\n\n` +
          "On the DWS page:\n" +
          "1. Click on the 'Test Name' column filter icon\n" +
          "2. Paste the test name (Ctrl+V) in the value field\n" +
          "3. Click 'Filters' button",
      );
    })
    .catch((err) => {
      logger.error("Failed to copy test name:", err);
      // Still open the page even if copy fails
      window.open(dwsExecutionUrl, "_blank", "noopener,noreferrer");
      alert(
        `Please manually search for test: "${testName}"\n\n` +
          "On the DWS page:\n" +
          "1. Click on the 'Test Name' column filter icon\n" +
          "2. Enter the test name in the value field\n" +
          "3. Click 'Filters' button",
      );
    });
}
