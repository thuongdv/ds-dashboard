import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PodsQueueData } from "./PodsQueueData";

// Mock XLSX
vi.mock("xlsx-republish", () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

// Mock dws-queues.json
vi.mock("../../../dws-queues.json", () => ({
  default: [
    {
      name: "01.) JDEdwards Finance",
      standardName: "FIN",
      storeStatusFile: "fin-queue-ids-tracker.txt",
    },
    {
      name: "02.) JDEdwards Sales & Distribution",
      standardName: "SD",
      storeStatusFile: "sd-queue-ids-tracker.txt",
    },
  ],
}));

describe("PodsQueueData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render queue cards after loading", async () => {
    render(<PodsQueueData />);

    await waitFor(
      () => {
        expect(screen.queryByText("Loading queue data...")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Should render cards for queues (even if "No data available")
    const cards = document.querySelectorAll(".stat-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("should display 'No data available' when queue has no results", async () => {
    render(<PodsQueueData />);

    await waitFor(
      () => {
        expect(screen.queryByText("Loading queue data...")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Should show "No data available" when files don't exist
    const noDataElements = screen.queryAllByText("No data available");
    expect(noDataElements.length).toBeGreaterThan(0);
  });

  it("should handle error loading queue data gracefully", async () => {
    // Suppress expected error logs
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<PodsQueueData />);

    await waitFor(
      () => {
        expect(screen.queryByText("Loading queue data...")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Should not crash and should render something
    const cards = document.querySelectorAll(".stat-card");
    expect(cards.length).toBeGreaterThan(0);

    consoleErrorSpy.mockRestore();
  });

  it("should have correct component structure", async () => {
    render(<PodsQueueData />);

    await waitFor(
      () => {
        expect(screen.queryByText("Loading queue data...")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    const statsGrid = document.querySelector(".stats-grid");
    expect(statsGrid).toBeInTheDocument();
  });
});
