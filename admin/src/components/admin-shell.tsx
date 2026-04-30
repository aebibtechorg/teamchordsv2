import { Link } from "@tanstack/react-router"
import { Building2, ChartColumnBig, CircleHelp, LayoutDashboard, LogOut, Menu, ShieldUser, X } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/lib/admin-auth"
import { cn } from "@/lib/utils"

type AdminShellProps = {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
}

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/analytics", label: "Analytics", icon: ChartColumnBig },
  { to: "/support", label: "Support", icon: CircleHelp },
]

export function AdminShell({ title, description, actions, children }: AdminShellProps) {
  const { isPlatformAdmin, isSupport, logout, roles, user } = useAdminAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const roleLabel = isPlatformAdmin ? "Platform Admin" : isSupport ? "Support" : roles[0] ?? "admin"
  const identityLabel = user?.name || user?.email || user?.id || "Authorized operator"

  useEffect(() => {
    if (!mobileNavOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-black/40"
          aria-label="Close navigation overlay"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[85vw] max-w-sm border-r border-border/70 bg-background/95 shadow-2xl backdrop-blur supports-backdrop-filter:bg-background/80 transition-transform duration-200 ease-out",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldUser className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-none">Platform Admin</p>
                  <p className="mt-1 text-xs text-muted-foreground">TeamChords operator console</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-col items-start gap-0.5 rounded-full border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span className="uppercase tracking-[0.12em]">{roleLabel}</span>
              <span className="max-w-full truncate text-foreground">{identityLabel}</span>
            </div>
          </div>

          <nav className="space-y-1 overflow-y-auto p-3">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeProps={{ className: "bg-primary text-primary-foreground shadow-sm" }}
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Support workflow</p>
            <p className="mt-1 leading-relaxed">
              Support cases should be handed off to the customer app first, then escalated if needed.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-0">
          <header className="border-b bg-background/80 px-5 py-4 backdrop-blur supports-backdrop-filter:bg-background/70 lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
                      <Menu className="size-4" />
                    </Button>
                    <p className="truncate text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Platform Admin
                    </p>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                  {description ? <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{description}</h1> : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                  <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="p-5 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className={cn("space-y-1")}>
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p> : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
