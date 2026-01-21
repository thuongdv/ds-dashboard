/**
 * Represents a single test execution result from DWS automated test queue.
 *
 * @interface TestResult
 *
 * @property {string} testName - The name/identifier of the test case
 * @property {string} scenarioName - The scenario or test suite this test belongs to
 * @property {string} duration - Execution duration (format: "HH:MM:SS" or milliseconds)
 * @property {string} successful - Test outcome status ("true", "false", or "pass"/"fail")
 * @property {string} [description] - Optional detailed description of the test case
 * @property {string} executionStartTimeStamp - ISO 8601 timestamp when test execution started
 *
 * @example
 * ```typescript
 * const testResult: TestResult = {
 *   testName: "Login with valid credentials",
 *   scenarioName: "Authentication Tests",
 *   duration: "00:02:15",
 *   successful: "true",
 *   description: "Verify user can log in with correct username and password",
 *   executionStartTimeStamp: "2025-12-02T10:30:00Z"
 * };
 * ```
 */
export interface TestResult {
  testName: string;
  scenarioName: string;
  duration: string;
  successful: string;
  executionStatus: string;
  description?: string;
  executionStartTimeStamp: string;
  cErrorTitle?: string;
  cErrorDescription?: string;
  cImageUrl?: string;
  cJiraKey?: string | null;
}

/**
 * Response structure for test results API endpoint.
 *
 * @interface TestResultsResponse
 *
 * @property {Object} data - Wrapper object containing the test results array
 * @property {TestResult[]} data.Value - Array of individual test execution results
 * @property {number} total - Total count of test results available (for pagination)
 *
 * @example
 * ```typescript
 * const response: TestResultsResponse = {
 *   data: {
 *     Value: [
 *       { testName: "Test 1", scenarioName: "Scenario A", ... },
 *       { testName: "Test 2", scenarioName: "Scenario B", ... }
 *     ]
 *   },
 *   total: 150
 * };
 *
 * console.log(`Retrieved ${response.data.Value.length} of ${response.total} tests`);
 * ```
 */
export interface TestResultsResponse {
  data: {
    Value: TestResult[];
  };
  total: number;
}

/**
 * Metadata information about an automated test queue execution.
 *
 * @interface QueueInfo
 *
 * @property {string} key - Unique identifier for the queue execution
 * @property {string} duration - Total execution duration (format: "HH:MM:SS" or milliseconds)
 * @property {string} [executedByUserName] - Username of the person who triggered the execution
 * @property {string} executionStartTimeStamp - ISO 8601 timestamp when queue execution started
 * @property {string} executionEndTimeStamp - ISO 8601 timestamp when queue execution completed
 * @property {string | null} [environment] - Execution environment (e.g., "DEV", "QA", "PROD") or null if not specified
 *
 * @example
 * ```typescript
 * const queueInfo: QueueInfo = {
 *   key: "queue-12345",
 *   duration: "01:45:30",
 *   executedByUserName: "john.doe@example.com",
 *   executionStartTimeStamp: "2025-12-02T08:00:00Z",
 *   executionEndTimeStamp: "2025-12-02T09:45:30Z",
 *   environment: "QA"
 * };
 * ```
 */
export interface QueueInfo {
  key: string;
  duration: string;
  executedByUserName?: string;
  executionStartTimeStamp: string;
  executionEndTimeStamp: string;
  environment?: string | null;
}

export const ExecutionStatus = {
  disabled: "Disabled",
  completed: "Completed",
  notExecuted: "new"
} as const;

export type ExecutionStatusType = typeof ExecutionStatus[keyof typeof ExecutionStatus];

export const SuccessfulStatus = {
  success: "SUCCESS",
  fail: "FAIL"
} as const;
