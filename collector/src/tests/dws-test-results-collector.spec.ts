/**
 * DWS Test Results Collector
 *
 * This test suite automatically collects automated test execution results from DWS (Development Web Services)
 * for multiple projects and saves them in a structured format for reporting and analysis.
 *
 * @module dws-test-results-collector
 *
 * @description
 * The collector performs the following operations:
 * 1. Authenticates to DWS using credentials from environment variables
 * 2. Retrieves test queues for configured projects
 * 3. Fetches automated test results from each queue
 * 4. Saves results to JSON files organized by execution date
 * 5. Tracks processed queue IDs to avoid duplicate collection
 *
 * @environment
 * Required environment variables (set in .env file):
 * - DWS_URL: Base URL of the DWS application
 * - DWS_EMAIL: Login email for DWS
 * - DWS_PASSWORD: Login password for DWS
 * - REPORTS_PATH: Directory path where reports will be saved
 * - NUMBER_OF_QUEUE_RESULTS: (Optional) Number of test results to collect per project (default: 1)
 * - NUMBER_OF_TESTS_PER_QUEUE: (Optional) Number of results per API page (default: 150)
 *
 * @usage
 * Run all tests with default settings:
 * ```bash
 * npx playwright test dws-test-results-collector.spec.ts
 * ```
 *
 * Run with custom number of results:
 * ```bash
 * NUMBER_OF_QUEUE_RESULTS=5 npx playwright test dws-test-results-collector.spec.ts
 * ```
 *
 * Run with custom page size:
 * ```bash
 * NUMBER_OF_TESTS_PER_QUEUE=200 npx playwright test dws-test-results-collector.spec.ts
 * ```
 *
 * Combine multiple parameters:
 * ```bash
 * NUMBER_OF_QUEUE_RESULTS=1 NUMBER_OF_TESTS_PER_QUEUE=50 npx playwright test dws-test-results-collector.spec.ts
 * ```
 *
 * @output
 * - JSON files: {REPORTS_PATH}/{YYYY-MM-DD}/{project-name}.json
 * - Status files: {REPORTS_PATH}/{project}-queue-ids-tracker.txt
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { test } from "@playwright/test";
import { format } from "date-fns";
import sanitize from "sanitize-filename";

import { QUEUES } from "constants/dws";
import logger from "logger";
import settings from "settings";
import DwsApi from "utils/dws-api";
import { TestResultsResponse } from "utils/dws-test-result";
import FileUtils from "utils/file-utils";
import { JiraClient } from "utils/jira-client";

/**
 * Path to the test name to Jira key mapping cache file
 */
const JIRA_MAPPING_CACHE_PATH = path.join(settings.APP_ROOT_PATH, "test-name-jira-key-mapping.json");

/**
 * Loads the test name to Jira key mapping cache from disk.
 *
 * @returns {Promise<Map<string, string | null>>} Map of test name to Jira issue key (or null if no issue found)
 */
