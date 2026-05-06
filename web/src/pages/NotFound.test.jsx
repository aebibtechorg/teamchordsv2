import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotFound from "./NotFound";

const notFoundMocks = vi.hoisted(() => ({
  useAuth0: vi.fn(),
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: notFoundMocks.useAuth0,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotFound", () => {
  it("shows member actions when the user is signed in", () => {
    notFoundMocks.useAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
    });

    render(<NotFound />);

    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByText(/your workspace is still just a click away/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open library/i })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: /view set lists/i })).toHaveAttribute("href", "/setlists");
    expect(screen.getByRole("link", { name: /go to profile/i })).toHaveAttribute("href", "/profile");
  });
});

