import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Mail, Phone, Bell, Shield, Clock, Zap, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "CallMail - Get a Phone Call When You Receive an Important Email",
  description:
    "Get a phone call when you receive an important email. CallMail monitors your Gmail and calls you instantly for VIP senders or urgent keywords. Breaks through Do Not Disturb so you never miss critical emails.",
  alternates: {
    canonical: "https://call-mail.xyz",
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/callmail-contact-photo.jpg"
              alt="CallMail - Get a Phone Call for Important Emails"
              width={108}
              height={108}
              className="rounded-2xl -ml-6 -mr-4"
            />
            <span className="text-3xl font-bold tracking-tight">CallMail</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              How It Works
            </a>
            <Link href="/security" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Security
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Privacy
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden sm:inline-flex bg-foreground text-background px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
            >
              Open App
            </Link>
            <Link
              href="/app"
              className="sm:hidden bg-foreground text-background px-4 py-2 rounded-full font-medium hover:opacity-90 transition-opacity text-sm"
            >
              App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Updated H1 and copy for SEO */}
      <section className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden">
        {/* Brutalist grid background */}
        <div className="absolute inset-0 -z-10">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '15px 15px'
            }}
          />
          {/* Radial fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-border bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-8">
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span>Never miss critical emails</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold mb-6 leading-[1.1] tracking-tight text-balance">
            Get a phone call for
            <br />
            <span className="text-muted-foreground">important emails</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-pretty">
            CallMail calls your phone when you receive emails from VIP contacts, specific domains, or containing urgent keywords. Break through Do Not Disturb and never miss critical communications.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-opacity"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-background/80 backdrop-blur-sm px-8 py-4 rounded-full font-medium text-lg hover:bg-muted transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-semibold mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Privacy focused</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-semibold mb-1">{"<"}5min</div>
              <div className="text-sm text-muted-foreground">Email to call</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-semibold mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-semibold mb-1">7 days</div>
              <div className="text-sm text-muted-foreground">Free trial</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Added semantic H2 with keywords */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight">
              How to Get a Phone Call for Important Emails
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to receive phone calls when critical emails arrive
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="relative p-8 rounded-3xl border border-border bg-card">
              <div className="absolute -top-4 left-8 bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="w-14 h-14 border border-border rounded-2xl flex items-center justify-center mb-6 mt-2">
                <Mail className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect Gmail</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sign in with Google to grant read-only access. We only check sender addresses and subject lines - never
                your email content.
              </p>
            </article>

            <article className="relative p-8 rounded-3xl border border-border bg-card">
              <div className="absolute -top-4 left-8 bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="w-14 h-14 border border-border rounded-2xl flex items-center justify-center mb-6 mt-2">
                <Bell className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Set Your Triggers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Add VIP contacts, entire domains (like @company.com), or urgent keywords. Get called only for emails that match your criteria.
              </p>
            </article>

            <article className="relative p-8 rounded-3xl border border-border bg-card">
              <div className="absolute -top-4 left-8 bg-foreground text-background w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="w-14 h-14 border border-border rounded-2xl flex items-center justify-center mb-6 mt-2">
                <Phone className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Receive Phone Calls</h3>
              <p className="text-muted-foreground leading-relaxed">
                When a matching email arrives, you get a phone call that breaks through Do Not Disturb mode.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Features - Added keyword-rich H2 and feature descriptions */}
      <section id="features" className="relative py-20 sm:py-28 px-4 sm:px-6 bg-muted/30 overflow-hidden">
        {/* Subtle diagonal lines */}
        <div className="absolute inset-0 -z-10 opacity-[0.015]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                currentColor,
                currentColor 1px,
                transparent 1px,
                transparent 40px
              )`
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight">Email to Phone Call Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features to ensure you never miss an important email notification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="flex items-start gap-5 p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 border border-border rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Privacy First Email Monitoring</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We only access email metadata (sender, subject). Your email content is never read, stored, or shared.
                </p>
              </div>
            </article>

            <article className="flex items-start gap-5 p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 border border-border rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-time Email to Call Alerts</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Checks your inbox frequently. Get called within minutes of receiving important emails.
                </p>
              </div>
            </article>

            <article className="flex items-start gap-5 p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 border border-border rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Breaks Through Do Not Disturb</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Phone calls break through Do Not Disturb mode, ensuring you never miss urgent email communications.
                </p>
              </div>
            </article>

            <article className="flex items-start gap-5 p-6 rounded-2xl border border-border bg-card">
              <div className="w-12 h-12 border border-border rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Contacts, Domains & Keywords</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Add specific email addresses, entire domains (@company.com), or trigger keywords. Get called only for emails that truly matter.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section - Updated copy for SEO */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
        {/* Concentric circles background */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[800px] h-[800px] rounded-full border border-current opacity-[0.03]" />
          <div className="absolute w-[600px] h-[600px] rounded-full border border-current opacity-[0.03]" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-current opacity-[0.03]" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-current opacity-[0.03]" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4 tracking-tight">
            Ready to get phone calls for important emails?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Join professionals who use CallMail to receive phone calls when critical emails arrive.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg hover:opacity-90 transition-opacity"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/callmail-contact-photo.jpg"
                  alt="CallMail Logo"
                  width={64}
                  height={64}
                  className="rounded-xl -ml-2 -mr-2"
                />
                <span className="font-semibold">CallMail</span>
              </Link>

            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/security" className="hover:text-foreground transition-colors">
                Security
              </Link>
              <Link href="/dpa" className="hover:text-foreground transition-colors">
                Data Processing
              </Link>
              <a href="mailto:burke@omnisound.xyz" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CallMail. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
