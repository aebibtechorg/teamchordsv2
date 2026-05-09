import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RootRedirect } from "./router";

const routerMocks = vi.hoisted(() => ({
  useAuth0: vi.fn(),
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: routerMocks.useAuth0,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate-target" data-to={to} />,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RootRedirect", () => {
  it("routes signed-out users to signin", async () => {
    routerMocks.useAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(<RootRedirect />);

    expect(screen.getByTestId("navigate-target")).toHaveAttribute("data-to", "/signin");
  });

  it("routes signed-in users to library", async () => {
    routerMocks.useAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(<RootRedirect />);

    expect(screen.getByTestId("navigate-target")).toHaveAttribute("data-to", "/library");
  });
});
