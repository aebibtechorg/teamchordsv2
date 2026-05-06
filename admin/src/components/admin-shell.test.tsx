import { render, screen, fireEvent } from "@testing-library/react"
import { within } from "@testing-library/dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdminShell, SectionHeading } from "./admin-shell"

const adminAuthMocks = vi.hoisted(() => ({
  useAdminAuth: vi.fn(),
}))

vi.mock("@/lib/admin-auth", () => ({
  useAdminAuth: adminAuthMocks.useAdminAuth,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("AdminShell", () => {
  it("renders the shell, opens navigation, and signs out", () => {
    const logout = vi.fn()

    adminAuthMocks.useAdminAuth.mockReturnValue({
      isPlatformAdmin: true,
      isSupport: false,
      logout,
      roles: ["platform-admin"],
      user: { name: "Ada Lovelace", email: "ada@example.com", id: "admin-1" },
      bootstrap: {} as never,
      session: {} as never,
    })

    const { container } = render(
      <AdminShell title="Dashboard" description="Overview" actions={<button type="button">Refresh</button>}>
        <p>Admin content</p>
      </AdminShell>
    )

    expect(screen.getByText(/overview/i)).toBeInTheDocument()
    expect(screen.getByText(/ada lovelace/i)).toBeInTheDocument()
    expect(screen.getByText(/refresh/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard")
    expect(screen.getByRole("link", { name: /organizations/i })).toHaveAttribute("href", "/organizations")

    const aside = container.querySelector("aside")
    expect(aside).toHaveClass("-translate-x-full")

    fireEvent.click(screen.getByRole("button", { name: /open navigation/i }))

    expect(aside).toHaveClass("translate-x-0")
    expect(document.body.style.overflow).toBe("hidden")

    fireEvent.click(within(aside as HTMLElement).getByRole("button", { name: /close navigation/i }))

    expect(document.body.style.overflow).not.toBe("hidden")

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/admin content/i)).toBeInTheDocument()
  })

  it("renders section headings", () => {
    render(<SectionHeading eyebrow="Reports" title="Revenue" description="Monthly totals" />)

    expect(screen.getByText(/reports/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /revenue/i })).toBeInTheDocument()
    expect(screen.getByText(/monthly totals/i)).toBeInTheDocument()
  })
})





