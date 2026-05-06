import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import type { ReactNode } from "react"
import React from "react"

vi.mock("@tanstack/react-router", async () => {
  return {
    Link: ({ to, children, ...props }: { to: string; children: ReactNode; [key: string]: unknown }) =>
      React.createElement("a", { href: to, ...props }, children),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})




