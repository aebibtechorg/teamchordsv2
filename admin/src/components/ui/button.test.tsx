import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"

describe("Button", () => {
  it("renders the default button variant", () => {
    render(<Button>Save changes</Button>)

    const button = screen.getByRole("button", { name: /save changes/i })

    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveAttribute("data-size", "default")
  })

  it("supports the asChild composition pattern", () => {
    render(
      <Button asChild variant="outline" size="sm">
        <a href="/dashboard">Dashboard</a>
      </Button>
    )

    const link = screen.getByRole("link", { name: /dashboard/i })

    expect(link).toHaveAttribute("href", "/dashboard")
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link).toHaveAttribute("data-variant", "outline")
    expect(link).toHaveAttribute("data-size", "sm")
  })
})

