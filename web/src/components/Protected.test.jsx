import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Protected from "./Protected";

const authMocks = vi.hoisted(() => ({
  useAuth0: vi.fn(),
  setUserProfile: vi.fn(),
  clearUserProfile: vi.fn(),
  getProfile: vi.fn(),
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: authMocks.useAuth0,
}));

vi.mock("../store/useProfileStore", () => ({
  useProfileStore: () => ({
    setUserProfile: authMocks.setUserProfile,
    clearUserProfile: authMocks.clearUserProfile,
  }),
}));

vi.mock("../utils/common", () => ({
  getProfile: authMocks.getProfile,
}));

vi.mock("./SidebarLayout", () => ({
  default: ({ children }) => <div data-testid="sidebar-layout">{children}</div>,
}));

vi.mock("./ErrorBoundary", () => ({
  default: ({ children }) => <>{children}</>,
}));

vi.mock("./Spinner", () => ({
  default: () => <div data-testid="spinner" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Protected", () => {
  it("shows a spinner while the auth state is loading", () => {
    authMocks.useAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect: vi.fn(),
    });

    render(<Protected><p>Secure content</p></Protected>);

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByText(/secure content/i)).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to Auth0", async () => {
    const loginWithRedirect = vi.fn().mockResolvedValue(undefined);

    authMocks.useAuth0.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      getAccessTokenSilently: vi.fn(),
      loginWithRedirect,
    });

    render(<Protected><p>Secure content</p></Protected>);

    await waitFor(() => expect(loginWithRedirect).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
  });

  it("syncs the profile and renders protected content for authenticated users", async () => {
    const getAccessTokenSilently = vi.fn().mockResolvedValue("token");
    const loginWithRedirect = vi.fn();
    const profile = { id: "profile-123", orgId: "org-1" };

    authMocks.useAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { sub: "auth0|123" },
      getAccessTokenSilently,
      loginWithRedirect,
    });
    authMocks.getProfile.mockResolvedValue(profile);

    render(
      <Protected>
        <p>Secure content</p>
      </Protected>
    );

    await waitFor(() => expect(authMocks.getProfile).toHaveBeenCalledWith("auth0|123"));
    await waitFor(() => expect(authMocks.setUserProfile).toHaveBeenCalledWith(profile));

    expect(getAccessTokenSilently).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/secure content/i)).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-layout")).toHaveTextContent(/secure content/i);
  });
});

