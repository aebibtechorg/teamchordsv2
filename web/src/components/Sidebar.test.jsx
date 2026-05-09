import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";

const sidebarMocks = vi.hoisted(() => ({
  useAuth0: vi.fn(),
  clearUserProfile: vi.fn(),
}));

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: sidebarMocks.useAuth0,
}));

vi.mock("../store/useProfileStore", () => ({
  useProfileStore: () => ({
    clearUserProfile: sidebarMocks.clearUserProfile,
  }),
}));

vi.mock("./MobileSidebar", () => ({
  default: () => <div data-testid="mobile-sidebar" />,
}));

vi.mock("./OrgSelector", () => ({
  default: () => <div data-testid="org-selector" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Sidebar", () => {
  it("renders the main navigation and signs the user out", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);

    sidebarMocks.useAuth0.mockReturnValue({
      logout,
      user: { name: "Ada Lovelace", email: "ada@example.com" },
    });

    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /library/i })).toHaveAttribute("href", "/library");
    expect(screen.getByRole("link", { name: /set lists/i })).toHaveAttribute("href", "/setlists");
    expect(screen.getByRole("link", { name: /team/i })).toHaveAttribute("href", "/team");
    expect(screen.getByRole("link", { name: /billing/i })).toHaveAttribute("href", "/billing");
    expect(screen.getByRole("link", { name: /ada lovelace/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByTestId("org-selector")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-sidebar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(sidebarMocks.clearUserProfile).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith({ logoutParams: { returnTo: `${window.location.origin}/signin` } });
  });
});

