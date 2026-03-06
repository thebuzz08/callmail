import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Shield, Lock, Server, Eye, AlertTriangle, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Security - How CallMail Keeps Your Email Data Safe",
  description:
    "Learn how CallMail protects your data with encryption, OAuth 2.0, and Row Level Security. We only access Gmail metadata to send you phone calls for important emails.",
  keywords: [
    "CallMail security",
    "email data protection",
    "Gmail OAuth security",
    "email monitoring security",
    "phone call notification security",
    "CASA compliance",
  ],
  alternates: {
    canonical: "https://call-mail.xyz/security",
  },
  openGraph: {
    title: "Security Practices - CallMail Email to Phone Call Service",
    description: "Learn how CallMail protects your data with encryption, OAuth 2.0, and industry-standard security.",
    type: "article",
  },
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/images/callmail-contact-photo.jpg"
              alt="CallMail Logo"
              width={48}
              height={48}
              className="rounded-2xl"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Security Practices</h1>
          </div>
          <p className="text-muted-foreground">
            Learn how CallMail protects your data and maintains security standards.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: February 14, 2026</p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-muted/30 p-6 rounded-2xl border border-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Security Overview
            </h2>
            <p className="text-muted-foreground mb-4">
              CallMail is designed with security and privacy at its core. We follow industry best practices to protect
              your data and maintain the trust you place in our service.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Encryption in Transit</p>
                  <p className="text-sm text-muted-foreground">All data encrypted via TLS 1.3</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Server className="w-5 h-5 text-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Encryption at Rest</p>
                  <p className="text-sm text-muted-foreground">Database encryption via Supabase</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Minimal Data Access</p>
                  <p className="text-sm text-muted-foreground">Read-only Gmail metadata only</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-foreground mt-0.5" />
                <div>
                  <p className="font-medium">OAuth 2.0</p>
                  <p className="text-sm text-muted-foreground">Secure Google authentication</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Data Protection</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="p-4 border border-border rounded-xl">
                <h3 className="font-medium text-foreground mb-2">Token Security</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Google OAuth tokens stored securely in encrypted database</li>
                  <li>• Tokens automatically refreshed every 30 minutes</li>
                  <li>• Refresh tokens stored in httpOnly, Secure cookies - never exposed to client-side JavaScript</li>
                  <li>• OAuth state parameter validation prevents CSRF attacks</li>
                  <li>• Users can revoke access anytime via Google Account settings</li>
                </ul>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <h3 className="font-medium text-foreground mb-2">Database Security</h3>
                <ul className="space-y-2 text-sm">
                  <li>• PostgreSQL database hosted on Supabase with encryption at rest</li>
                  <li>• Row Level Security (RLS) policies ensure users can only access their own data</li>
                  <li>• Regular automated backups with point-in-time recovery</li>
                  <li>• Database connections encrypted via SSL/TLS</li>
                </ul>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <h3 className="font-medium text-foreground mb-2">Application Security</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Hosted on Vercel with automatic DDoS protection</li>
                  <li>• HTTPS enforced on all endpoints with HSTS preload</li>
                  <li>• Content Security Policy (CSP) with frame-ancestors none</li>
                  <li>• Rate limiting on all authentication and data mutation endpoints</li>
                  <li>• Input validation and sanitization on all user-facing API routes</li>
                  <li>• API routes protected with signature verification (QStash)</li>
                  <li>• Comprehensive audit logging for security-relevant events</li>
                  <li>• No sensitive data in client-side logs or error messages</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Access Controls */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Access Controls</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Access to user data is strictly controlled and limited to what is necessary for providing the service:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Gmail Access:</strong> Read-only access to email metadata
                    (sender, subject, timestamp). We never read email body content.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">User Data:</strong> Users can only access and modify their own
                    VIP contacts, keywords, and settings.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Admin Access:</strong> Administrative access is limited to
                    essential operations and logged for audit purposes.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Incident Response */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Incident Response
            </h2>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900">
              <p className="text-foreground mb-3">
                In the event of a security incident affecting user data, we commit to:
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  • <strong className="text-foreground">Notification:</strong> Notify affected users within 72 hours via
                  email
                </li>
                <li>
                  • <strong className="text-foreground">Containment:</strong> Immediately isolate affected systems and
                  prevent further exposure
                </li>
                <li>
                  • <strong className="text-foreground">Investigation:</strong> Conduct thorough investigation to
                  determine scope and cause
                </li>
                <li>
                  • <strong className="text-foreground">Remediation:</strong> Implement fixes and preventive measures
                </li>
                <li>
                  • <strong className="text-foreground">Reporting:</strong> Provide detailed incident report to affected
                  users
                </li>
              </ul>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Compliance</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="p-4 border border-border rounded-xl">
                <h3 className="font-medium text-foreground mb-2">Google API Services Compliance</h3>
                <p className="text-sm">
                  CallMail complies with the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    className="text-primary underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google API Services User Data Policy
                  </a>
                  , including Limited Use requirements. We undergo annual CASA Tier 2 security assessments to
                  maintain compliance with Google verification requirements.
                </p>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <h3 className="font-medium text-foreground mb-2">Data Protection</h3>
                <p className="text-sm">
                  We implement appropriate technical and organizational measures to protect personal data, including:
                  encryption, access controls, regular security reviews, and employee training.
                </p>
              </div>
            </div>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Security Reporting</h2>
            <p className="text-muted-foreground mb-4">
              If you discover a security vulnerability, please report it responsibly:
            </p>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="font-medium text-foreground mb-2">Contact:</p>
              <a href="mailto:burke@omnisound.xyz" className="text-primary underline">
                burke@omnisound.xyz
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Please include detailed information about the vulnerability and steps to reproduce. We will respond
                within 48 hours and work with you to address the issue.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-wrap gap-4">
          <Link href="/" className="text-primary underline">
            ← Back to Home
          </Link>
          <Link href="/privacy" className="text-primary underline">
            Privacy Policy
          </Link>
          <Link href="/subprocessors" className="text-primary underline">
            Subprocessors
          </Link>
        </div>
      </div>
    </div>
  )
}