async function loadJiraMappingCache(): Promise<Map<string, string | null>> {
  try {
    if (await FileUtils.isFileExists(JIRA_MAPPING_CACHE_PATH)) {
      const content = await fs.promises.readFile(JIRA_MAPPING_CACHE_PATH, "utf-8");
      const data = JSON.parse(content);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    logger.warn("Failed to load Jira mapping cache, starting with empty cache:", error);
  }
  return new Map();
}

/**
 * Saves the test name to Jira key mapping cache to disk.
 *
 * @param {Map<string, string | null>} cache - Map of test name to Jira issue key
 * @returns {Promise<void>}
 */
async function saveJiraMappingCache(cache: Map<string, string | null>): Promise<void> {
  try {
    const data = Object.fromEntries(cache);
    await fs.promises.writeFile(JIRA_MAPPING_CACHE_PATH, JSON.stringify(data, null, 2));
    logger.info(`Saved ${cache.size} entries to Jira mapping cache`);
  } catch (error) {
    logger.error("Failed to save Jira mapping cache:", error);
  }
}
/**
 * Test suite that collects automated test results for each configured queue.
 *
 * @test Iterates through all queues defined in QUEUES configuration
 * @see {@link QUEUES} for queue configuration details
 */
for (const queue of QUEUES) {
  const numberOfTestResultsToCollect = Number(process.env.NUMBER_OF_QUEUE_RESULTS || 1);

  /**
   * Main test case that authenticates to DWS and collects test results for a specific project.
   *
   * @test
   * @description
   * This test performs the following steps:
   * 1. Navigates to DWS dashboard and authenticates
   * 2. Extracts authentication cookies for API requests
   * 3. Finds the project's test queue by title
   * 4. Retrieves automated test queues for the project
   * 5. Processes and saves test results
   *
   * @param {APIRequestContext} request - Playwright API request context for HTTP calls
   *
   * @throws {Error} When DWS_URL is not configured in settings
   * @throws {Error} When the queue item doesn't have a key
   * @throws {Error} When authentication fails
   */
  test(`${queue.name} - Collect ${numberOfTestResultsToCollect} test results`, async ({ request }) => {
    const dwsApi = new DwsApi(request);

    // Find the queue item for the project and fetch automated queues
    const filteredItem = await dwsApi.findQueueItemByTitle(queue.name);
    if (!filteredItem?.key) throw new Error("Filtered item does not have a key");
    const automatedQueuesData = await dwsApi.getAutomatedTestQueuesForTestQueue(filteredItem.key);

    await processAutomatedQueues(queue, automatedQueuesData, numberOfTestResultsToCollect, dwsApi);
  });
}

/**
 * Searches for Jira issues by test names using JiraClient.
 *
 * @function searchIssuesByTestNames
 * @async
 *
 * @description
 * This helper function searches for Jira issues matching test names in batches.
 * It uses the JiraClient's searchIssues method to query Jira with JQL.
 * Results are cached to improve performance on subsequent runs.
 *
 * @param {JiraClient} jiraClient - Initialized Jira client instance
 * @param {string[]} testNames - Array of test names to search for
 * @param {Map<string, string | null>} cache - Cache of previously found mappings
 *
 * @returns {Promise<Map<string, string | null>>} Map of test name to Jira issue key
 */
async function searchIssuesByTestNames(
  jiraClient: JiraClient,
  testNames: string[],
  cache: Map<string, string | null>,
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const uncachedTestNames: string[] = [];

  // First, check cache for each test name
  for (const testName of testNames) {
    if (cache.has(testName)) {
      const cachedValue = cache.get(testName);
      results.set(testName, cachedValue === undefined ? null : cachedValue);
      if (cachedValue) {
        logger.debug(`Using cached Jira key ${cachedValue} for test name: ${testName}`);
      }
    } else {
      uncachedTestNames.push(testName);
    }
  }

  if (uncachedTestNames.length === 0) {
    logger.info(`All ${testNames.length} test names found in cache, skipping Jira API calls`);
    return results;
  }

  logger.info(
    `Found ${results.size} test names in cache, searching Jira for ${uncachedTestNames.length} uncached test names...`,
  );

  // Process uncached test names in parallel with a reasonable limit to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < uncachedTestNames.length; i += batchSize) {
    const batch = uncachedTestNames.slice(i, i + batchSize);
    const promises = batch.map(async (testName) => {
      try {
        // Escape special JQL characters
        const escapedTestName = testName.replaceAll('"', String.raw`\"`);

        // Build JQL query to search for issues in the project with summary containing the test name
        const jql = `project = ${settings.JIRA_PROJECT} AND summary ~ "${escapedTestName}"`;

        const response = await jiraClient.searchIssues(jql, 0, 1, ["key", "summary"]);

        if (response.issues && response.issues.length > 0) {
          const issueKey = response.issues[0].key;
          logger.info(`Found Jira issue ${issueKey} for test name: ${testName}`);
          results.set(testName, issueKey);
          cache.set(testName, issueKey); // Update cache
        } else {
          logger.debug(`No Jira issue found for test name: ${testName}`);
          results.set(testName, null);
          cache.set(testName, null); // Cache negative result
        }
      } catch (error) {
        logger.error(`Error searching Jira for test name "${testName}":`, error);
        results.set(testName, null);
        cache.set(testName, null); // Cache error as null
      }
    });

    await Promise.all(promises);
  }

  return results;
}

