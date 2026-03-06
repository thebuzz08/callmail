import type { Metadata } from "next"
import Link from "next/link"
import { Server, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Subprocessors - CallMail",
  description: "List of third-party service providers (subprocessors) used by CallMail",
}

export default function SubprocessorsPage() {
  const subprocessors = [
    {
      name: "Google Cloud / Gmail API",
      purpose: "Email metadata access for monitoring VIP senders and keywords",
      dataProcessed: "Email sender addresses, subject lines, timestamps (read-only)",
      location: "United States",
      website: "https://cloud.google.com",
    },
    {
      name: "Twilio",
      purpose: "Phone call delivery for email notifications",
      dataProcessed: "Phone numbers, call metadata",
      location: "United States",
      website: "https://www.twilio.com",
    },
    {
      name: "Supabase",
      purpose: "Database hosting and user authentication",
      dataProcessed: "User accounts, VIP contacts, keywords, settings, OAuth tokens",
      location: "United States (AWS US-East)",
      website: "https://supabase.com",
    },
    {
      name: "Upstash",
      purpose: "Background job scheduling (QStash) and Redis caching",
      dataProcessed: "Job metadata, temporary cache data",
      location: "United States",
      website: "https://upstash.com",
    },
    {
      name: "Vercel",
      purpose: "Application hosting, deployment, and edge functions",
      dataProcessed: "Application logs, deployment metadata",
      location: "Global (Edge Network)",
      website: "https://vercel.com",
    },
  ]

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-foreground rounded-2xl flex items-center justify-center">
              <Server className="w-6 h-6 text-background" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Subprocessors</h1>
          </div>
          <p className="text-muted-foreground">
            CallMail uses the following third-party service providers (subprocessors) to deliver our service. Each
            provider has been selected for their security practices and compliance standards.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: December 31, 2024</p>
        </div>

        <div className="space-y-4">
          {subprocessors.map((provider) => (
            <div key={provider.name} className="p-4 sm:p-6 border border-border rounded-2xl">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg font-semibold text-foreground">{provider.name}</h2>
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Purpose: </span>
                  <span className="text-foreground">{provider.purpose}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Data Processed: </span>
                  <span className="text-foreground">{provider.dataProcessed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location: </span>
                  <span className="text-foreground">{provider.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border">
          <h3 className="font-medium text-foreground mb-2">Updates to Subprocessors</h3>
          <p className="text-sm text-muted-foreground">
            We may update this list from time to time as we add or change service providers. Material changes will be
            reflected in the &quot;Last updated&quot; date above. If you have concerns about any subprocessor, please
            contact us at{" "}
            <a href="mailto:burke@omnisound.xyz" className="text-primary underline">
              burke@omnisound.xyz
            </a>
            .
          </p>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-primary underline">
            ← Back to Home
          </Link>
          <Link href="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>
          <Link href="/security" className="text-primary underline">
            Security Practices
          </Link>
        </div>
      </div>
    </div>
  )
}
