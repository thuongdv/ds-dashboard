import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("should render header with title", () => {
    render(<Header title="Test Dashboard" />);

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
  });

  it("should render header with title and subtitle", () => {
    render(<Header title="Test Dashboard" subtitle="Testing Overview" />);

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Testing Overview")).toBeInTheDocument();
  });

  it("should render header without subtitle", () => {
    render(<Header title="Test Dashboard" />);

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Testing Overview")).not.toBeInTheDocument();
  });

  it("should render actions in header", () => {
    render(
      <Header
        title="Test Dashboard"
        actions={
          <button type="button" data-testid="test-action">
            Test Action
          </button>
        }
      />,
    );

    expect(screen.getByTestId("test-action")).toBeInTheDocument();
    expect(screen.getByText("Test Action")).toBeInTheDocument();
  });

  it("should display current date", () => {
    render(<Header title="Test Dashboard" />);

    const dateElement = screen.getByText(/\w{3}, \w{3} \d{1,2}, \d{4}/);
    expect(dateElement).toBeInTheDocument();
  });

  it("should display date icon", () => {
    render(<Header title="Test Dashboard" />);

    expect(screen.getByText("📅")).toBeInTheDocument();
  });

  it("should format date correctly", () => {
    render(<Header title="Test Dashboard" />);

    const dateElement = screen.getByText(/\w{3}, \w{3} \d{1,2}, \d{4}/);
    expect(dateElement).toBeInTheDocument();
    expect(dateElement.textContent).toMatch(/\d{4}/); // Should contain year
  });

  it("should render multiple actions", () => {
    render(
      <Header
        title="Test Dashboard"
        actions={
          <>
            <button type="button" data-testid="action-1">
              Action 1
            </button>
            <button type="button" data-testid="action-2">
              Action 2
            </button>
          </>
        }
      />,
    );

    expect(screen.getByTestId("action-1")).toBeInTheDocument();
    expect(screen.getByTestId("action-2")).toBeInTheDocument();
  });

  it("should have correct header structure with title section", () => {
    const { container } = render(<Header title="Test Dashboard" subtitle="Testing Overview" />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky", "top-0");
  });

  it("should have correct header structure with actions section", () => {
    const { container } = render(<Header title="Test Dashboard" actions={<button>Test</button>} />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test" })).toBeInTheDocument();
  });

  it("should apply header CSS classes correctly", () => {
    const { container } = render(<Header title="Test Dashboard" />);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("sticky", "top-0", "z-40", "w-full", "bg-white");
    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
    expect(screen.getByText("📅")).toBeInTheDocument();
  });
});