/**
 * Enriches test results with Jira issue keys by searching Jira API.
 *
 * @function enrichTestResultsWithJiraKeys
 * @async
 *
 * @description
 * This helper function performs the following operations:
 * 1. Loads the cached test name to Jira key mappings from disk
 * 2. Extracts unique test names from test results
 * 3. Searches Jira for issues matching each test name (using cache when available)
 * 4. Adds the cJiraKey field to each test result with the found Jira issue key
 * 5. Saves updated cache back to disk
 *
 * @param {TestResultsResponse} automatedTestList - Complete test results data from the API
 *
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await enrichTestResultsWithJiraKeys(automatedTestList);
 * // Each test result in automatedTestList.data.Value now has a cJiraKey property
 * ```
 */
async function enrichTestResultsWithJiraKeys(automatedTestList: TestResultsResponse): Promise<void> {
  try {
    // Load the cache from disk
    const cache = await loadJiraMappingCache();
    logger.info(`Loaded ${cache.size} entries from Jira mapping cache`);

    const jiraClient = new JiraClient();

    // Extract unique test names
    const testNames = [...new Set(automatedTestList.data.Value.map((test) => test.testName))];

    logger.info(`Processing ${testNames.length} unique test names...`);

    // Search Jira for all test names (using cache when available)
    const jiraResults = await searchIssuesByTestNames(jiraClient, testNames, cache);

    // Enrich each test result with the Jira key
    for (const testResult of automatedTestList.data.Value) {
      testResult.cJiraKey = jiraResults.get(testResult.testName) || null;
    }

    const foundCount = Array.from(jiraResults.values()).filter((key) => key !== null).length;
    logger.info(`Found Jira keys for ${foundCount} out of ${testNames.length} test names`);

    // Save the updated cache back to disk
    await saveJiraMappingCache(cache);
  } catch (error) {
    logger.error("Error enriching test results with Jira keys:", error);
    // Don't fail the entire process if Jira enrichment fails
    // Set all cJiraKey to null
    for (const testResult of automatedTestList.data.Value) {
      testResult.cJiraKey = null;
    }
  }
}

/**
 * Saves automated test results to the filesystem and tracks processed queue IDs.
 *
 * @function saveAutomatedTestList
 * @async
 *
 * @description
 * This helper function performs the following operations:
 * 1. Creates a date-based folder structure for organizing reports
 * 2. Saves the test results as a JSON file with sanitized project name
 * 3. Appends the queue ID to a status tracking file to prevent duplicate processing
 *
 * @param {Object} queue - Project configuration object
 * @param {string} queue.name - Display name of the project
 * @param {string} queue.storeStatusFile - Name of the file that tracks processed queue IDs
 * @param {Object} automatedQueue - Queue metadata containing execution information
 * @param {string} automatedQueue.executionStartTimeStamp - ISO timestamp when the queue execution started
 * @param {string} automatedQueue.key - Unique identifier for the automated queue
 * @param {TestResultsResponse} automatedTestList - Complete test results data from the API
 *
 * @returns {Promise<{filePath: string, storeStatusFilePath: string}>} Paths to the saved report and status file
 *
 * @throws {Error} When automatedQueue doesn't have an execution start timestamp
 * @throws {Error} When file operations fail (directory creation, writing)
 *
 * @example
 * ```typescript
 * const result = await saveAutomatedTestList(
 *   { name: "01.) JDEdwards Finance", storeStatusFile: "fin-queue-ids-tracker.txt" },
 *   { key: "12345", executionStartTimeStamp: "2025-12-02T10:30:00Z" },
 *   testResultsData
 * );
 * // Result: {
 * //   filePath: "/reports/2025-12-02/01.) JDEdwards Finance.json",
 * //   storeStatusFilePath: "/reports/fin-queue-ids-tracker.txt"
 * // }
 * ```
 */
