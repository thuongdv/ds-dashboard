import { describe, expect, it, vi } from "vitest";
import { mockFlakyTestData, mockTestReport, mockTestReportMultiple } from "./test/mockData.js";
import {
  calculateFlakyTests,
  calculatePassedRate,
  calculateProjectSummary,
  calculateSummary,
  extractDateFromPath,
  formatDuration,
  getTestCases,
  groupTestsByName,
  parseDuration,
  parseTestReport,
} from "./utils.js";

describe("utils", () => {
  describe("parseTestReport", () => {
    it("should parse test report and return test results", () => {
      const results = parseTestReport(mockTestReport);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe("Test Login Functionality");
      expect(results[1].title).toBe("Test Payment Processing");
    });

    it("should handle empty reports", () => {
      const emptyReport = { data: { Value: [] } };
      const results = parseTestReport(emptyReport);
      expect(results).toHaveLength(0);
    });
  });

  describe("calculateSummary", () => {
    it("should calculate correct summary statistics", () => {
      const results = parseTestReport(mockTestReport);
      const summary = calculateSummary(results);

      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(1);
      expect(summary.notPassed).toBe(1);
    });

    it("should handle all passed tests", () => {
      const allPassed = [mockTestReport.data.Value[0]];
      const summary = calculateSummary(allPassed);

      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(1);
      expect(summary.notPassed).toBe(0);
    });

    it("should handle all failed tests", () => {
      const allFailed = [mockTestReport.data.Value[1]];
      const summary = calculateSummary(allFailed);

      expect(summary.total).toBe(1);
      expect(summary.passed).toBe(0);
      expect(summary.notPassed).toBe(1);
    });

    it("should handle empty test results", () => {
      const summary = calculateSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.notPassed).toBe(0);
    });
  });

  describe("calculatePassedRate", () => {
    it("should calculate correct passed rate", () => {
      expect(calculatePassedRate(50, 100)).toBe("50.00%");
      expect(calculatePassedRate(75, 100)).toBe("75.00%");
      expect(calculatePassedRate(100, 100)).toBe("100.00%");
    });

    it("should handle zero total tests", () => {
      expect(calculatePassedRate(0, 0)).toBe("0%");
    });

    it("should format decimal places correctly", () => {
      expect(calculatePassedRate(1, 3)).toBe("33.33%");
      expect(calculatePassedRate(2, 3)).toBe("66.67%");
    });
  });

  describe("parseDuration", () => {
    it("should parse duration string correctly", () => {
      expect(parseDuration("00:02:21.0643353")).toBeCloseTo(141, 0);
      expect(parseDuration("00:01:30.1234567")).toBeCloseTo(90, 0);
      expect(parseDuration("01:00:00.0000000")).toBe(3600);
      expect(parseDuration("00:00:05.5000000")).toBeCloseTo(5.5, 1);
    });

    it("should handle invalid duration format", () => {
      expect(parseDuration("invalid")).toBe(0);
      expect(parseDuration("")).toBe(0);
    });

    it("should handle edge cases", () => {
      expect(parseDuration("00:00:00.0000000")).toBe(0);
      expect(parseDuration("23:59:59.9999999")).toBeCloseTo(86399.9999999, 2);
    });
  });

  describe("formatDuration", () => {
    it("should format seconds to HH:MM:SS", () => {
      expect(formatDuration(141)).toBe("00:02:21");
      expect(formatDuration(90)).toBe("00:01:30");
      expect(formatDuration(3600)).toBe("01:00:00");
      expect(formatDuration(5)).toBe("00:00:05");
    });

    it("should handle zero duration", () => {
      expect(formatDuration(0)).toBe("00:00:00");
    });

    it("should handle large durations", () => {
      expect(formatDuration(86399)).toBe("23:59:59");
      expect(formatDuration(90061)).toBe("25:01:01");
    });

    it("should floor decimal seconds", () => {
      expect(formatDuration(5.9)).toBe("00:00:05");
      expect(formatDuration(90.5)).toBe("00:01:30");
    });
  });

  describe("groupTestsByName", () => {
    it("should group tests by name and scenario", () => {
      const results = parseTestReport(mockTestReportMultiple);
      const grouped = groupTestsByName(results);

      expect(grouped.size).toBe(3);
      expect(grouped.has("Login with valid credentials-User Authentication")).toBe(true);
      expect(grouped.has("Process credit card payment-Payment Flow")).toBe(true);
      expect(grouped.has("Create Sales Order-Order Management")).toBe(true);
    });

    it("should group multiple runs of same test", () => {
      const results = parseTestReport(mockTestReportMultiple);
      const grouped = groupTestsByName(results);
      const salesOrderTests = grouped.get("Create Sales Order-Order Management");

      expect(salesOrderTests).toHaveLength(2);
      expect(salesOrderTests![0].successful).toBe("SUCCESS");
      expect(salesOrderTests![1].successful).toBe("FAILED");
    });

    it("should handle empty results", () => {
      const grouped = groupTestsByName([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe("calculateFlakyTests", () => {
    it("should identify flaky tests", () => {
      const flakyTests = calculateFlakyTests(mockFlakyTestData, "01.) JDEdwards Finance");

      expect(flakyTests).toHaveLength(1);
      expect(flakyTests[0].testName).toBe("Flaky Test");
      expect(flakyTests[0].totalRuns).toBe(3);
      expect(flakyTests[0].pass).toBe(2);
      expect(flakyTests[0].notPassed).toBe(1);
      expect(flakyTests[0].flakyRate).toBe("33.33%");
    });

    it("should not include tests with single run", () => {
      const singleRun = [mockTestReport.data.Value[0]];
      const flakyTests = calculateFlakyTests(singleRun, "01.) JDEdwards Finance");
      expect(flakyTests).toHaveLength(0);
    });

    it("should not include tests that always pass", () => {
      const alwaysPassed = [mockTestReport.data.Value[0], { ...mockTestReport.data.Value[0], key: "TEST-005" }];
      const flakyTests = calculateFlakyTests(alwaysPassed, "01.) JDEdwards Finance");
      expect(flakyTests).toHaveLength(0);
    });

    it("should not include tests that always fail", () => {
      const alwaysFailed = [mockTestReport.data.Value[1], { ...mockTestReport.data.Value[1], key: "TEST-006" }];
      const flakyTests = calculateFlakyTests(alwaysFailed, "01.) JDEdwards Finance");
      expect(flakyTests).toHaveLength(0);
    });

    it("should filter by project name", () => {
      const results = parseTestReport(mockTestReportMultiple);
      const flakyTests = calculateFlakyTests(results, "02.) JDEdwards Sales & Distribution");
      expect(flakyTests).toHaveLength(1);
      expect(flakyTests[0].testName).toBe("Create Sales Order");
    });
  });

  describe("calculateProjectSummary", () => {
    it("should calculate project summary correctly", () => {
      const results = parseTestReport(mockTestReport);
      const summary = calculateProjectSummary(results, "01.) JDEdwards Finance");

      expect(summary.project).toBe("01.) JDEdwards Finance");
      expect(summary.total).toBe(2);
      expect(summary.passed).toBe(1);
      expect(summary.notPassed).toBe(1);
      expect(summary.totalDuration).toBe("00:03:51");
    });

    it("should filter tests by project name", () => {
      const results = parseTestReport(mockTestReportMultiple);
      const summary = calculateProjectSummary(results, "02.) JDEdwards Sales & Distribution");

      expect(summary.total).toBe(2);
    });

    it("should handle project with no tests", () => {
      const results = parseTestReport(mockTestReport);
      const summary = calculateProjectSummary(results, "03.) JDEdwards Manufacturing");

      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.notPassed).toBe(0);
      expect(summary.totalDuration).toBe("00:00:00");
    });
  });

  describe("getTestCases", () => {
    it("should convert test results to test cases", () => {
      const results = parseTestReport(mockTestReport);
      const testCases = getTestCases(results, "01.) JDEdwards Finance");

      expect(testCases).toHaveLength(2);
      expect(testCases[0].index).toBe(1);
      expect(testCases[0].testName).toBe("Login with valid credentials");
      expect(testCases[0].status).toBe("PASSED");
      expect(testCases[1].index).toBe(2);
      expect(testCases[1].testName).toBe("Process credit card payment");
      expect(testCases[1].status).toBe("NOT PASSED");
    });

    it("should include error details for failed tests", () => {
      const results = parseTestReport(mockTestReport);
      const testCases = getTestCases(results, "01.) JDEdwards Finance");

      expect(testCases[1].errorTitle).toBe("Payment Gateway Error");
      expect(testCases[1].errorDescription).toBe("Connection timeout to payment service");
      expect(testCases[1].screenshot).toBe("https://example.com/screenshot.png");
      expect(testCases[1].jiraKey).toBe("FIN-123");
    });

    it("should format timestamps correctly", () => {
      const results = parseTestReport(mockTestReport);
      const testCases = getTestCases(results, "01.) JDEdwards Finance");

      expect(testCases[0].startTime).toBeDefined();
      expect(testCases[0].endTime).toBeDefined();
      expect(testCases[0].duration).toBe("00:02:21");
    });

    it("should filter by project name", () => {
      const results = parseTestReport(mockTestReportMultiple);
      const testCases = getTestCases(results, "02.) JDEdwards Sales & Distribution");

      expect(testCases).toHaveLength(2);
      expect(testCases[0].testName).toBe("Create Sales Order");
    });
  });

  describe("extractDateFromPath", () => {
    it("should extract date from valid path", () => {
      expect(extractDateFromPath("../../dws-report/reports/2025-12-08/report.json")).toBe("2025-12-08");
      expect(extractDateFromPath("/reports/2025-11-16/test.json")).toBe("2025-11-16");
    });

    it("should return empty string for invalid path", () => {
      expect(extractDateFromPath("invalid/path")).toBe("");
      expect(extractDateFromPath("")).toBe("");
    });

    it("should extract first date if multiple dates present", () => {
      expect(extractDateFromPath("2025-12-08/archive/2025-11-16/report.json")).toBe("2025-12-08");
    });
  });

  describe("copyToClipboard", () => {
    it("should copy text using modern Clipboard API when available", async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      const { copyToClipboard } = await import("./utils.js");
      await copyToClipboard("test text");

      expect(mockWriteText).toHaveBeenCalledWith("test text");
    });

    it("should use fallback method when Clipboard API is unavailable", async () => {
      // Mock navigator.clipboard as undefined
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock document methods
      const mockTextArea = {
        value: "",
        style: { position: "", left: "", top: "" },
        focus: vi.fn(),
        select: vi.fn(),
      };
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockExecCommand = vi.fn().mockReturnValue(true);

      vi.spyOn(document, "createElement").mockReturnValue(mockTextArea as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
      vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);
      vi.spyOn(document, "execCommand").mockImplementation(mockExecCommand);

      const { copyToClipboard } = await import("./utils.js");
      await copyToClipboard("test text");

      expect(mockTextArea.value).toBe("test text");
      expect(mockTextArea.style.position).toBe("fixed");
      expect(mockTextArea.focus).toHaveBeenCalled();
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith("copy");
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();

      // Restore navigator.clipboard
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
    });

    it("should reject when fallback copy command fails", async () => {
      // Mock navigator.clipboard as undefined
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock document methods with failed execCommand
      const mockTextArea = {
        value: "",
        style: { position: "", left: "", top: "" },
        focus: vi.fn(),
        select: vi.fn(),
      };
      vi.spyOn(document, "createElement").mockReturnValue(mockTextArea as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(vi.fn());
      vi.spyOn(document.body, "removeChild").mockImplementation(vi.fn());
      vi.spyOn(document, "execCommand").mockReturnValue(false);

      const { copyToClipboard } = await import("./utils.js");

      await expect(copyToClipboard("test text")).rejects.toThrow("Copy command failed");
    });

    it("should reject when fallback throws an error", async () => {
      // Mock navigator.clipboard as undefined
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock document.createElement to throw error
      vi.spyOn(document, "createElement").mockImplementation(() => {
        throw new Error("DOM error");
      });

      const { copyToClipboard } = await import("./utils.js");

      await expect(copyToClipboard("test text")).rejects.toThrow("DOM error");
    });
  });

  describe("openTestOnDWS", () => {
    it("should copy test name, open DWS page, and show success alert", async () => {
      // Mock copyToClipboard to succeed
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Mock window.open
      const mockWindowOpen = vi.fn();
      vi.stubGlobal("open", mockWindowOpen);

      // Mock alert
      const mockAlert = vi.fn();
      vi.stubGlobal("alert", mockAlert);

      // Mock import.meta.env
      vi.stubEnv("VITE_DWS_EXECUTION_URL", "https://test-dws.com/Execution");

      const { openTestOnDWS } = await import("./utils.js");
      openTestOnDWS("Sample Test Name");

      // Wait for promise to resolve
      await vi.waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith("Sample Test Name");
        expect(mockWindowOpen).toHaveBeenCalledWith("https://test-dws.com/Execution", "_blank", "noopener,noreferrer");
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Test name "Sample Test Name" has been copied to clipboard'),
        );
      });
    });

    it("should use default URL when environment variable is not set", async () => {
      // Mock copyToClipboard to succeed
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Mock window.open
      const mockWindowOpen = vi.fn();
      vi.stubGlobal("open", mockWindowOpen);

      // Mock alert
      const mockAlert = vi.fn();
      vi.stubGlobal("alert", mockAlert);

      // Clear environment variable
      vi.stubEnv("VITE_DWS_EXECUTION_URL", undefined);

      const { openTestOnDWS } = await import("./utils.js");
      openTestOnDWS("Test Name");

      await vi.waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          "https://www.dwsdimension.com/SwifTest/Execution",
          "_blank",
          "noopener,noreferrer",
        );
      });
    });

    it("should still open DWS page when clipboard copy fails", async () => {
      // Mock copyToClipboard to fail
      const mockWriteText = vi.fn().mockRejectedValue(new Error("Clipboard error"));
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Mock window.open
      const mockWindowOpen = vi.fn();
      vi.stubGlobal("open", mockWindowOpen);

      // Mock alert
      const mockAlert = vi.fn();
      vi.stubGlobal("alert", mockAlert);

      const { openTestOnDWS } = await import("./utils.js");
      openTestOnDWS("Test Name");

      await vi.waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.any(String),
          "_blank",
          "noopener,noreferrer",
        );
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Please manually search for test: "Test Name"'),
        );
      });
    });

    it("should include security attributes in window.open", async () => {
      // Mock copyToClipboard to succeed
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      // Mock window.open
      const mockWindowOpen = vi.fn();
      vi.stubGlobal("open", mockWindowOpen);

      // Mock alert
      vi.stubGlobal("alert", vi.fn());

      const { openTestOnDWS } = await import("./utils.js");
      openTestOnDWS("Test");

      await vi.waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.any(String),
          "_blank",
          "noopener,noreferrer",
        );
      });
    });
  });
});
