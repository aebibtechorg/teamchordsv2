import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authCallbackMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useAuth0: vi.fn(),
  setUserProfile: vi.fn(),
  clearUserProfile: vi.fn(),
  getProfile: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => authCallbackMocks.navigate,
  };
});

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: authCallbackMocks.useAuth0,
}));

vi.mock("../store/useProfileStore", () => ({
  useProfileStore: () => ({
    setUserProfile: authCallbackMocks.setUserProfile,
    clearUserProfile: authCallbackMocks.clearUserProfile,
  }),
}));

vi.mock("../utils/common", () => ({
  getProfile: authCallbackMocks.getProfile,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.removeItem("profile");
  localStorage.removeItem("pendingPlanCheckout");
});

async function renderSubject() {
  const { default: AuthCallback } = await import("./AuthCallback");
  return render(<AuthCallback />);
}

describe("AuthCallback", () => {
  it("routes authenticated users with orgs to pricing when a checkout is pending", async () => {
    authCallbackMocks.useAuth0.mockReturnValue({
      user: { sub: "auth0|123" },
      isAuthenticated: true,
      isLoading: false,
    });
    authCallbackMocks.getProfile.mockResolvedValue({ organizations: [{ id: "org-1" }] });
    localStorage.setItem("pendingPlanCheckout", "1");

    await renderSubject();

    await waitFor(() => {
      expect(authCallbackMocks.getProfile).toHaveBeenCalledWith("auth0|123");
      expect(authCallbackMocks.setUserProfile).toHaveBeenCalledWith({ organizations: [{ id: "org-1" }] });
      expect(authCallbackMocks.navigate).toHaveBeenCalledWith("/pricing?checkout=1");
    });
  });

  it("routes authenticated users without orgs to onboarding", async () => {
    authCallbackMocks.useAuth0.mockReturnValue({
      user: { sub: "auth0|123" },
      isAuthenticated: true,
      isLoading: false,
    });
    authCallbackMocks.getProfile.mockResolvedValue({ organizations: [] });

    await renderSubject();

    await waitFor(() => {
      expect(authCallbackMocks.navigate).toHaveBeenCalledWith("/onboard");
    });
  });

  it("clears the profile and sends unauthenticated users to signin", async () => {
    authCallbackMocks.useAuth0.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    await renderSubject();

    await waitFor(() => {
      expect(authCallbackMocks.clearUserProfile).toHaveBeenCalledTimes(1);
      expect(authCallbackMocks.navigate).toHaveBeenCalledWith("/signin");
    });
  });
});


