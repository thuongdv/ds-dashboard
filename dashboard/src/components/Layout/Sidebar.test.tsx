import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("should render sidebar with title and subtitle", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Automated Testing")).toBeInTheDocument();
  });

  it("should render all navigation items", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Flaky Tests")).toBeInTheDocument();
    expect(screen.getByText("Queue History")).toBeInTheDocument();
  });

  it("should render navigation icons", () => {
    const mockOnViewChange = vi.fn();
    const { container } = render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    // Check for SVG icons instead of emojis
    const svgIcons = container.querySelectorAll("svg");
    expect(svgIcons).toHaveLength(3);
  });

  it("should highlight active view (summary)", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const summaryButton = screen.getByText("Summary").closest("button");
    expect(summaryButton).toHaveClass("bg-gray-200/70");
  });

  it("should highlight active view (flaky)", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="flaky" onViewChange={mockOnViewChange} />);

    const flakyButton = screen.getByText("Flaky Tests").closest("button");
    expect(flakyButton).toHaveClass("bg-gray-200/70");
  });

  it("should highlight active view (pods)", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="pods" onViewChange={mockOnViewChange} />);

    const podsButton = screen.getByText("Queue History").closest("button");
    expect(podsButton).toHaveClass("bg-gray-200/70");
  });

  it("should call onViewChange when Summary is clicked", async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="flaky" onViewChange={mockOnViewChange} />);

    const summaryButton = screen.getByText("Summary").closest("button");
    await user.click(summaryButton!);

    expect(mockOnViewChange).toHaveBeenCalledWith("summary");
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it("should call onViewChange when Flaky Tests is clicked", async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const flakyButton = screen.getByText("Flaky Tests").closest("button");
    await user.click(flakyButton!);

    expect(mockOnViewChange).toHaveBeenCalledWith("flaky");
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it("should call onViewChange when Queue History is clicked", async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const podsButton = screen.getByText("Queue History").closest("button");
    await user.click(podsButton!);

    expect(mockOnViewChange).toHaveBeenCalledWith("pods");
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it("should not apply active class to inactive items", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const flakyButton = screen.getByText("Flaky Tests").closest("button");
    const podsButton = screen.getByText("Queue History").closest("button");

    expect(flakyButton).not.toHaveClass("bg-gray-200/70");
    expect(podsButton).not.toHaveClass("bg-gray-200/70");
  });

  it("should render footer with copyright text", () => {
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    expect(screen.getByText("© 2025 Test Utilities")).toBeInTheDocument();
  });

  it("should have correct sidebar structure", () => {
    const mockOnViewChange = vi.fn();
    const { container } = render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    expect(container.querySelector("aside")).toBeInTheDocument();
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("should render navigation list", () => {
    const mockOnViewChange = vi.fn();
    const { container } = render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const navList = container.querySelector("ul");
    expect(navList).toBeInTheDocument();
    expect(navList?.querySelectorAll("li")).toHaveLength(3);
  });

  it("should allow clicking on currently active view", async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const summaryButton = screen.getByText("Summary").closest("button");
    await user.click(summaryButton!);

    // Should still call the handler even if already active
    expect(mockOnViewChange).toHaveBeenCalledWith("summary");
  });

  it("should handle rapid view changes", async () => {
    const user = userEvent.setup();
    const mockOnViewChange = vi.fn();
    render(<Sidebar activeView="summary" onViewChange={mockOnViewChange} />);

    const flakyButton = screen.getByText("Flaky Tests").closest("button");
    const podsButton = screen.getByText("Queue History").closest("button");

    await user.click(flakyButton!);
    await user.click(podsButton!);

    expect(mockOnViewChange).toHaveBeenCalledTimes(2);
    expect(mockOnViewChange).toHaveBeenNthCalledWith(1, "flaky");
    expect(mockOnViewChange).toHaveBeenNthCalledWith(2, "pods");
  });
});
