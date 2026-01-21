import { APIRequestContext } from "@playwright/test";
import { DWS_API_URL } from "constants/dws";
import logger from "logger";
import * as path from "node:path";
import settings from "settings";

import { ExecutionStatus, SuccessfulStatus, TestResultsResponse } from "utils/dws-test-result";
import FileUtils from "utils/file-utils";

/**
 * Represents a single history detail item from DWS test execution.
 *
 * @interface HistoryDetailItem
 * @description Contains detailed information about a specific step or action
 * within a test execution, including status, timing, and error information.
 */
interface HistoryDetailItem {
  /** Display title of the action/step */
  title: string;
  /** Detailed description or error message */
  description: string;
  /** Unique identifier, also used as screenshot URL for failed steps */
  key: string;
  /** Type of the history item */
  type: string;
  /** Whether the item is lazily loaded */
  lazy: boolean;
  /** Whether this item represents a folder/container */
  folder: boolean;
  /** Current execution status (e.g., "EXECUTED", "DISABLED") */
  executionStatus: string;
  /** Success status ("PASS", "FAIL", etc.) */
  successful: string;
  /** Parent item reference */
  reportsTo: string | null;
  /** Whether this item has child items */
  hasChildren: boolean;
  /** Combined key and type identifier */
  keyAndType: string | null;
  /** URL to view the test in DWS */
  testUrl: string;
  /** Clipboard content for copying */
  copyToClipboard: string | null;
  /** Owner's display name */
  owner: string | null;
  /** Owner's Atlassian account ID */
  ownerUserAccountId: string | null;
  /** Name of the project type */
  projectTypeName: string | null;
  /** Order position in the sequence */
  position: number;
  /** Username of the executor */
  executedByUserName: string;
  /** ISO timestamp when execution started */
  executionStartTimeStamp: string;
  /** ISO timestamp when execution ended */
  executionEndTimeStamp: string;
  /** Human-readable duration string */
  duration: string;
  /** Current user's Atlassian account ID */
  currentUserAccountId: string | null;
  /** Name of the project */
  projectName: string | null;
  /** Name of the test scenario */
  scenarioName: string | null;
  /** Name of the test */
  testName: string | null;
  /** Whether the execution was successful */
  isSuccessfullyExecuted: boolean;
  /** Test environment name */
  environment: string | null;
  /** Tools release version */
  toolsRelease: string | null;
  /** Whether this is a group action */
  isGroupAction: boolean;
  /** Group action identifier */
  groupActionId: number;
  /** Automated group action identifier */
  automatedGroupActionId: number;
  /** Unique numeric identifier */
  id: number;
  /** Action identifier */
  actionId: number;
  /** Whether the item is enabled */
  isEnabled: boolean;
  /** Child history items */
  children: any[];
  /** Metadata column values */
  metadataColumnValues: any[];
  /** Summary of action parameters */
  actionParameterSummary: any[];
}

/**
 * DWS API Client for interacting with the DWS test management platform.
 *
 * @class DwsApi
 * @description
 * Provides methods to retrieve test queues, automated test results, and execution history
 * from DWS. Authentication is handled via Playwright's browser context - cookies are
 * automatically included from the authenticated session.
 *
 * @example
 * ```typescript
 * import { test } from "@playwright/test";
 * import DwsApi from "utils/dws-api";
 *
 * test("collect test results", async ({ request }) => {
 *   const dwsApi = new DwsApi(request);
 *
 *   // Find a specific test queue
 *   const queue = await dwsApi.findQueueItemByTitle("01.) JDEdwards Finance");
 *
 *   // Get automated test results
 *   const results = await dwsApi.getAutomatedTestListForTestQueue(queue.key);
 * });
 * ```
 */
export default class DwsApi {
  private readonly request: APIRequestContext;

