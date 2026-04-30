import { createFileRoute } from "@tanstack/react-router"

function getApiBaseUrl() {
  const value =
    process.env.services__api__http__0 ||
    process.env.VITE_API_TARGET ||
    process.env.API_TARGET ||
    "http://localhost:5000"

  return value.endsWith("/") ? value.slice(0, -1) : value
}

function buildUpstreamUrl(request: Request, splat?: string) {
  const incomingUrl = new URL(request.url)
  const path = splat ? `/${splat}` : ""
  return `${getApiBaseUrl()}/api/admin${path}${incomingUrl.search}`
}

function buildUpstreamHeaders(request: Request) {
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")
  return headers
}

async function proxyRequest(request: Request, splat?: string) {
  const method = request.method.toUpperCase()
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer()

  const upstreamResponse = await fetch(buildUpstreamUrl(request, splat), {
    method,
    headers: buildUpstreamHeaders(request),
    body,
    redirect: "manual",
  })

  const headers = new Headers(upstreamResponse.headers)
  headers.delete("connection")
  headers.delete("transfer-encoding")

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  })
}

export const Route = createFileRoute("/api/admin/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => proxyRequest(request, params._splat),
      HEAD: ({ request, params }) => proxyRequest(request, params._splat),
      POST: ({ request, params }) => proxyRequest(request, params._splat),
      PUT: ({ request, params }) => proxyRequest(request, params._splat),
      PATCH: ({ request, params }) => proxyRequest(request, params._splat),
      DELETE: ({ request, params }) => proxyRequest(request, params._splat),
    },
  },
})


