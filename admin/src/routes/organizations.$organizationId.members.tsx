import { useEffect, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { loadOrganizationMembers, type AdminMember } from "@/lib/admin-api"

export const Route = createFileRoute("/organizations/$organizationId/members")({
  component: OrganizationMembersPage,
})

function OrganizationMembersPage() {
  const { organizationId } = Route.useParams()
  const [members, setMembers] = useState<AdminMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await loadOrganizationMembers(organizationId, {
          page: 1,
          pageSize: 100,
          sortBy: "joinedAt",
          sortDir: "desc",
        })

        if (!cancelled) {
          setMembers(response.items)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load members.")
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
      title="Organization members"
      description={organizationId}
      actions={
        <Button variant="outline" asChild>
          <Link to="/organizations/$organizationId" params={{ organizationId }}>
            View organization
          </Link>
        </Button>
      }
    >
      <section className="rounded-xl border bg-background p-5 shadow-sm">
        <SectionHeading
          eyebrow="Members"
          title={loading ? "Loading members…" : `${members.length} members`}
          description="This page mirrors the organization membership endpoint."
        />

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        {!error && members.length === 0 && !loading ? (
          <p className="mt-4 text-sm text-muted-foreground">No members were returned for this organization.</p>
        ) : null}

        <div className="mt-4 divide-y">
          {members.map((member) => (
            <article key={member.userId} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium">{member.name || member.email || member.userId}</p>
                <p className="text-sm text-muted-foreground">{member.email || "No email on file"}</p>
              </div>
              <div className="text-sm text-muted-foreground sm:text-right">
                <p>{member.role}</p>
                <p>Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  )
}

