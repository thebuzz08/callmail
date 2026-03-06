import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy - How CallMail Protects Your Email Data",
  description:
    "Learn how CallMail protects your privacy when monitoring emails for phone call alerts. We only access email metadata - never your email content. GDPR compliant.",
  keywords: [
    "CallMail privacy",
    "email privacy policy",
    "Gmail data protection",
    "email monitoring privacy",
    "phone call alert privacy",
  ],
  alternates: {
    canonical: "https://call-mail.xyz/privacy",
  },
  openGraph: {
    title: "Privacy Policy - CallMail Email to Phone Call Service",
    description: "Learn how CallMail protects your privacy. We only access email metadata - never your email content.",
    type: "article",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mb-4 text-sm text-muted-foreground">Last updated: January 2, 2026</p>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold">1. Cookies and Tracking Technologies</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Essential Cookies:</strong> We use essential cookies that are
                strictly necessary for the operation of our service. These cannot be disabled:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong className="text-foreground">callmail_session:</strong> Authentication session cookie (30 days
                  expiration)
                </li>
              </ul>
              <p className="mt-3">
                <strong className="text-foreground">Analytics Cookies (Optional):</strong> We use Vercel Analytics to
                understand how users interact with our service. This helps us improve performance and user experience.
                You can decline analytics cookies through our cookie banner.
              </p>
              <p className="mt-3">
                <strong className="text-foreground">Your Choices:</strong> You can accept or decline optional analytics
                cookies through the cookie consent banner. Essential cookies cannot be declined as they are required for
                the service to function.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">2. Introduction</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              CallMail (&quot;we&quot;, &quot;our&quot;, or &quot;the App&quot;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use
              our email-to-call notification service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">3. Information We Collect</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Google Account Information:</strong> When you sign in with Google,
                we receive your email address and basic profile information to identify your account.
              </p>
              <p>
                <strong className="text-foreground">Gmail Data (Read-Only Access):</strong> We access your Gmail inbox
                in read-only mode to check for new unread emails. We specifically check:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Email sender addresses</li>
                <li>Email subject lines</li>
                <li>Email timestamps</li>
              </ul>
              <p>
                <strong className="text-foreground">User-Provided Information:</strong>
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>VIP email addresses you choose to monitor</li>
                <li>Keywords you want to trigger calls</li>
                <li>Your phone number for receiving call notifications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">4. How We Use Your Information</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>We use your information solely to provide the CallMail service:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong className="text-foreground">Email Monitoring:</strong> We scan your unread emails to identify
                  messages from your specified VIP senders or containing your specified keywords.
                </li>
                <li>
                  <strong className="text-foreground">Call Notifications:</strong> When a matching email is detected, we
                  use Twilio to place a brief call to your specified phone number.
                </li>
                <li>
                  <strong className="text-foreground">Service Improvement:</strong> We may use aggregated, anonymized
                  data to improve our service.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">5. Data Storage and Security</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Database Storage:</strong> Your VIP contacts, keywords, phone
                number, and preferences are stored securely in our Supabase database with encryption at rest.
              </p>
              <p>
                <strong className="text-foreground">Data Residency:</strong> User data is stored in Supabase
                (PostgreSQL) hosted in AWS US-East region.
              </p>
              <p>
                <strong className="text-foreground">OAuth Tokens:</strong> Your Google authentication tokens are stored
                securely in our database and are used only to access your Gmail on your behalf.
              </p>
              <p>
                <strong className="text-foreground">Email Data Retention:</strong> Processed email IDs are retained for
                30 days for deduplication purposes. User data is retained until account deletion.
              </p>
              <p>
                <strong className="text-foreground">Security Measures:</strong> We use industry-standard encryption
                (HTTPS/TLS) for all data transmission and encryption at rest for stored data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">6. Payments and Subscriptions</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Payment Processing:</strong> We offer subscriptions through multiple
                platforms:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong className="text-foreground">iOS App Store:</strong> If you subscribe through our iOS app,
                  payments are processed by Apple. We receive a transaction ID and subscription status from Apple but
                  never have access to your payment card details.
                </li>
                <li>
                  <strong className="text-foreground">Web (Stripe):</strong> If you subscribe through our website,
                  payments are processed by Stripe. We receive a customer ID and subscription status but never have
                  access to your full payment card details.
                </li>
              </ul>
              <p>
                <strong className="text-foreground">Subscription Data:</strong> We store subscription status,
                transaction IDs, and expiration dates to provide access to premium features. We do not store credit card
                numbers.
              </p>
              <p>
                <strong className="text-foreground">Refunds:</strong> For iOS App Store purchases, refund requests must
                be submitted to Apple at reportaproblem.apple.com. For web purchases, contact support@call-mail.xyz.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">7. Data Sharing and Subprocessors</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                We do not sell, trade, or transfer your personal information to third parties. We share data only with
                the following service providers (subprocessors):
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong className="text-foreground">Twilio:</strong> We share your phone number with Twilio solely to
                  place notification calls. No email data is shared with Twilio.
                </li>
                <li>
                  <strong className="text-foreground">Supabase:</strong> Database hosting for user accounts, contacts,
                  keywords, and settings.
                </li>
                <li>
                  <strong className="text-foreground">Upstash:</strong> Background job scheduling and Redis caching.
                </li>
                <li>
                  <strong className="text-foreground">Google:</strong> We interact with Google&apos;s Gmail API using
                  OAuth 2.0 for email metadata access.
                </li>
                <li>
                  <strong className="text-foreground">Vercel:</strong> Application hosting and deployment.
                </li>
                <li>
                  <strong className="text-foreground">Stripe:</strong> Payment processing for web subscriptions.
                </li>
                <li>
                  <strong className="text-foreground">Apple:</strong> Payment processing for iOS app subscriptions.
                </li>
              </ul>
              <p className="mt-3">We will never:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Sell your data to advertisers or data brokers</li>
                <li>Use your email content for advertising purposes</li>
                <li>Share your email data with third parties for their marketing</li>
                <li>Use your data for AI model training</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">8. Google API Services User Data Policy Compliance</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                CallMail&apos;s use and transfer of information received from Google APIs adheres to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <p>Specifically:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li>We only request the minimum necessary permissions (gmail.metadata scope)</li>
                <li>We use Gmail data only to provide the email notification feature</li>
                <li>We do not store, transfer, or use Gmail data for any purpose other than providing this service</li>
                <li>We do not allow humans to read your email content</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">9. Your Rights and Choices</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Access and Control:</strong> You can view and modify your VIP
                contacts, keywords, and phone number at any time within the app.
              </p>
              <p>
                <strong className="text-foreground">Data Export:</strong> You can export all your data directly from the
                app Settings page at any time. No need to contact us.
              </p>
              <p>
                <strong className="text-foreground">Revoke Access:</strong> You can revoke CallMail&apos;s access to
                your Google account at any time through your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Account permissions
                </a>
                .
              </p>
              <p>
                <strong className="text-foreground">Delete Data:</strong> You can request deletion of all your data by
                contacting us. We will delete your data within 30 days of request.
              </p>
              <p>
                <strong className="text-foreground">Stop Monitoring:</strong> You can pause or stop email monitoring at
                any time using the controls in the app.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">10. Incident Response</h2>
            <p className="text-muted-foreground">
              In the event of a data breach affecting your personal information, we will notify affected users within 72
              hours via email. We maintain security incident response procedures to quickly identify, contain, and
              remediate any security issues.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">11. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              CallMail is not intended for children under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child has provided us
              with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">12. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the &quot;Last updated&quot; date. Continued use of the app after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">13. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-2 text-muted-foreground">
              Email:{" "}
              <a href="mailto:burke@omnisound.xyz" className="text-primary underline">
                burke@omnisound.xyz
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <Link href="/" className="text-primary underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