async function saveAutomatedTestList(
  project: { name: string; storeStatusFile: string },
  automatedQueue: any,
  automatedTestList: TestResultsResponse,
) {
  if (!automatedQueue.executionStartTimeStamp) {
    throw new Error("Automated queue does not have an execution start timestamp");
  }
  const folderName = format(automatedQueue.executionStartTimeStamp as string, "yyyy-MM-dd");
  const folderPath = path.join(settings.REPORTS_PATH, folderName);

  if (!fs.existsSync(folderPath)) {
    await fs.promises.mkdir(folderPath, { recursive: true });
  }

  const time = format(automatedQueue.executionStartTimeStamp as string, "HH-mm-ss");
  const filePath = path.join(folderPath, `${sanitize(project.name)}_${time}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(automatedTestList, null, 2));

  const storeStatusFilePath = path.join(settings.REPORTS_PATH, project.storeStatusFile);
  if (!(await FileUtils.isFileExists(storeStatusFilePath))) {
    await fs.promises.writeFile(storeStatusFilePath, "");
  }
  await FileUtils.appendToFirstLine(storeStatusFilePath, automatedQueue.key as string);
  logger.info(`Report saved to: ${filePath}`);
  return { filePath, storeStatusFilePath };
}

/**
 * Processes multiple automated test queues for a project and collects their results.
 *
 * @function processAutomatedQueues
 * @async
 *
 * @description
 * This helper function orchestrates the collection of test results by:
 * 1. Validating that automated queues exist for the project
 * 2. Determining how many queues to process (minimum of requested and available)
 * 3. Iterating through queues in reverse order (newest to oldest)
 * 4. Skipping queues that have already been processed (tracked in status file)
 * 5. Fetching and saving test results for each unprocessed queue
 *
 * @param {Object} queue - Project configuration object
 * @param {string} queue.name - Display name of the project
 * @param {string} queue.standardName - Abbreviated project name
 * @param {string} queue.storeStatusFile - Name of the status tracking file
 * @param {Object} automatedQueuesData - Response containing automated test queues
 * @param {Object} automatedQueuesData.data - Data wrapper object
 * @param {Array} automatedQueuesData.data.Value - Array of automated queue objects
 * @param {number} numberOfTestResultsToCollect - Maximum number of queue results to collect
 * @param {DwsApi} dwsApi - Initialized DWS API client for making requests
 *
 * @returns {Promise<void>}
 *
 * @throws {Error} When no automated queues are found for the test queue
 * @throws {Error} When an automated queue doesn't have a key property
 *
 * @example
 * ```typescript
 * await processAutomatedQueues(
 *   {
 *     name: "01.) JDEdwards Finance",
 *     standardName: "FIN",
 *     storeStatusFile: "fin-queue-ids-tracker.txt"
 *   },
 *   { data: { Value: [queue1, queue2, queue3] } },
 *   5,
 *   dwsApiInstance
 * );
 * ```
 */
async function processAutomatedQueues(
  project: { name: string; standardName: string; storeStatusFile: string },
  automatedQueuesData: any,
  numberOfTestResultsToCollect: number,
  dwsApi: DwsApi,
) {
  if (!automatedQueuesData.data?.Value) throw new Error("No automated queues found for the test queue");
  const automateQueues = automatedQueuesData.data.Value.length;
  const numberOfAutomatedQueuesToCollect = Math.min(numberOfTestResultsToCollect, automateQueues as number);

  for (let i = numberOfAutomatedQueuesToCollect - 1; i >= 0; i--) {
    const automatedQueue = automatedQueuesData.data.Value[i];
    if (!automatedQueue) {
      logger.warn(`No automated queue found at index ${i}`);
      continue;
    }

    if (!automatedQueue.key) throw new Error("First automated queue does not have a key");

    const storeStatusFilePath = path.join(settings.REPORTS_PATH, project.storeStatusFile);
    if (await FileUtils.doesFileContain(storeStatusFilePath, automatedQueue.key as string)) {
      logger.info(`${storeStatusFilePath} already contains queue id ${automatedQueue.key}, skipping...`);
      continue;
    }

    const automatedTestList = await dwsApi.getAutomatedTestListForTestQueue(automatedQueue.key as number);

    // Enrich test results with Jira keys
    await enrichTestResultsWithJiraKeys(automatedTestList);

    await saveAutomatedTestList(project, automatedQueue, automatedTestList);
  }
}
