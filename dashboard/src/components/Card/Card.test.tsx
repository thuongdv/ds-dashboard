import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, StatCard } from "./Card";

describe("Card", () => {
  it("should render card with title and children", () => {
    render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>,
    );

    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("should render card without title", () => {
    render(
      <Card>
        <p>Card content only</p>
      </Card>,
    );

    expect(screen.getByText("Card content only")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <Card className="custom-class">
        <p>Content</p>
      </Card>,
    );

    const card = container.querySelector(".card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("custom-class");
  });

  it("should render actions in card header", () => {
    render(
      <Card title="Test Card" actions={<button type="button">Action</button>}>
        <p>Content</p>
      </Card>,
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("should render only actions without title", () => {
    render(
      <Card actions={<button type="button">Action</button>}>
        <p>Content</p>
      </Card>,
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});

describe("StatCard", () => {
  it("should render stat card with basic props", () => {
    render(<StatCard icon="📊" label="Total Tests" value={100} />);

    expect(screen.getByText("📊")).toBeInTheDocument();
    expect(screen.getByText("Total Tests")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("should render stat card with string value", () => {
    render(<StatCard icon="✅" label="Pass Rate" value="95.5%" />);

    expect(screen.getByText("95.5%")).toBeInTheDocument();
  });

  it("should render stat card with trend", () => {
    render(
      <StatCard
        icon="📈"
        label="Success Rate"
        value="90%"
        trend={{
          value: "5% increase",
          isPositive: true,
        }}
      />,
    );

    expect(screen.getByText("5% increase")).toBeInTheDocument();
    expect(screen.getByText("↑")).toBeInTheDocument();
  });

  it("should render stat card with negative trend", () => {
    render(
      <StatCard
        icon="📉"
        label="Failures"
        value={10}
        trend={{
          value: "3 more",
          isPositive: false,
        }}
      />,
    );

    expect(screen.getByText("3 more")).toBeInTheDocument();
    expect(screen.getByText("↓")).toBeInTheDocument();
  });

  it("should apply correct color class", () => {
    const { container: blueContainer } = render(<StatCard icon="📊" label="Test" value={100} color="blue" />);
    expect(blueContainer.querySelector(".bg-blue-50")).toBeInTheDocument();

    const { container: greenContainer } = render(<StatCard icon="✅" label="Test" value={100} color="green" />);
    expect(greenContainer.querySelector(".bg-green-50")).toBeInTheDocument();

    const { container: redContainer } = render(<StatCard icon="❌" label="Test" value={100} color="red" />);
    expect(redContainer.querySelector(".bg-red-50")).toBeInTheDocument();

    const { container: yellowContainer } = render(<StatCard icon="⚠️" label="Test" value={100} color="yellow" />);
    expect(yellowContainer.querySelector(".bg-yellow-50")).toBeInTheDocument();
  });

  it("should default to blue color", () => {
    const { container } = render(<StatCard icon="📊" label="Test" value={100} />);
    expect(container.querySelector(".bg-blue-50")).toBeInTheDocument();
  });

  it("should render without trend", () => {
    const { container } = render(<StatCard icon="📊" label="Test" value={100} />);
    expect(container.querySelector(".stat-trend")).not.toBeInTheDocument();
  });
});
