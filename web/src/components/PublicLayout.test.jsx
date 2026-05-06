import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PublicLayout from "./PublicLayout";

describe("PublicLayout", () => {
  it("renders the public navigation, footer links, and page content", () => {
    render(
      <PublicLayout>
        <p>Public page content</p>
      </PublicLayout>
    );

    expect(screen.getByRole("link", { name: /team chords/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute("href", "/privacy-policy");
    expect(screen.getByRole("link", { name: /terms & conditions/i })).toHaveAttribute("href", "/terms-and-conditions");
    expect(screen.getByRole("link", { name: /help/i })).toHaveAttribute("href", "/help");
    expect(screen.getByText(/public page content/i)).toBeInTheDocument();
  });
});

