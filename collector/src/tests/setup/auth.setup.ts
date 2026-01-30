import { test as setup } from "@playwright/test";
import { DWS_DASHBOARD_URL } from "constants/dws";
import logger from "logger";
import LoginPage from "pages/dws/login-page";
import settings from "settings";

setup("authenticate", async ({ page }) => {
  logger.info("Starting authentication setup...");

  const loginPage = new LoginPage(page);

  // Navigate to the dashboard and login
  await page.goto(DWS_DASHBOARD_URL);
  await loginPage.login(settings.DWS_EMAIL, settings.DWS_PASSWORD, { expectSuccess: true });

  // 3. Save the storage state (cookies, local storage) to a JSON file
  await page.context().storageState({ path: settings.AUTH_FILE });

  logger.info("Authentication setup completed. Storage state saved.");
});
