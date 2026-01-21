import { TestReport, TestResult } from "../types";

export const mockTestResult: TestResult = {
  title: "Test Login Functionality",
  key: "TEST-001",
  successful: "SUCCESS",
  executedByUserName: "john.doe",
  executionStartTimeStamp: "2025-12-08T10:00:00Z",
  executionEndTimeStamp: "2025-12-08T10:02:21Z",
  duration: "00:02:21.0643353",
  projectName: "01.) JDEdwards Finance",
  scenarioName: "User Authentication",
  testName: "Login with valid credentials",
  cErrorTitle: undefined,
  cErrorDescription: undefined,
  cImageUrl: undefined,
  cJiraKey: null,
};

export const mockFailedTestResult: TestResult = {
  title: "Test Payment Processing",
  key: "TEST-002",
  successful: "FAILED",
  executedByUserName: "jane.smith",
  executionStartTimeStamp: "2025-12-08T10:05:00Z",
  executionEndTimeStamp: "2025-12-08T10:06:30Z",
  duration: "00:01:30.1234567",
  projectName: "01.) JDEdwards Finance",
  scenarioName: "Payment Flow",
  testName: "Process credit card payment",
  cErrorTitle: "Payment Gateway Error",
  cErrorDescription: "Connection timeout to payment service",
  cImageUrl: "https://example.com/screenshot.png",
  cJiraKey: "FIN-123",
};

export const mockTestReport: TestReport = {
  data: {
    Value: [mockTestResult, mockFailedTestResult],
  },
};

export const mockTestReportMultiple: TestReport = {
  data: {
    Value: [
      mockTestResult,
      mockFailedTestResult,
      {
        ...mockTestResult,
        key: "TEST-003",
        projectName: "02.) JDEdwards Sales & Distribution",
        testName: "Create Sales Order",
        scenarioName: "Order Management",
      },
      {
        ...mockTestResult,
        key: "TEST-004",
        projectName: "02.) JDEdwards Sales & Distribution",
        testName: "Create Sales Order",
        scenarioName: "Order Management",
        successful: "FAILED",
      },
    ],
  },
};

export const mockFlakyTestData: TestResult[] = [
  {
    ...mockTestResult,
    key: "TEST-FLAKY-001",
    testName: "Flaky Test",
    scenarioName: "Flaky Scenario",
    successful: "SUCCESS",
  },
  {
    ...mockTestResult,
    key: "TEST-FLAKY-002",
    testName: "Flaky Test",
    scenarioName: "Flaky Scenario",
    successful: "FAILED",
  },
  {
    ...mockTestResult,
    key: "TEST-FLAKY-003",
    testName: "Flaky Test",
    scenarioName: "Flaky Scenario",
    successful: "SUCCESS",
  },
];
