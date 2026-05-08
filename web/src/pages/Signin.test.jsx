import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signinMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useAuth0: vi.fn(),
  setUserProfile: vi.fn(),
  clearUserProfile: vi.fn(),
  getProfile: vi.fn(),
  loginWithRedirect: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => signinMocks.navigate,
  };
});

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: signinMocks.useAuth0,
}));

vi.mock("../store/useProfileStore", () => ({
  useProfileStore: () => ({
    setUserProfile: signinMocks.setUserProfile,
    clearUserProfile: signinMocks.clearUserProfile,
  }),
}));

vi.mock("../utils/common", () => ({
  getProfile: signinMocks.getProfile,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.removeItem("profile");
});

async function renderSubject() {
  const { default: Signin } = await import("./Signin");
  const { MemoryRouter } = await import("react-router-dom");
  return render(
    <MemoryRouter initialEntries={["/signin"]}>
      <Signin />
    </MemoryRouter>
  );
}

describe("Signin", () => {
  it("routes members with orgs to the library", async () => {
    signinMocks.useAuth0.mockReturnValue({
      loginWithRedirect: signinMocks.loginWithRedirect,
      isAuthenticated: true,
      user: { sub: "auth0|123" },
    });
    signinMocks.getProfile.mockResolvedValue({ organizations: [{ id: "org-1" }] });

    await renderSubject();

    await waitFor(() => {
      expect(signinMocks.getProfile).toHaveBeenCalledWith("auth0|123");
      expect(signinMocks.setUserProfile).toHaveBeenCalledWith({ organizations: [{ id: "org-1" }] });
      expect(signinMocks.navigate).toHaveBeenCalledWith("/library");
    });
  });

  it("routes users without org membership to onboarding", async () => {
    signinMocks.useAuth0.mockReturnValue({
      loginWithRedirect: signinMocks.loginWithRedirect,
      isAuthenticated: true,
      user: { sub: "auth0|123" },
    });
    signinMocks.getProfile.mockResolvedValue({ organizations: [] });

    await renderSubject();

    await waitFor(() => {
      expect(signinMocks.navigate).toHaveBeenCalledWith("/onboard");
    });
  });

  it("redirects unauthenticated users to Auth0", async () => {
    signinMocks.useAuth0.mockReturnValue({
      loginWithRedirect: signinMocks.loginWithRedirect,
      isAuthenticated: false,
      user: null,
    });

    await renderSubject();

    await waitFor(() => {
      expect(signinMocks.loginWithRedirect).toHaveBeenCalledTimes(1);
    });
  });
});


