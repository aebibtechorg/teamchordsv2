import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";

function Boom() {
  throw new Error("Boom");
}

describe("ErrorBoundary", () => {
  it("renders a recovery screen when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to library/i })).toHaveAttribute("href", "/library");

    fireEvent.click(screen.getByRole("button", { name: /show details/i }));

    expect(screen.getByText(/error details/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/i)).toBeInTheDocument();
  });
});

