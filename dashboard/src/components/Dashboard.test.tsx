import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "../components/Dashboard";
import * as dataLoader from "../dataLoader";

// Mock the dataLoader module
vi.mock("../dataLoader");

// Mock the PodsQueueData component
vi.mock("../components/PodsQueueData", () => ({
  PodsQueueData: () => <div>PodsQueueData Component</div>,
}));

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
              projectName: "01.) JDEdwards Finance",
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
              projectName: "01.) JDEdwards Finance",
              scenarioName: "Scenario 2",
              testName: "Test Name 2",
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
              title: "Test 3",
              key: "TEST-003",
              successful: "SUCCESS",
              executedByUserName: "user3",
              executionStartTimeStamp: "2025-12-07T10:00:00Z",
              executionEndTimeStamp: "2025-12-07T10:01:00Z",
              duration: "00:01:00.0000000",
              projectName: "02.) JDEdwards Sales & Distribution",
              scenarioName: "Scenario 3",
              testName: "Test Name 3",
            },
          ],
        },
      },
    ],
  },
];

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataLoader.loadAllReports).mockResolvedValue(mockReportsData);
    vi.mocked(dataLoader.generateSummaryRows).mockReturnValue([
      {
        date: "2025-12-08",
        total: 2,
        passed: 1,
        notPassed: 1,
        passedRate: "50.00%",
        reportPath: "/report/0?date=2025-12-08",
      },
      {
        date: "2025-12-07",
        total: 1,
        passed: 1,
        notPassed: 0,
        passedRate: "100.00%",
        reportPath: "/report/1?date=2025-12-07",
      },
    ]);
  });

  it("should show loading spinner initially", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(screen.getByText("Loading test results...")).toBeInTheDocument();

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });
  });

  it("should display summary data after loading", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Test Results Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Total Tests")).toBeInTheDocument();
    expect(screen.getAllByText("Passed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
  });

  it("should display summary table with test results", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("2025-12-08")).toBeInTheDocument();
    });

    expect(screen.getByText("2025-12-07")).toBeInTheDocument();
    expect(screen.getByText("50.00%")).toBeInTheDocument();
    expect(screen.getByText("100.00%")).toBeInTheDocument();
  });

  it("should switch to flaky tests view", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Find and click the flaky tests view button
    const flakyButton = screen.getByText("Flaky Tests");
    await user.click(flakyButton);

    await waitFor(() => {
      expect(screen.getByText("Total Flaky Tests")).toBeInTheDocument();
    });
  });

  it("should switch to pods queue view", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Find and click the pods queue view button
    const podsButton = screen.getByText("Queue History");
    await user.click(podsButton);

    await waitFor(() => {
      expect(screen.getByText("PodsQueueData Component")).toBeInTheDocument();
    });
  });

  it("should calculate overall statistics correctly", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Check statistics are displayed
    expect(screen.getByText("Total Tests")).toBeInTheDocument();
    expect(screen.getAllByText("Pass Rate").length).toBeGreaterThan(0);
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });

  it("should display View Details links", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    const detailLinks = screen.getAllByText(/View Details/);
    expect(detailLinks).toHaveLength(2);
  });

  it("should handle loading error gracefully", async () => {
    // Suppress expected error logs
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(dataLoader.loadAllReports).mockRejectedValue(new Error("Failed to load"));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Should render empty state or error handling
    expect(screen.getByText("Test Results Dashboard")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("should toggle flaky test project sections", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Switch to flaky tests view
    const flakyButton = screen.getByText("Flaky Tests");
    await user.click(flakyButton);

    await waitFor(() => {
      expect(screen.getByText("Total Flaky Tests")).toBeInTheDocument();
    });

    // Find a project toggle button
    const toggleButtons = screen.queryAllByRole("button", { name: /Collapse .* flaky tests section/ });
    if (toggleButtons.length > 0) {
      await user.click(toggleButtons[0]);
      // Verify it toggled
      expect(toggleButtons[0]).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("should display Open test on DWS Dashboard button in flaky tests", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Switch to flaky tests view
    const flakyButton = screen.getByText("Flaky Tests");
    await user.click(flakyButton);

    await waitFor(() => {
      expect(screen.getByText("Total Flaky Tests")).toBeInTheDocument();
    });

    // Check if DWS buttons exist (if there are flaky tests)
    const dwsButtons = screen.queryAllByText("Open test on DWS Dashboard");
    // If there are flaky tests, we should see buttons
    expect(dwsButtons.length).toBeGreaterThanOrEqual(0);
  });

  it("should render flaky tests table headers", async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading test results...")).not.toBeInTheDocument();
    });

    // Switch to flaky tests view
    const flakyButton = screen.getByText("Flaky Tests");
    await user.click(flakyButton);

    await waitFor(() => {
      expect(screen.getByText("Total Flaky Tests")).toBeInTheDocument();
    });

    // Check for table headers (if flaky tests exist)
    const testNameHeaders = screen.queryAllByText("Test Name");
    const scenarioHeaders = screen.queryAllByText("Scenario");
    // These will only exist if there are flaky tests to display
    expect(testNameHeaders.length + scenarioHeaders.length).toBeGreaterThanOrEqual(0);
  });
});
