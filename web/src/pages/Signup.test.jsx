import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signupMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useAuth0: vi.fn(),
  loginWithRedirect: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => signupMocks.navigate,
  };
});

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: signupMocks.useAuth0,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderSubject() {
  const { default: Signup } = await import("./Signup");
  const { MemoryRouter } = await import("react-router-dom");
  return render(
    <MemoryRouter initialEntries={["/signup?e=invitee%40example.com&inviteId=invite-123"]}>
      <Signup />
    </MemoryRouter>
  );
}

describe("Signup", () => {
  it("redirects unauthenticated users to Auth0 signup with invite context", async () => {
    signupMocks.useAuth0.mockReturnValue({
      loginWithRedirect: signupMocks.loginWithRedirect,
      isAuthenticated: false,
      isLoading: false,
    });

    await renderSubject();

    await waitFor(() => {
      expect(signupMocks.loginWithRedirect).toHaveBeenCalledTimes(1);
      expect(signupMocks.loginWithRedirect).toHaveBeenCalledWith({
        authorizationParams: {
          screen_hint: "signup",
          login_hint: "invitee@example.com",
          inviteId: "invite-123",
        },
      });
    });
  });
});


