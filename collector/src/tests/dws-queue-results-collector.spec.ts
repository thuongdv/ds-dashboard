/**
 * DWS Queue Results Collector
 *
 * This test suite automatically collects queue-level summary data from DWS automated test executions
 * and saves them in a structured JSON format for reporting and analysis.
 *
 * @module dws-queue-results-collector
 *
 * @description
 * The collector performs the following operations:
 * 1. Authenticates to DWS using credentials from environment variables
 * 2. Retrieves test queues for configured projects
 * 3. Fetches automated test queues and their execution results
 * 4. Calculates summary statistics (total tests, passed, failed, pass rate, duration)
 * 5. Saves queue summaries to JSON files organized by queue standard name
 * 6. Skips queues that have already been processed
 *
 * @environment
 * Required environment variables (set in .env file):
 * - DWS_URL: Base URL of the DWS application
 * - DWS_EMAIL: Login email for DWS
 * - DWS_PASSWORD: Login password for DWS
 * - REPORTS_PATH: Directory path where reports will be saved
 * - NUMBER_OF_QUEUE_RESULTS: (Optional) Number of queue results to collect per project (default: 1)
 * - NUMBER_OF_TESTS_PER_QUEUE: (Optional) Number of test results per API page (default: 150)
 *
 * @usage
 * Run all tests with default settings:
 * ```bash
 * npx playwright test dws-queue-results-collector.spec.ts
 * ```
 *
 * Run with custom number of results:
 * ```bash
 * NUMBER_OF_QUEUE_RESULTS=5 npx playwright test dws-queue-results-collector.spec.ts
 * ```
 *
 * @output
 * - JSON files: {REPORTS_PATH}/{standardName}-queue-results.json
 *   Format: Array of objects with structure:
 *   {
 *     queueId: string,
 *     date: string (yyyy-MM-dd),
 *     totalTests: number,
 *     passed: number,
 *     failed: number,
 *     passedRate: string (e.g. "87%"),
 *     duration: string (HH:mm:ss)
 *   }
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { test } from "@playwright/test";
import { format } from "date-fns";

import { QUEUES } from "constants/dws";
import logger from "logger";
import settings from "settings";
import DwsApi from "utils/dws-api";
import { TestResult, TestResultsResponse } from "utils/dws-test-result";

/**
 * Interface for queue summary data
 */
interface QueueSummary {
  queueId: string;
  date: string;
  totalTests: number;
  passed: number;
  failed: number;
  passedRate: string;
  duration: string;
}

/**
 * Test suite that collects queue-level summary results for each configured queue.
 */
for (const queue of QUEUES) {
  const numberOfQueueResultsToCollect = Number(process.env.NUMBER_OF_QUEUE_RESULTS || 1);

  /**
   * Main test case that authenticates to DWS and collects queue summary data.
   */
  test(`${queue.name} - Collect ${numberOfQueueResultsToCollect} queue results`, async ({ request }) => {
    const dwsApi = new DwsApi(request);

    // Find the queue item for the project and fetch automated queues
    const filteredItem = await dwsApi.findQueueItemByTitle(queue.name);
    if (!filteredItem?.key) throw new Error("Filtered item does not have a key");
    const automatedQueuesData = await dwsApi.getAutomatedTestQueuesForTestQueue(filteredItem.key);

    await processQueueResults(queue, automatedQueuesData, numberOfQueueResultsToCollect, dwsApi);
  });
}

/**
 * Calculates the duration in HH:mm:ss format from a duration string.
 *
 * @param durationString - Duration string in format "HH:MM:SS.milliseconds"
 * @returns Formatted duration as "HH:mm:ss"
 */
function formatDuration(durationString: string): string {
  try {
    // Duration format from DWS: "00:02:07.4547924"
    const parts = durationString.split(":");
    if (parts.length >= 3) {
      const hours = parts[0].padStart(2, "0");
      const minutes = parts[1].padStart(2, "0");
      const seconds = parts[2].split(".")[0].padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    }
    return durationString;
  } catch (error) {
    logger.warn(`Error formatting duration "${durationString}":`, error);
    return durationString;
  }
}

/**
 * Calculates summary statistics from test results.
 *
 * @param testResults - Test results data from the API
 * @param queueId - Queue ID for the summary
 * @param executionDate - Execution date in ISO format
 * @param duration - Queue execution duration
 * @returns Queue summary object
 */
