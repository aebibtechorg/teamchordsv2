import { type ComponentType, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ExternalLink, MessageCircleMore, Mail, ShieldAlert } from "lucide-react"

import { AdminShell, SectionHeading } from "@/components/admin-shell"
import { Button } from "@/components/ui/button"
import { getCustomerAppUrl, loadAdminBootstrap, type AdminBootstrap } from "@/lib/admin-api"

export const Route = createFileRoute("/support")({
  component: SupportPage,
})

function SupportPage() {
  const [bootstrap, setBootstrap] = useState<AdminBootstrap | null>(null)
  const [loading, setLoading] = useState(true)
  const [customerSupportUrl, setCustomerSupportUrl] = useState("/")

  useEffect(() => {
    let cancelled = false

    setCustomerSupportUrl(getCustomerAppUrl("/"))

    const run = async () => {
      setLoading(true)
      try {
        const data = await loadAdminBootstrap()
        if (!cancelled) {
          setBootstrap(data)
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

  const customerAppUrl = bootstrap?.customerAppUrl || customerSupportUrl
  const chatwootEnabled = bootstrap?.chatwoot.enabled ?? false
  const chatwootBaseUrl = bootstrap?.chatwoot.baseUrl || ""
  const supportMail = "paul@aebibtech.com"

  return (
    <AdminShell title="Support" description="Handoff operators into the customer support workflow first">
      <div className="space-y-6">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <SectionHeading
                eyebrow="Operator handoff"
                title="Use the customer app support flow first"
                description="The customer-facing app already carries the Chatwoot widget, so operators should open that workflow before escalating."
              />
              <p className="text-sm text-muted-foreground">
                This keeps the first support step in the existing customer experience instead of duplicating tools in the admin portal.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={customerAppUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open customer app
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${supportMail}?subject=Admin%20support%20escalation`}>
                  <Mail className="size-4" />
                  Email escalation
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <SupportStep
            icon={MessageCircleMore}
            title="1. Open the customer app"
            description="Use the existing Chatwoot-enabled customer experience to talk to the user in context."
          />
          <SupportStep
            icon={ShieldAlert}
            title="2. Escalate from there"
            description="Capture the issue, then hand off to the support mailbox or internal notes if needed."
          />
          <SupportStep
            icon={Mail}
            title="3. Continue off-platform"
            description="Send follow-up mail once the operator has the account and billing context."
          />
        </section>

        <section className="rounded-xl border bg-background p-5 shadow-sm">
          <SectionHeading
            eyebrow="Bootstrap"
            title={loading ? "Loading support settings…" : "Chatwoot configuration"}
            description="Read from the admin bootstrap endpoint so the support page reflects deployed settings."
          />

          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoTile label="Chatwoot enabled" value={chatwootEnabled ? "Yes" : "No"} />
            <InfoTile label="Chatwoot base URL" value={chatwootBaseUrl || "Not configured"} />
          </dl>
        </section>
      </div>
    </AdminShell>
  )
}

function SupportStep({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-all">{value}</dd>
    </div>
  )
}





