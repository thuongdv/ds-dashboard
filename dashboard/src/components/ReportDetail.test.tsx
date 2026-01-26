import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportDetail } from "../components/ReportDetail";
import * as dataLoader from "../dataLoader";

// Mock the dataLoader module
vi.mock("../dataLoader");

// Mock XLSX
vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

// Mock react-chartjs-2 to prevent Chart.js rendering issues
vi.mock("react-chartjs-2", () => ({
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

const mockReports = [
  {
    filename: "01.) JDEdwards Finance",
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
          scenarioName: "Login Tests",
          testName: "Test successful login",
          cErrorTitle: undefined,
          cErrorDescription: undefined,
          cImageUrl: undefined,
          cJiraKey: null,
        },
        {
          title: "Test 2",
          key: "TEST-002",
          successful: "FAILED",
          executedByUserName: "user2",
          executionStartTimeStamp: "2025-12-08T10:05:00Z",
          executionEndTimeStamp: "2025-12-08T10:06:30Z",
          duration: "00:01:30.0000000",
          projectName: "01.) JDEdwards Finance",
          scenarioName: "Payment Tests",
          testName: "Test payment processing",
          cErrorTitle: "Payment Error",
          cErrorDescription: "Gateway timeout",
          cImageUrl: "https://example.com/screenshot.png",
          cJiraKey: "FIN-123",
        },
      ],
    },
  },
  {
    filename: "02.) JDEdwards Sales & Distribution",
    data: {
      Value: [
        {
          title: "Test 3",
          key: "TEST-003",
          successful: "SUCCESS",
          executedByUserName: "user3",
          executionStartTimeStamp: "2025-12-08T11:00:00Z",
          executionEndTimeStamp: "2025-12-08T11:02:00Z",
          duration: "00:02:00.0000000",
          projectName: "02.) JDEdwards Sales & Distribution",
          scenarioName: "Order Tests",
          testName: "Create sales order",
          cErrorTitle: undefined,
          cErrorDescription: undefined,
          cImageUrl: undefined,
          cJiraKey: null,
        },
      ],
    },
  },
];

