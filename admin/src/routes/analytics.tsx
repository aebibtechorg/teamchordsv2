import { type ComponentType, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { BarChart3, Users2, Wallet } from "lucide-react"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import { loadAdminSummary, type AdminSummary } from "@/lib/admin-api"

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const data = await loadAdminSummary()
        if (!cancelled) {
          setSummary(data)
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
    <AdminShell title="Analytics" description="High-level platform trends and reporting placeholders">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Organizations" value={loading ? "—" : summary?.organizationCount ?? 0} icon={BarChart3} />
          <StatCard label="Users" value={loading ? "—" : summary?.userCount ?? 0} icon={Users2} />
          <StatCard label="Paid orgs" value={loading ? "—" : summary?.paidOrganizationCount ?? 0} icon={Wallet} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <SectionHeading
              eyebrow="Reporting"
              title="Usage trends"
              description="Add charts here once the backend exposes aggregated platform metrics."
            />
            <div className="mt-6 flex h-56 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
              Chart placeholder
            </div>
          </div>

          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <SectionHeading
              eyebrow="Notes"
              title="Analytics roadmap"
              description="This page is ready for server-driven metrics, but the first pass keeps the shell and summary intact."
            />
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>• Subscription conversion and churn</li>
              <li>• Organization growth over time</li>
              <li>• Active operator support volume</li>
              <li>• Member/admin ratios by organization</li>
            </ul>
          </div>
        </section>
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


