import { beforeEach, describe, expect, it, vi } from "vitest";

describe("useProfileStore", () => {
  beforeEach(() => {
    localStorage.removeItem("profile");
    vi.resetModules();
  });

  it("hydrates profile state from localStorage", async () => {
    const storedProfile = { id: "profile-1", orgId: "org-1" };
    localStorage.setItem("profile", JSON.stringify(storedProfile));

    const { useProfileStore } = await import("./useProfileStore");

    expect(useProfileStore.getState().profile).toEqual(storedProfile);
  });

  it("persists profile updates and active org changes", async () => {
    const { useProfileStore } = await import("./useProfileStore");

    const profile = { id: "profile-1", orgId: "org-1", name: "Ada" };
    useProfileStore.getState().setUserProfile(profile);

    expect(useProfileStore.getState().profile).toEqual(profile);
    expect(JSON.parse(localStorage.getItem("profile"))).toEqual(profile);

    useProfileStore.getState().setActiveOrg("org-2");

    expect(useProfileStore.getState().profile).toMatchObject({ orgId: "org-2" });
    expect(JSON.parse(localStorage.getItem("profile"))).toMatchObject({ orgId: "org-2" });

    useProfileStore.getState().clearUserProfile();

    expect(useProfileStore.getState().profile).toBeNull();
    expect(localStorage.getItem("profile")).toBeNull();
  });
});


