import { defineConfig, devices } from "@playwright/test";
import settings from "settings";

const TEST_TIMEOUT_ENV = process.env.TEST_TIMEOUT;
const DEFAULT_TEST_TIMEOUT_SEC = 600;
// ------------------------------------------
// Determine the timeout value
// ------------------------------------------
// We check if the environment variable is set and a valid number.
// If not set or invalid, we use a default value (e.g., 600 sec = 10 minutes).
let TEST_TIMEOUT_SEC: number;
if (TEST_TIMEOUT_ENV === undefined || TEST_TIMEOUT_ENV === null || TEST_TIMEOUT_ENV.trim() === "") {
  TEST_TIMEOUT_SEC = DEFAULT_TEST_TIMEOUT_SEC;
  console.log(`Using default TEST_TIMEOUT: ${TEST_TIMEOUT_SEC}sec`);
} else {
  const parsedTimeout = Number.parseInt(TEST_TIMEOUT_ENV, 10);
  if (Number.isNaN(parsedTimeout) || parsedTimeout <= 0) {
    TEST_TIMEOUT_SEC = DEFAULT_TEST_TIMEOUT_SEC;
    console.log(
      `Invalid TEST_TIMEOUT value "${TEST_TIMEOUT_ENV}" provided. Falling back to default: ${TEST_TIMEOUT_SEC}sec`,
    );
  } else {
    TEST_TIMEOUT_SEC = parsedTimeout;
    console.log(`Using TEST_TIMEOUT from environment variable: ${TEST_TIMEOUT_SEC}sec`);
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Timeout for each test in milliseconds. Defaults to 30 seconds.
  timeout: TEST_TIMEOUT_SEC * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText('text')`.
     */
    timeout: 20_000,
  },
  testDir: "./src/tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: settings.DWS_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Record video only when retrying a test for the first time.
    video: "on-first-retry",
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 900 },
        storageState: settings.AUTH_FILE,
      },
      dependencies: ["setup"],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: "Google Chrome",
    //   use: {
    //     ...devices["Desktop Chrome"],
    //     channel: "chrome",
    //     viewport: { width: 1600, height: 900 },
    //   },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