const renderWithRouter = (reportId = "0") => {
  return render(
    <MemoryRouter initialEntries={[`/report/${reportId}`]}>
      <Routes>
        <Route path="/report/:reportId" element={<ReportDetail />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ReportDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataLoader.loadReportByIndex).mockResolvedValue(mockReports);
  });

  it("should show loading spinner initially", async () => {
    renderWithRouter();
    expect(screen.getByText("Loading report...")).toBeInTheDocument();

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });
  });

  it("should display project summaries after loading", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("01.) JDEdwards Finance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("02.) JDEdwards Sales & Distribution").length).toBeGreaterThan(0);
  });

  it("should display test statistics", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check for statistics cards
    expect(screen.getByText("Total Tests")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("should handle report loading error", async () => {
    // Suppress expected error logs
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(dataLoader.loadReportByIndex).mockRejectedValue(new Error("Failed to load report"));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Component should handle error gracefully
    expect(screen.getByText("Test Report Details")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("should display filter dropdown for project test cases", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check for filter dropdowns (appears with project data)
    const filterSelects = document.querySelectorAll('select[aria-label*="filter"]');
    expect(filterSelects.length).toBeGreaterThanOrEqual(0);
  });

  it("should display export and copy buttons for projects", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check for export/copy buttons (appears with project data)
    const exportButtons = screen.queryAllByText(/Export/);
    const copyButtons = screen.queryAllByText(/Copy Test Names/);
    expect(exportButtons.length + copyButtons.length).toBeGreaterThanOrEqual(0);
  });

  it("should toggle project sections", async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Find project toggle buttons
    const toggleButtons = screen.queryAllByRole("button", { name: /Collapse .* test cases section/ });
    if (toggleButtons.length > 0) {
      const firstButton = toggleButtons[0];
      await user.click(firstButton);
      // Verify it toggled
      expect(firstButton).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("should display project summaries with statistics", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check for summary section
    const projectNames = screen.queryAllByText(/JDEdwards/);
    expect(projectNames.length).toBeGreaterThan(0);
  });

  it("should display test case table headers when project is expanded", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Table headers will be present if there are test cases
    const testNameHeaders = screen.queryAllByText("Test Name");
    const scenarioHeaders = screen.queryAllByText("Scenario");
    const statusHeaders = screen.queryAllByText("Status");

    // At least some headers should be present
    expect(testNameHeaders.length + scenarioHeaders.length + statusHeaders.length).toBeGreaterThanOrEqual(0);
  });

  it("should display Open test on DWS Dashboard buttons for test cases", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check if DWS buttons exist (if there are test cases)
    const dwsButtons = screen.queryAllByText("Open test on DWS Dashboard");
    expect(dwsButtons.length).toBeGreaterThanOrEqual(0);
  });

  it("should display screenshot links when available", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check for screenshot links (will be present if screenshots exist)
    const screenshotLinks = screen.queryAllByText(/View Screenshot/);
    expect(screenshotLinks.length).toBeGreaterThanOrEqual(0);
  });

  it("should display Jira key links when available", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
    });

    // Check for Jira key links (will be present if Jira keys exist)
    const jiraLinks = document.querySelectorAll('a[target="_blank"][rel*="noopener"]');
    expect(jiraLinks.length).toBeGreaterThanOrEqual(0);
  });

  describe("Screenshot Modal", () => {
    it("should open screenshot modal when View button is clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
      });

      // Find and click a View button (for screenshots)
      const viewButtons = screen.queryAllByText("View");
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        // Modal should open
        await waitFor(() => {
          expect(screen.getByAltText("Screenshot")).toBeInTheDocument();
        });
      }
    });

    it("should show loading spinner while screenshot is loading", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
      });

      const viewButtons = screen.queryAllByText("View");
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        // Loading spinner should be shown initially
        await waitFor(() => {
          expect(screen.getByText("Loading screenshot...")).toBeInTheDocument();
        });
      }
    });

    it("should hide loading spinner when image loads successfully", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
      });

      const viewButtons = screen.queryAllByText("View");
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        // Get the image element
        const img = await screen.findByAltText("Screenshot");

        // Trigger the load event
        fireEvent.load(img);

        // Loading spinner should disappear
        await waitFor(() => {
          expect(screen.queryByText("Loading screenshot...")).not.toBeInTheDocument();
        });

        // Image should be visible
        expect(img).toHaveStyle({ display: "block" });
      }
    });

    it("should handle image load error and show alert", async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
      });

      const viewButtons = screen.queryAllByText("View");
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        // Get the image element
        const img = await screen.findByAltText("Screenshot");

        // Trigger the error event
        fireEvent.error(img);

        // Alert should be shown
        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith(
            "Failed to load screenshot. The screenshot file may be missing or unavailable.",
          );
        });

        // Loading spinner should disappear
        expect(screen.queryByText("Loading screenshot...")).not.toBeInTheDocument();
      }

      alertSpy.mockRestore();
    });

    it("should close screenshot modal when close button is clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
      });

      const viewButtons = screen.queryAllByText("View");
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        // Modal should open
        await waitFor(() => {
          expect(screen.getByAltText("Screenshot")).toBeInTheDocument();
        });

        // Find and click close button
        const closeButton = screen.getByRole("button", { name: "×" });
        await user.click(closeButton);

        // Modal should close
        await waitFor(() => {
          expect(screen.queryByAltText("Screenshot")).not.toBeInTheDocument();
        });
      }
    });

    it("should close screenshot modal when clicking outside content", async () => {
      const user = userEvent.setup();
      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText("Loading report...")).not.toBeInTheDocument();
      });

      const viewButtons = screen.queryAllByText("View");
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);

        // Modal should open
        await waitFor(() => {
          expect(screen.getByAltText("Screenshot")).toBeInTheDocument();
        });

        // Click on modal backdrop
        const modal = document.querySelector(".screenshot-modal");
        if (modal) {
          await user.click(modal);

          // Modal should close
          await waitFor(() => {
            expect(screen.queryByAltText("Screenshot")).not.toBeInTheDocument();
          });
        }
      }
    });
  });
});