function calculateQueueSummary(
  testResults: TestResultsResponse,
  queueId: string,
  executionDate: string,
  duration: string,
): QueueSummary {
  const tests = testResults.data.Value;
  const totalTests = tests.length;

  // Count passed and failed tests
  // Tests are considered passed if successful = "SUCCESS" or "true"
  const passed = tests.filter((test: TestResult) => {
    const successValue = test.successful?.toUpperCase();
    return successValue === "SUCCESS" || successValue === "TRUE";
  }).length;

  const failed = totalTests - passed;

  // Calculate pass rate
  const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : 0;
  const passedRate = `${passRate}%`;

  // Format date as yyyy-MM-dd
  const date = format(new Date(executionDate), "yyyy-MM-dd");

  // Format duration as HH:mm:ss
  const formattedDuration = formatDuration(duration);

  return {
    queueId,
    date,
    totalTests,
    passed,
    failed,
    passedRate,
    duration: formattedDuration,
  };
}

/**
 * Loads existing queue summaries from a JSON file.
 *
 * @param filePath - Path to the JSON file
 * @returns Array of existing queue summaries, or empty array if file doesn't exist
 */
async function loadExistingQueueSummaries(filePath: string): Promise<QueueSummary[]> {
  try {
    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(content) as QueueSummary[];
    }
  } catch (error) {
    logger.warn(`Error loading existing queue summaries from ${filePath}:`, error);
  }
  return [];
}

/**
 * Saves queue summary to a JSON file.
 *
 * @param queue - Queue configuration
 * @param queueSummary - Queue summary data to save
 * @returns Path to the saved file
 */
async function saveQueueSummary(queue: { standardName: string }, queueSummary: QueueSummary): Promise<string> {
  const fileName = `${queue.standardName.toLowerCase()}-queue-results.json`;
  const filePath = path.join(settings.REPORTS_PATH, fileName);

  // Load existing summaries
  const existingSummaries = await loadExistingQueueSummaries(filePath);

  // Check if this queue ID already exists
  const existingIndex = existingSummaries.findIndex((s) => s.queueId === queueSummary.queueId);

  if (existingIndex >= 0) {
    logger.info(`Queue ID ${queueSummary.queueId} already exists in ${fileName}, skipping...`);
    return filePath;
  }

  // Add new summary to the beginning of the array
  existingSummaries.unshift(queueSummary);

  // Ensure the reports directory exists
  if (!fs.existsSync(settings.REPORTS_PATH)) {
    await fs.promises.mkdir(settings.REPORTS_PATH, { recursive: true });
  }

  // Save updated summaries
  await fs.promises.writeFile(filePath, JSON.stringify(existingSummaries, null, 2));

  logger.info(`Queue summary saved to: ${filePath}`);
  return filePath;
}

/**
 * Processes multiple automated test queues and collects their summary data.
 *
 * @param queue - Project configuration object
 * @param automatedQueuesData - Response containing automated test queues
 * @param numberOfQueueResultsToCollect - Maximum number of queue results to collect
 * @param dwsApi - Initialized DWS API client for making requests
 */
async function processQueueResults(
  queue: { name: string; standardName: string },
  automatedQueuesData: any,
  numberOfQueueResultsToCollect: number,
  dwsApi: DwsApi,
) {
  if (!automatedQueuesData.data?.Value) {
    throw new Error("No automated queues found for the test queue");
  }

  const automateQueues = automatedQueuesData.data.Value.length;
  const numberOfAutomatedQueuesToCollect = Math.min(numberOfQueueResultsToCollect, automateQueues as number);

  logger.info(`Processing ${numberOfAutomatedQueuesToCollect} automated queues for ${queue.name}`);

  for (let i = numberOfAutomatedQueuesToCollect - 1; i >= 0; i--) {
    const automatedQueue = automatedQueuesData.data.Value[i];
    if (!automatedQueue) {
      logger.warn(`No automated queue found at index ${i}`);
      continue;
    }

    if (!automatedQueue.key) {
      throw new Error(`Automated queue at index ${i} does not have a key`);
    }

    if (!automatedQueue.executionStartTimeStamp) {
      logger.warn(`Automated queue ${automatedQueue.key} does not have an execution start timestamp, skipping...`);
      continue;
    }

    // Fetch test results for this queue (without downloading screenshots - we only need summary data)
    const automatedTestList = await dwsApi.getAutomatedTestListForTestQueue(automatedQueue.key as number, false);

    // Calculate summary statistics
    const queueSummary = calculateQueueSummary(
      automatedTestList,
      automatedQueue.key as string,
      automatedQueue.executionStartTimeStamp as string,
      automatedQueue.duration as string,
    );

    // Save queue summary
    await saveQueueSummary(queue, queueSummary);

    logger.info(
      `Queue ${queueSummary.queueId}: ${queueSummary.totalTests} tests, ${queueSummary.passed} passed (${queueSummary.passedRate}), duration: ${queueSummary.duration}`,
    );
  }
}
