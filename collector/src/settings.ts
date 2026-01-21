/**
 * Application Settings Module
 *
 * @module settings
 * @description
 * Loads and validates environment variables from .env file.
 * All required environment variables are validated at application startup.
 * Missing required variables will throw an error immediately.
 *
 * @requires dotenv
 */

import dotenv from "dotenv";
import path from "node:path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Validates that an environment variable exists and returns its value.
 *
 * @function validatedEnv
 * @param {string} name - The name of the environment variable to validate
 * @returns {string} The value of the environment variable
 * @throws {Error} When the environment variable is not set or is empty
 *
 * @example
 * ```typescript
 * const apiUrl = validatedEnv("API_URL"); // Returns value or throws error
 * ```
 */
const validatedEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);

  return value;
};

/**
 * Application settings loaded from environment variables.
 *
 * @constant settings
 * @type {Object}
 *
 * @property {string} APP_ROOT_PATH - Root directory path of the application (auto-detected)
 * @property {string} DWS_URL - Base URL of the DWS instance
 * @property {string} DWS_EMAIL - Email for DWS authentication
 * @property {string} DWS_PASSWORD - Password for DWS authentication
 * @property {string} REPORTS_PATH - Directory path where reports will be saved
 * @property {string} JIRA_BASE_URL - Base URL of the Jira instance
 * @property {string} JIRA_API_TOKEN - API token for Jira authentication
 * @property {string} JIRA_EMAIL - Email for Jira authentication
 * @property {string} JIRA_PROJECT - Jira project key
 *
 * @throws {Error} When any required environment variable is missing
 *
 * @example
 * ```typescript
 * import settings from 'settings';
 *
 * console.log(`Connecting to DWS at: ${settings.DWS_URL}`);
 * console.log(`Reports will be saved to: ${settings.REPORTS_PATH}`);
 * ```
 */
const settings = {
  APP_ROOT_PATH: process.cwd(),
  DWS_URL: validatedEnv("DWS_URL"),
  DWS_EMAIL: validatedEnv("DWS_EMAIL"),
  DWS_PASSWORD: validatedEnv("DWS_PASSWORD"),
  REPORTS_PATH: validatedEnv("REPORTS_PATH"),
  JIRA_BASE_URL: validatedEnv("JIRA_BASE_URL"),
  JIRA_API_TOKEN: validatedEnv("JIRA_API_TOKEN"),
  JIRA_EMAIL: validatedEnv("JIRA_EMAIL"),
  JIRA_PROJECT: validatedEnv("JIRA_PROJECT"),
  AUTH_FILE: "playwright/.auth/dws-user.json",
};

export default settings;