  /**
   * Creates a new DwsApi instance.
   *
   * @param {APIRequestContext} request - Playwright's API request context for making HTTP calls.
   *   Must be from an authenticated browser context (via storageState) to access DWS endpoints.
   */
  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Constructs common HTTP headers for API requests.
   *
   * @private
   * @returns {Object} Headers object with Content-Type and Accept set to application/json
   */
  private getHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Retrieves all available test queue items from DWS.
   *
   * @returns {Promise<Array<{title: string, key: string, description: string, [key: string]: any}>>}
   *   Array of queue item objects containing at minimum title, key, and description
   *
   * @example
   * ```typescript
   * const queues = await dwsApi.getQueueItems();
   * // Returns: [
   * //   { title: "01.) JDEdwards Finance", key: "12345", description: "..." },
   * //   { title: "02.) JDEdwards Sales & Distribution", key: "67890", description: "..." }
   * // ]
   * ```
   */
  async getQueueItems(): Promise<
    Array<{
      title: string;
      key: string;
      description: string;
      [key: string]: any;
    }>
  > {
    const response = await this.request.get(`${DWS_API_URL}/Queue/GetItems`, {
      headers: this.getHeaders(),
    });
    return (await response.json()) as Array<{
      title: string;
      key: string;
      description: string;
      [key: string]: any;
    }>;
  }

  /**
   * Fetches paginated automated test queue executions for a specific test queue.
   *
   * @param {string | number} testQueueId - Unique identifier of the parent test queue
   * @param {number} [page=1] - Page number for pagination (1-indexed)
   * @param {number} [pageSize=50] - Number of items per page (max typically 100)
   * @returns {Promise<{[key: string]: any}>} Paginated response containing automated test queue data
   *
   * @example
   * ```typescript
   * // Get first page of automated queues (50 items)
   * const queues = await dwsApi.getAutomatedTestQueuesForTestQueue("12345");
   *
   * // Get second page with 100 items per page
   * const moreQueues = await dwsApi.getAutomatedTestQueuesForTestQueue("12345", 2, 100);
   * ```
   */
  async getAutomatedTestQueuesForTestQueue(
    testQueueId: string | number,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ [key: string]: any }> {
    const response = await this.request.post(`${DWS_API_URL}/Queue/GetAutomatedTestQueuesForTestQueue`, {
      headers: this.getHeaders(),
      data: {
        page,
        pageSize,
        testQueueId,
      },
    });
    return (await response.json()) as { [key: string]: any };
  }

  /**
   * Retrieves detailed automated test results for a specific test queue execution.
   *
   * @param {string | number} testQueueId - Unique identifier of the test queue execution
   * @param {boolean} [downloadScreenshots=true] - Whether to download screenshots for failed tests.
   *   Set to false when only summary data is needed (e.g., queue results collector)
   * @returns {Promise<TestResultsResponse>} Complete test results with execution details
   *
   * @description
   * Fetches a comprehensive list of automated tests including:
   * - Test names and scenario information
   * - Execution durations and timestamps
   * - Success/failure status
   *
   * **Failed Test Enrichment**: When `downloadScreenshots` is true (default), for tests with
   * `successful === "FAIL"`, this method automatically fetches additional error details
   * via {@link getHistoryDetail} and adds:
   * - `cErrorTitle`: Title of the failed action/step
   * - `cErrorDescription`: Detailed error message
   * - `cImageUrl`: Screenshot URL (stored in the `key` field of the failed step)
   *
   * **Configuration**: Page size controlled via `NUMBER_OF_TESTS_PER_QUEUE` env var (default: 150)
   *
   * @example
   * ```typescript
   * // With screenshot downloads (default)
   * const results = await dwsApi.getAutomatedTestListForTestQueue(12345);
   * console.log(`Total tests: ${results.total}`);
   *
   * results.data.Value.forEach(test => {
   *   console.log(`${test.testName}: ${test.successful}`);
   *   if (test.successful === "FAIL") {
   *     console.log(`Error: ${test.cErrorTitle}`);
   *     console.log(`Details: ${test.cErrorDescription}`);
   *     console.log(`Screenshot: ${test.cImageUrl}`);
   *   }
   * });
   *
   * // Without screenshot downloads (for summary data only)
   * const summaryResults = await dwsApi.getAutomatedTestListForTestQueue(12345, false);
   * ```
   *
   * @see {@link TestResultsResponse} for complete response structure
   * @see {@link getHistoryDetail} for error detail fetching
   */
  async getAutomatedTestListForTestQueue(
    testQueueId: string | number,
    downloadScreenshots: boolean = true,
  ): Promise<TestResultsResponse> {
    const response = await this.request.get(
      `${DWS_API_URL}/Queue/GetAutomatedTestListForTestQueue?testQueueId=${testQueueId}&page=1&pageSize=${
        process.env.NUMBER_OF_TESTS_PER_QUEUE ?? 150
      }`,
      {
        headers: this.getHeaders(),
      },
    );
    const result = (await response.json()) as TestResultsResponse;

    // Enrich failed tests with error details and download screenshots (parallel processing)
    // Only process if downloadScreenshots is enabled
    if (downloadScreenshots && result.data?.Value) {
      const failedTests = result.data.Value.filter(
        (test) =>
          test.successful.toLocaleLowerCase() === SuccessfulStatus.fail.toLocaleLowerCase() && (test as any).key,
      );

      await Promise.all(
        failedTests.map(async (test) => {
          try {
            const historyDetails = await this.getHistoryDetail((test as any).key);
            const firstFailedDetail = historyDetails.find(
              (item) =>
                item.successful.toLocaleLowerCase() === SuccessfulStatus.fail.toLocaleLowerCase() &&
                item.executionStatus !== ExecutionStatus.disabled,
            );

            if (firstFailedDetail) {
              test.cErrorTitle = firstFailedDetail.title;
              test.cErrorDescription = firstFailedDetail.description;

              // Download screenshot and store locally
              if (firstFailedDetail.key) {
                const imageUrl = firstFailedDetail.key;
                const timestamp = Date.now();
                const sanitizedTestName = test.testName.replaceAll(/[^a-z0-9]/gi, "_").substring(0, 50);
                const screenshotFileName = `${sanitizedTestName}_${timestamp}.png`;
                const screenshotsDir = path.join(settings.REPORTS_PATH, "screenshots");
                const localImagePath = path.join(screenshotsDir, screenshotFileName);

                try {
                  await FileUtils.downloadImage(imageUrl, localImagePath);
                  // Store relative path for dashboard access
                  test.cImageUrl = `screenshots/${screenshotFileName}`;
                  logger.info(`Downloaded screenshot for failed test: ${test.testName}`);
                } catch (downloadError) {
                  logger.warn(`Failed to download screenshot for test ${test.testName}:`, downloadError);
                  // Fallback to original URL if download fails
                  test.cImageUrl = imageUrl;
                }
              }
            }
          } catch (error) {
            // Silently continue if history details cannot be fetched
            logger.warn(`Failed to fetch history details for test ${(test as any).key}:`, error);
          }
        }),
      );
    }

    return result;
  }

