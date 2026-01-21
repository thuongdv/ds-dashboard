import { expect, Page } from "@playwright/test";
import { DWS_DASHBOARD_URL } from "constants/dws";
import logger from "logger";

export default class LoginPage {
  private readonly acceptCookiesButton = this.page.getByRole("button", { name: "Accept Cookies" });
  private readonly signInButton = this.page.getByRole("button", { name: "Sign In" });
  private readonly emailText = this.page.getByLabel("Email");
  private readonly passwordText = this.page.getByLabel("Password");
  private readonly continueButton = this.page.getByRole("button", { name: "Continue" });

  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(username: string, password: string, options?: { expectSuccess: boolean }) {
    await this.acceptCookiesButton.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      console.log("No cookie consent popup found, continuing...");
    });
    if (await this.acceptCookiesButton.isVisible()) {
      await this.acceptCookiesButton.click();
    }

    await this.signInButton.click();

    await this.emailText.fill(username);
    await this.passwordText.fill(password);
    await this.signInButton.click();

    // Handle optional continue button (e.g., for multiple account selection )
    await this.continueButton.waitFor({ state: "visible", timeout: 20_000 }).catch(() => {
      logger.info("No continue button found, continuing...");
    });
    if (await this.continueButton.isVisible()) {
      await this.continueButton.click();
    }

    if (options?.expectSuccess) {
      await expect(this.page).toHaveURL(new RegExp(DWS_DASHBOARD_URL), { timeout: 60_000 });
      await this.page.waitForTimeout(5000); // Wait for the page to load completely
    }
  }
}
