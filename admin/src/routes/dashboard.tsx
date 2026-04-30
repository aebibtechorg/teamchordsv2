import { type ComponentType, useEffect, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight, Building2, Database, Users } from "lucide-react"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { loadAdminSummary, type AdminSummary } from "@/lib/admin-api"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await loadAdminSummary()
        if (!cancelled) {
          setSummary(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard summary.")
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
    <AdminShell
      title="Dashboard"
      description="Platform health and operator overview"
      actions={
        <Button asChild>
          <Link to="/organizations">
            View organizations
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Organizations"
            value={loading ? "—" : summary?.organizationCount ?? 0}
            icon={Building2}
          />
          <MetricCard
            label="Active subscriptions"
            value={loading ? "—" : summary?.activeSubscriptionCount ?? 0}
            icon={Database}
          />
          <MetricCard
            label="Members"
            value={loading ? "—" : summary?.membershipCount ?? 0}
            icon={Users}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <SectionHeading
              eyebrow="Operations"
              title="What should operators do next?"
              description="Use the left rail to jump between organization management, analytics, and support handoff."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <QuickAction
                title="Review organizations"
                description="Inspect billing state, member counts, and ownership."
                to="/organizations"
              />
              <QuickAction
                title="Open support handoff"
                description="Send operators into the existing customer support workflow first."
                to="/support"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <SectionHeading
              eyebrow="Snapshot"
              title="Platform totals"
              description="Numbers come from the admin summary endpoint."
            />
            <dl className="mt-6 space-y-4 text-sm">
              <SummaryRow label="Paid organizations" value={loading ? "—" : summary?.paidOrganizationCount ?? 0} />
              <SummaryRow label="Users" value={loading ? "—" : summary?.userCount ?? 0} />
              <SummaryRow label="Admin memberships" value={loading ? "—" : summary?.adminMembershipCount ?? 0} />
            </dl>
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

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  title,
  description,
  to,
}: {
  title: string
  description: string
  to: string
}) {
  return (
    <Link to={to} className="rounded-xl border p-4 transition hover:border-primary hover:bg-muted/50">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}


