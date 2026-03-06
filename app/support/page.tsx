import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MessageCircle, FileText, ChevronRight, Clock, Shield, CreditCard } from "lucide-react"

export const metadata: Metadata = {
  title: "Support | CallMail",
  description: "Get help with CallMail. Contact support, browse FAQs, and manage your subscription.",
}

const faqs = [
  {
    question: "How does CallMail work?",
    answer:
      "CallMail monitors your Gmail inbox for emails from your VIP contacts or containing your alert keywords. When an important email arrives, we call your phone immediately so you never miss critical messages.",
  },
  {
    question: "Why do I need to connect my Gmail?",
    answer:
      "CallMail needs read-only access to your Gmail to check for new emails from your VIP contacts. We only read email headers (sender and subject) - never the email body content. You can revoke access anytime from your Google Account settings.",
  },
  {
    question: "How do I add VIP contacts or keywords?",
    answer:
      "From the dashboard, tap the + button next to 'Add Contacts', 'Add Domains', or 'Add Subjects' to add new triggers. You can add individual email addresses, entire domains (@company.com), or subject keywords.",
  },
  {
    question: "What are Quiet Hours?",
    answer:
      "Quiet Hours let you set times when you don't want to receive calls (like overnight). Go to Settings > Quiet Hours to configure your schedule.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Go to Settings > Subscription > Manage Subscription. For iOS subscriptions, you can also manage them in the App Store: Settings > Your Name > Subscriptions. For web subscriptions, use the Manage Billing button in Settings.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "For iOS App Store purchases, refunds are handled by Apple. Visit reportaproblem.apple.com to request a refund. For web purchases, contact us at support@call-mail.xyz within 7 days of purchase.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use industry-standard encryption, never store email content (only metadata), and you can delete all your data anytime. See our Security page for details on our practices.",
  },
  {
    question: "Why didn't I receive a call?",
    answer:
      "Check that: 1) The sender is in your VIP contacts or the subject contains your keywords, 2) It's not during your Quiet Hours, 3) Your phone number is correctly configured, 4) You have an active subscription.",
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-foreground mb-3">How can we help?</h1>
          <p className="text-muted-foreground">Find answers to common questions or contact our support team.</p>
        </div>

        {/* Contact Options */}
        <div className="grid gap-4 mb-12">
          <a
            href="mailto:support@call-mail.xyz"
            className="flex items-center gap-4 p-4 rounded-2xl border border-border hover:bg-muted/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Mail className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Email Support</p>
              <p className="text-sm text-muted-foreground">support@call-mail.xyz</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/30">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Clock className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Response Time</p>
              <p className="text-sm text-muted-foreground">We typically respond within 24 hours</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-12">
          <Link
            href="/privacy"
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Privacy Policy</span>
          </Link>
          <Link
            href="/terms"
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Terms of Service</span>
          </Link>
          <Link
            href="/security"
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Security</span>
          </Link>
          <a
            href="https://reportaproblem.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Apple Refunds</span>
          </a>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="group rounded-xl border border-border overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Subscription Management Note */}
        <div className="mt-12 p-6 rounded-2xl bg-muted/30 border border-border">
          <h3 className="font-medium text-foreground mb-2">Managing Your Subscription</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you subscribed through the iOS app, manage your subscription in the App Store: Settings {">"} [Your Name] {">"}{" "}
            Subscriptions {">"} CallMail.
          </p>
          <p className="text-sm text-muted-foreground">
            If you subscribed on the web, go to Settings {">"} Subscription {">"} Manage Billing in the app.
          </p>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to CallMail
          </Link>
        </div>
      </div>
    </main>
  )
}
