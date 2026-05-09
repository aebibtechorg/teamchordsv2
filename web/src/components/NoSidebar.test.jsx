import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NoSidebar from "./NoSidebar";

const logout = vi.fn();
const clearUserProfile = vi.fn();

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({ logout }),
}));

vi.mock("../store/useProfileStore", () => ({
  useProfileStore: () => ({ clearUserProfile }),
}));

describe("NoSidebar", () => {
  it("renders its content and signs the user out", async () => {
    render(
      <NoSidebar>
        <p>Profile setup</p>
      </NoSidebar>
    );

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(clearUserProfile).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith({ logoutParams: { returnTo: `${window.location.origin}/signin` } });
    expect(screen.getByText(/profile setup/i)).toBeInTheDocument();
  });
});

