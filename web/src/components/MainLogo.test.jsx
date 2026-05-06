import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MainLogo from "./MainLogo";

describe("MainLogo", () => {
  it("renders the logo image with the provided size and class name", () => {
    render(<MainLogo size={40} className="shadow-lg" alt="Team Chords mark" data-testid="logo" />);

    const logo = screen.getByTestId("logo");

    expect(logo).toHaveAttribute("src", "/favicon.png");
    expect(logo).toHaveAttribute("width", "40");
    expect(logo).toHaveAttribute("height", "40");
    expect(logo).toHaveClass("shadow-lg");
    expect(logo).toHaveAccessibleName("Team Chords mark");
  });
});

