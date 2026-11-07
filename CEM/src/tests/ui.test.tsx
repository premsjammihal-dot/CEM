import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Badge, Button, EmptyState, Input } from "@/components/ui";
import { Tabs } from "@/components/data";

describe("Button", () => {
  it("fires onClick and shows a spinner while loading", () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<Button loading>Save</Button>);
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Input", () => {
  it("links label and shows validation error", () => {
    render(<Input label="Email" name="email" error="Enter a valid email address" />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address")).toBeTruthy();
  });
});

describe("Tabs", () => {
  it("marks the active tab with aria-selected", () => {
    render(<Tabs tabs={[{ id: "a", label: "Alpha", count: 2 }, { id: "b", label: "Beta" }]} active="a" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: /alpha/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: /beta/i }).getAttribute("aria-selected")).toBe("false");
  });
});

describe("Badge + EmptyState", () => {
  it("render content", () => {
    render(<Badge tone="green">Live</Badge>);
    render(<EmptyState title="Nothing here" body="Add something." />);
    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });
});
