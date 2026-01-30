import { describe, expect, it } from "vitest";
import { generateSummaryRows } from "./dataLoader.js";

describe("dataLoader", () => {
  describe("generateSummaryRows", () => {
    it("should generate summary rows from report data", () => {
      const mockReportsData = [
        {
          date: "2025-12-08",
          reports: [
            {
              data: {
                Value: [
                  {
                    title: "Test 1",
                    key: "TEST-001",
                    successful: "SUCCESS",
                    executedByUserName: "user1",
                    executionStartTimeStamp: "2025-12-08T10:00:00Z",
                    executionEndTimeStamp: "2025-12-08T10:01:00Z",
                    duration: "00:01:00.0000000",
                    projectName: "Project A",
                    scenarioName: "Scenario 1",
                    testName: "Test Name 1",
                  },
                  {
                    title: "Test 2",
                    key: "TEST-002",
                    successful: "FAILED",
                    executedByUserName: "user2",
                    executionStartTimeStamp: "2025-12-08T10:05:00Z",
                    executionEndTimeStamp: "2025-12-08T10:06:00Z",
                    duration: "00:01:00.0000000",
                    projectName: "Project A",
                    scenarioName: "Scenario 2",
                    testName: "Test Name 2",
                  },
                ],
              },
            },
          ],
        },
      ];

      const summaryRows = generateSummaryRows(mockReportsData);

      expect(summaryRows).toHaveLength(1);
      expect(summaryRows[0].date).toBe("2025-12-08");
      expect(summaryRows[0].total).toBe(2);
      expect(summaryRows[0].passed).toBe(1);
      expect(summaryRows[0].notPassed).toBe(1);
      expect(summaryRows[0].passedRate).toBe("50.00%");
      expect(summaryRows[0].reportPath).toBe("/report/0?date=2025-12-08");
    });

    it("should handle empty reports data", () => {
      const summaryRows = generateSummaryRows([]);
      expect(summaryRows).toHaveLength(0);
    });

    it("should handle multiple report dates", () => {
      const mockReportsData = [
        {
          date: "2025-12-08",
          reports: [
            {
              data: {
                Value: [
                  {
                    title: "Test 1",
                    key: "TEST-001",
                    successful: "SUCCESS",
                    executedByUserName: "user1",
                    executionStartTimeStamp: "2025-12-08T10:00:00Z",
                    executionEndTimeStamp: "2025-12-08T10:01:00Z",
                    duration: "00:01:00.0000000",
                    projectName: "Project A",
                    scenarioName: "Scenario 1",
                    testName: "Test Name 1",
                  },
                ],
              },
            },
          ],
        },
        {
          date: "2025-12-07",
          reports: [
            {
              data: {
                Value: [
                  {
                    title: "Test 2",
                    key: "TEST-002",
                    successful: "SUCCESS",
                    executedByUserName: "user2",
                    executionStartTimeStamp: "2025-12-07T10:00:00Z",
                    executionEndTimeStamp: "2025-12-07T10:01:00Z",
                    duration: "00:01:00.0000000",
                    projectName: "Project B",
                    scenarioName: "Scenario 2",
                    testName: "Test Name 2",
                  },
                ],
              },
            },
          ],
        },
      ];

      const summaryRows = generateSummaryRows(mockReportsData);

      expect(summaryRows).toHaveLength(2);
      expect(summaryRows[0].date).toBe("2025-12-08");
      expect(summaryRows[1].date).toBe("2025-12-07");
    });

    it("should calculate 100% pass rate correctly", () => {
      const mockReportsData = [
        {
          date: "2025-12-08",
          reports: [
            {
              data: {
                Value: [
                  {
                    title: "Test 1",
                    key: "TEST-001",
                    successful: "SUCCESS",
                    executedByUserName: "user1",
                    executionStartTimeStamp: "2025-12-08T10:00:00Z",
                    executionEndTimeStamp: "2025-12-08T10:01:00Z",
                    duration: "00:01:00.0000000",
                    projectName: "Project A",
                    scenarioName: "Scenario 1",
                    testName: "Test Name 1",
                  },
                  {
                    title: "Test 2",
                    key: "TEST-002",
                    successful: "SUCCESS",
                    executedByUserName: "user2",
                    executionStartTimeStamp: "2025-12-08T10:05:00Z",
                    executionEndTimeStamp: "2025-12-08T10:06:00Z",
                    duration: "00:01:00.0000000",
                    projectName: "Project A",
                    scenarioName: "Scenario 2",
                    testName: "Test Name 2",
                  },
                ],
              },
            },
          ],
        },
      ];

      const summaryRows = generateSummaryRows(mockReportsData);
      expect(summaryRows[0].passedRate).toBe("100.00%");
    });
  });
});
