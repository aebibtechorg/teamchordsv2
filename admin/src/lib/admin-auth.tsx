import { Auth0Provider, useAuth0 } from "@auth0/auth0-react"
import { Loader2, LogOut, ShieldAlert } from "lucide-react"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { AppState } from "@auth0/auth0-react"
import type { ReactNode } from "react"

import {
  loadAdminBootstrap,
  loadAdminSession,
  type AdminUserProfile,
  type AdminBootstrap,
  type AdminSession,
} from "@/lib/admin-api"
import { adminApiState } from "@/lib/api"
import { getAdminPublicPath, getAdminPublicUrl } from "@/lib/admin-url"

type AdminAuthContextValue = {
  bootstrap: AdminBootstrap
  session: AdminSession
  roles: string[]
  isPlatformAdmin: boolean
  isSupport: boolean
  user: AdminUserProfile | null
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }

  return context
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    let cancelled = false

    const run = async () => {
      try {
        const data = await loadAdminBootstrap()
        if (!cancelled) {
          setBootstrap(data)
        }
      } catch (error) {
        if (!cancelled) {
          setBootstrapError(error instanceof Error ? error.message : "Unable to load admin bootstrap.")
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [isMounted])

  if (bootstrapError) {
    return <AdminErrorScreen title="Admin portal unavailable" message={bootstrapError} />
  }

  if (!isMounted || !bootstrap) {
    return <AdminLoadingScreen label="Loading admin portal…" />
  }

  if (!bootstrap.auth0Domain || !bootstrap.auth0ClientId || !bootstrap.auth0Audience) {
    return (
      <AdminErrorScreen
        title="Admin Auth0 configuration missing"
        message="The admin portal needs Auth0 domain, client id, and audience values from /api/admin/config."
      />
    )
  }

  const redirectUri = getAdminPublicUrl("/dashboard")
  const onRedirectCallback = (appState: AppState | undefined) => {
    const returnTo = appState?.returnTo || getAdminPublicPath("/dashboard")
    window.history.replaceState({}, document.title, returnTo)
  }

  return (
    <Auth0Provider
      domain={bootstrap.auth0Domain}
      clientId={bootstrap.auth0ClientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: bootstrap.auth0Audience,
      }}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      <AdminAuthSession bootstrap={bootstrap}>{children}</AdminAuthSession>
    </Auth0Provider>
  )
}

function AdminAuthSession({ bootstrap, children }: { bootstrap: AdminBootstrap; children: ReactNode }) {
  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, logout, user: auth0User } = useAuth0()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const loginRequested = useRef(false)
  const isAuth0Callback = typeof window !== "undefined" && new URL(window.location.href).searchParams.has("code")
  const isLogoutLanding = typeof window !== "undefined" && new URL(window.location.href).searchParams.get("logged_out") === "1"
  const logoutReturnTo = typeof window !== "undefined"
    ? (() => {
        const url = new URL(getAdminPublicUrl("/dashboard"))
        url.searchParams.set("logged_out", "1")
        return url.toString()
      })()
    : getAdminPublicUrl("/dashboard")

  useEffect(() => {
    if (!isAuthenticated) {
      adminApiState.tokenProvider = null
      return
    }

    adminApiState.tokenProvider = async () => {
      return await getAccessTokenSilently({
        authorizationParams: {
          audience: bootstrap.auth0Audience || undefined,
        },
      })
    }

    return () => {
      adminApiState.tokenProvider = null
    }
  }, [bootstrap.auth0Audience, getAccessTokenSilently, isAuthenticated])

  useEffect(() => {
    if (isLoading || isAuth0Callback) return

    if (!isAuthenticated) {
      setSession(null)
      setSessionLoading(false)

      if (isLogoutLanding) {
        return
      }

      if (!loginRequested.current && typeof window !== "undefined") {
        loginRequested.current = true
        void loginWithRedirect({
          appState: {
            returnTo: `${window.location.pathname}${window.location.search}`,
          },
        })
      }

      return
    }

    loginRequested.current = false

    let cancelled = false

    const run = async () => {
      setSessionLoading(true)
      setSessionError(null)

      try {
        const data = await loadAdminSession()
        if (!cancelled) {
          setSession(data)
        }
      } catch (error) {
        if (!cancelled) {
          setSessionError(error instanceof Error ? error.message : "Unable to verify admin access.")
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isAuth0Callback, isLoading, loginWithRedirect])

  const roles = useMemo(() => {
    return (session?.roles || []).map((role) => role.toLowerCase())
  }, [session?.roles])

  const isPlatformAdmin = roles.includes("platform-admin")
  const isSupport = roles.includes("support")
  const hasAccess = isPlatformAdmin || isSupport
  const effectiveUser = useMemo<AdminUserProfile | null>(() => {
    if (session?.user) {
      return session.user
    }

    if (!auth0User) {
      return null
    }

    return {
      id: auth0User.sub || auth0User.email || "admin-user",
      email: auth0User.email ?? null,
      emailVerified: auth0User.email_verified ?? null,
      auth0UserId: auth0User.sub ?? null,
      name: auth0User.name ?? auth0User.nickname ?? auth0User.email ?? auth0User.sub ?? null,
      givenName: auth0User.given_name ?? null,
      familyName: auth0User.family_name ?? null,
      picture: auth0User.picture ?? null,
      createdAt: null,
      updatedAt: null,
    }
  }, [auth0User, session?.user])

  const contextValue = useMemo<AdminAuthContextValue | null>(() => {
    if (!session || !hasAccess) return null

    return {
      bootstrap,
      session,
      roles,
      isPlatformAdmin,
      isSupport,
      user: effectiveUser,
      logout: () => logout({ logoutParams: { returnTo: logoutReturnTo } }),
    }
  }, [bootstrap, effectiveUser, hasAccess, isPlatformAdmin, isSupport, logout, logoutReturnTo, roles, session])

  if (isLoading || (sessionLoading && !isLogoutLanding)) {
    return <AdminLoadingScreen label="Checking admin access…" />
  }

  if (sessionError) {
    return <AdminErrorScreen title="Access check failed" message={sessionError} />
  }

  if (!isAuthenticated) {
    if (isLogoutLanding) {
      return (
        <AdminSignedOutScreen
          onSignIn={() =>
            loginWithRedirect({
              appState: {
                returnTo: getAdminPublicPath("/dashboard"),
              },
            })
          }
        />
      )
    }

    return <AdminLoadingScreen label="Redirecting to Auth0…" />
  }

  if (!contextValue) {
    return (
      <AdminErrorScreen
        title="You don’t have access to the admin portal"
        message="This portal is restricted to platform-admin and support roles."
        action={
          <button
            type="button"
            onClick={() => logout({ logoutParams: { returnTo: logoutReturnTo } })}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        }
      />
    )
  }

  return <AdminAuthContext.Provider value={contextValue}>{children}</AdminAuthContext.Provider>
}

function AdminLoadingScreen({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-6 text-foreground">
      <div className="flex items-center gap-3 rounded-xl border bg-background px-5 py-4 shadow-sm">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </main>
  )
}

function AdminErrorScreen({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-6 text-foreground">
      <div className="max-w-lg rounded-xl border bg-background p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        {action ? <div className="mt-5 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </main>
  )
}

function AdminSignedOutScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-6 text-foreground">
      <div className="max-w-lg rounded-xl border bg-background p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">You are signed out</h1>
          <p className="text-sm text-muted-foreground">Your session ended successfully. Sign back in to continue in the admin portal.</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <ShieldAlert className="size-4" />
            Sign in again
          </button>
        </div>
      </div>
    </main>
  )
}







