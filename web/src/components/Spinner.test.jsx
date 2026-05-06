import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Spinner from "./Spinner";

describe("Spinner", () => {
  it("announces loading and shows the hidden logo", () => {
    const { container } = render(<Spinner />);

    expect(screen.getByRole("status", { name: /loading team chords/i })).toBeInTheDocument();
    expect(screen.getByText(/loading team chords/i)).toHaveClass("sr-only");
    expect(container.querySelector('img[aria-hidden="true"]')).toBeInTheDocument();
  });
});

