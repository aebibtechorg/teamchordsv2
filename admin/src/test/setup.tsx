import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { AnchorHTMLAttributes, ReactNode } from "react"

type LinkProps = {
  to: string
  children: ReactNode
} & AnchorHTMLAttributes<HTMLAnchorElement>

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: LinkProps) => {
    const { activeProps, ...anchorProps } = props as AnchorHTMLAttributes<HTMLAnchorElement> & { activeProps?: unknown }

    return (
      <a href={to} {...anchorProps}>
      {children}
      </a>
    )
  },
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})