  /**
   * Retrieves detailed step-by-step execution history for a specific test run.
   *
   * @param {string | number} testHistoryId - Unique identifier of the test history/execution
   * @returns {Promise<HistoryDetailItem[]>} Array of history items representing each action/step
   *
   * @description
   * Fetches granular execution details for each step within a test, including:
   * - Action titles and descriptions (contains error messages for failed steps)
   * - Success/failure status per step
   * - Screenshot URLs in the `key` field for failed steps
   * - Execution timestamps and durations
   *
   * This method is called internally by {@link getAutomatedTestListForTestQueue} to
   * enrich failed tests with error details.
   *
   * @example
   * ```typescript
   * const historyDetails = await dwsApi.getHistoryDetail(24887);
   *
   * // Find the first failed step
   * const failedStep = historyDetails.find(
   *   item => item.successful === "FAIL" && item.executionStatus !== "DISABLED"
   * );
   *
   * if (failedStep) {
   *   console.log(`Failed at: ${failedStep.title}`);
   *   console.log(`Error: ${failedStep.description}`);
   *   console.log(`Screenshot URL: ${failedStep.key}`);
   * }
   * ```
   */
  async getHistoryDetail(testHistoryId: string | number): Promise<HistoryDetailItem[]> {
    const response = await this.request.get(
      `${DWS_API_URL}/Execution/GetHistoryDetail?testHistoryId=${testHistoryId}`,
      {
        headers: this.getHeaders(),
        timeout: 60_000,
      },
    );
    return (await response.json()) as HistoryDetailItem[];
  }

  /**
   * Searches for a queue item by its exact title.
   *
   * @param {string} title - The exact title to search for (case-sensitive)
   * @returns {Promise<{title: string, key: string, description: string, [key: string]: any} | undefined>}
   *   The matching queue item, or undefined if not found
   *
   * @example
   * ```typescript
   * const financeQueue = await dwsApi.findQueueItemByTitle("01.) JDEdwards Finance");
   *
   * if (financeQueue) {
   *   const results = await dwsApi.getAutomatedTestListForTestQueue(financeQueue.key);
   * } else {
   *   console.log("Queue not found");
   * }
   * ```
   */
  async findQueueItemByTitle(title: string) {
    const items = await this.getQueueItems();
    return items.find((item) => item.title === title);
  }
}
