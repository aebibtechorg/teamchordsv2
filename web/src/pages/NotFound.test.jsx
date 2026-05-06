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

  it("shows guest actions when the user is signed out", () => {
    notFoundMocks.useAuth0.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    });

    render(<NotFound />);

    expect(screen.getByText(/the page you're looking for doesn't exist or may have moved/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute("href", "/signup");
  });

  it("shows loading copy while auth is still resolving", () => {
    notFoundMocks.useAuth0.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
    });

    render(<NotFound />);

    expect(screen.getByText(/finding your place in team chords/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go home/i })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/that page doesn't exist, but your workspace is still just a click away/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/the page you're looking for doesn't exist or may have moved/i)).not.toBeInTheDocument();
  });
});

