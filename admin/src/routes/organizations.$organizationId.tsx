import { type ComponentType, useEffect, useMemo, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight, BadgeCheck, CalendarDays, Users } from "lucide-react"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import {
  loadOrganizationMembers,
  loadOrganizations,
  type AdminMember,
  type AdminOrganization,
} from "@/lib/admin-api"

export const Route = createFileRoute("/organizations/$organizationId")({
  component: OrganizationDetailPage,
})

function OrganizationDetailPage() {
  const { organizationId } = Route.useParams()
  const [organization, setOrganization] = useState<AdminOrganization | null>(null)
  const [members, setMembers] = useState<AdminMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const memberSummary = useMemo(() => `${members.length} loaded members`, [members.length])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const [organizations, memberResponse] = await Promise.all([
          loadOrganizations({ page: 1, pageSize: 100, sortBy: "createdAt", sortDir: "desc" }),
          loadOrganizationMembers(organizationId, { page: 1, pageSize: 100, sortBy: "joinedAt", sortDir: "desc" }),
        ])

        if (!cancelled) {
          setOrganization(organizations.items.find((item) => item.id === organizationId) ?? null)
          setMembers(memberResponse.items)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load organization detail.")
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
  }, [organizationId])

  return (
    <AdminShell
      title="Organization detail"
      description={organization?.name || organizationId}
      actions={
        <Button variant="outline" asChild>
          <Link to="/organizations">
            Back to organizations
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Plan" value={organization?.plan || (loading ? "Loading…" : "Unknown")} icon={BadgeCheck} />
          <StatCard label="Subscription" value={organization?.subscriptionStatus || (loading ? "Loading…" : "Unknown")} icon={CalendarDays} />
          <StatCard label="Members" value={loading ? "—" : organization?.memberCount ?? members.length} icon={Users} />
        </section>

        <section className="rounded-xl border bg-background p-5 shadow-sm">
          <SectionHeading
            eyebrow="Members"
            title="Current organization members"
            description={memberSummary}
          />

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          {!error && members.length === 0 && !loading ? (
            <p className="mt-4 text-sm text-muted-foreground">No members returned for this organization.</p>
          ) : null}

          <div className="mt-4 divide-y">
            {members.map((member) => (
              <article key={member.userId} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium">{member.name || member.email || member.userId}</p>
                  <p className="text-sm text-muted-foreground">{member.email || "No email on file"}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{member.role}</p>
                  <p>{new Date(member.joinedAt).toLocaleDateString()}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
          Operators should use the support handoff page first when a customer issue needs escalation, then review this organization for billing or membership context.
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


