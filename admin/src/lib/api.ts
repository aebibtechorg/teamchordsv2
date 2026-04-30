export const adminApiState: {
  tokenProvider: (() => Promise<string | null>) | null
} = {
  tokenProvider: null,
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {})

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (adminApiState.tokenProvider) {
    try {
      const token = await adminApiState.tokenProvider()
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`)
      }
    } catch (error) {
      console.warn("admin token provider failed", error)
    }
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(input, {
    credentials: "same-origin",
    ...init,
    headers,
  })
}


