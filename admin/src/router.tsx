import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { adminUrlRewrite } from "@/lib/admin-url"

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    rewrite: adminUrlRewrite,

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
