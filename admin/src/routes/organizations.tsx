import { useEffect, useMemo, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowRight, Search } from "lucide-react"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { loadOrganizations, type AdminOrganization } from "@/lib/admin-api"

export const Route = createFileRoute("/organizations")({
  component: OrganizationsPage,
})

function OrganizationsPage() {
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState("")
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const normalizedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await loadOrganizations({
          name: normalizedQuery || undefined,
          page: 1,
          pageSize: 50,
          sortBy: "createdAt",
          sortDir: "desc",
        })

        if (!cancelled) {
          setOrganizations(response.items)
          setTotal(response.total)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load organizations.")
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
  }, [normalizedQuery])

  return (
    <AdminShell
      title="Organizations"
      description="Review org ownership, billing state, and membership counts"
      actions={
        <Button variant="outline" asChild>
          <Link to="/analytics">Open analytics</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-xl border bg-background p-4 shadow-sm">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              setQuery(draft)
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search by organization name"
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </section>

        <section className="rounded-xl border bg-background shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
            <SectionHeading
              eyebrow="Inventory"
              title={loading ? "Loading organizations…" : `${total} organizations`}
              description="Each row links to deeper detail and members."
            />
            <p className="text-sm text-muted-foreground">Showing up to 50 records</p>
          </div>

          {error ? (
            <div className="p-5 text-sm text-destructive">{error}</div>
          ) : null}

          {!error && organizations.length === 0 && !loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No organizations matched this search.</div>
          ) : null}

          <div className="divide-y">
            {organizations.map((organization) => (
              <article key={organization.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{organization.name || "Untitled organization"}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {organization.plan}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {organization.subscriptionStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {organization.memberCount} members · {organization.adminCount} admins · created {new Date(organization.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/organizations/$organizationId" params={{ organizationId: organization.id }}>
                      Details
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/organizations/$organizationId/members" params={{ organizationId: organization.id }}>
                      Members
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  )
}

