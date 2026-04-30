export function isAdminHost(hostname: string) {
  return hostname === "admin" || hostname.startsWith("admin.")
}

export function normalizeAdminPath(pathname: string) {
  if (!pathname) return "/"
  return pathname.startsWith("/") ? pathname : `/${pathname}`
}

export function stripAdminPrefix(pathname: string) {
  const path = normalizeAdminPath(pathname)

  if (path === "/admin") {
    return "/"
  }

  if (path.startsWith("/admin/")) {
    return path.slice("/admin".length) || "/"
  }

  return path
}

export function addAdminPrefix(pathname: string) {
  const path = normalizeAdminPath(pathname)

  if (path === "/" || path === "/admin") {
    return "/admin"
  }

  if (path.startsWith("/admin/")) {
    return path
  }

  return `/admin${path}`
}

export const adminUrlRewrite = {
  input: ({ url }: { url: URL }) => {
    url.pathname = stripAdminPrefix(url.pathname)
    return url
  },
  output: ({ url }: { url: URL }) => {
    if (!isAdminHost(url.hostname)) {
      url.pathname = addAdminPrefix(url.pathname)
    }
    return url
  },
}

export function getAdminPublicPath(pathname = "/dashboard") {
  const path = normalizeAdminPath(pathname)

  if (typeof window === "undefined") {
    return addAdminPrefix(path)
  }

  return isAdminHost(window.location.hostname) ? path : addAdminPrefix(path)
}

export function getAdminPublicUrl(pathname = "/dashboard") {
  return new URL(getAdminPublicPath(pathname), typeof window === "undefined" ? "http://localhost" : window.location.origin).toString()
}

