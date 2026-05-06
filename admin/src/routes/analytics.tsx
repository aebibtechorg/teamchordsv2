import { type ComponentType, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { BarChart3, Database, Users2, Wallet } from "lucide-react"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import {
  loadAdminAnalytics,
  loadAdminSummary,
  type AdminAnalytics,
  type AdminAnalyticsBreakdownItem,
  type AdminAnalyticsTrendPoint,
  type AdminSummary,
} from "@/lib/admin-api"

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [summaryData, analyticsData] = await Promise.all([loadAdminSummary(), loadAdminAnalytics()])
        if (!cancelled) {
          setSummary(summaryData)
          setAnalytics(analyticsData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load analytics.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminShell title="Analytics" description="High-level platform trends and reporting">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Organizations" value={loading ? "—" : summary?.organizationCount ?? 0} icon={BarChart3} />
          <StatCard label="Users" value={loading ? "—" : summary?.userCount ?? 0} icon={Users2} />
          <StatCard label="Paid orgs" value={loading ? "—" : summary?.paidOrganizationCount ?? 0} icon={Wallet} />
          <StatCard label="Active subscriptions" value={loading ? "—" : summary?.activeSubscriptionCount ?? 0} icon={Database} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <SectionHeading
              eyebrow="Reporting"
              title="Six-month growth trend"
              description="Monthly creation counts for organizations, users, and membership links."
            />

            <div className="mt-6 space-y-6">
              <TrendChart label="Organizations created" points={analytics?.organizationGrowth ?? []} loading={loading} />
              <TrendChart label="Users created" points={analytics?.userGrowth ?? []} loading={loading} />
              <TrendChart label="Memberships created" points={analytics?.membershipGrowth ?? []} loading={loading} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <SectionHeading
                eyebrow="Billing"
                title="Plan mix"
                description="How organizations are distributed across TeamChords billing plans."
              />
              <div className="mt-6">
                <BreakdownList items={analytics?.planBreakdown ?? []} loading={loading} />
              </div>
            </div>

            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <SectionHeading
                eyebrow="Subscriptions"
                title="Status mix"
                description="Subscription state across all organizations."
              />
              <div className="mt-6">
                <BreakdownList items={analytics?.subscriptionBreakdown ?? []} loading={loading} />
              </div>
            </div>

            <div className="rounded-xl border bg-background p-5 shadow-sm">
              <SectionHeading
                eyebrow="Metadata"
                title="Report freshness"
                description="The backend includes a generated timestamp so operators know when analytics were last refreshed."
              />
              <p className="mt-4 text-sm text-muted-foreground">
                {loading
                  ? "Loading analytics snapshot…"
                  : analytics?.generatedAt
                    ? `Last generated ${new Date(analytics.generatedAt).toLocaleString()}`
                    : "Analytics snapshot not available."}
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

function TrendChart({
  label,
  points,
  loading,
}: {
  label: string
  points: Array<AdminAnalyticsTrendPoint>
  loading: boolean
}) {
  const maxValue = Math.max(...points.map((point) => point.value), 1)

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{points.length} months</p>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[6rem_minmax(0,1fr)_2rem] items-center gap-3">
              <div className="h-3 rounded bg-muted/80" />
              <div className="h-2 rounded-full bg-muted/80" />
              <div className="h-3 rounded bg-muted/80" />
            </div>
          ))
        ) : points.length > 0 ? (
          points.map((point) => {
            const width = `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 8 : 0)}%`

            return (
              <div key={point.label} className="grid grid-cols-[6rem_minmax(0,1fr)_2rem] items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatMonthLabel(point.label)}</span>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/80" style={{ width }} />
                </div>
                <span className="text-right text-sm font-medium tabular-nums">{point.value}</span>
              </div>
            )
          })
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            No trend data is available yet.
          </div>
        )}
      </div>
    </div>
  )
}

function BreakdownList({
  items,
  loading,
}: {
  items: Array<AdminAnalyticsBreakdownItem>
  loading: boolean
}) {
  return (
    <div className="space-y-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="h-3 w-24 rounded bg-muted/80" />
              <div className="h-3 w-14 rounded bg-muted/80" />
            </div>
            <div className="h-2 rounded-full bg-muted/80" />
          </div>
        ))
      ) : items.length > 0 ? (
        items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">{formatEnumLabel(item.label)}</span>
              <span className="tabular-nums text-muted-foreground">
                {item.value} <span className="text-foreground">·</span> {item.percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${item.percentage}%` }} />
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          No breakdown data is available yet.
        </div>
      )}
    </div>
  )
}

function formatMonthLabel(label: string) {
  const parsed = new Date(`${label}-01T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    return label
  }

  return parsed.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

function formatEnumLabel(label: string) {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}


