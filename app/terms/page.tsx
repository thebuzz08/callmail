import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Terms of Service - CallMail Email to Phone Call Alerts",
  description:
    "Terms of Service for CallMail email notification service. Learn about using our phone call alerts for important emails, service limitations, and your rights.",
  keywords: [
    "CallMail terms",
    "terms of service",
    "email to call terms",
    "email notification terms",
    "phone call alert service agreement",
  ],
  alternates: {
    canonical: "https://call-mail.xyz/terms",
  },
  openGraph: {
    title: "Terms of Service - CallMail",
    description: "Terms of Service for CallMail email to phone call notification service.",
    type: "article",
  },
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/images/callmail-contact-photo.jpg"
            alt="CallMail Logo"
            width={48}
            height={48}
            className="rounded-2xl"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Terms of Service</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Last updated: December 31, 2024</p>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using CallMail (&quot;the App&quot;, &quot;Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">2. Description of Service</h2>
            <p className="text-muted-foreground">
              CallMail is an email notification service that monitors your Gmail inbox for emails from specified senders
              or containing specified keywords, and places phone calls to alert you when matching emails are received.
              The service requires:
            </p>
            <ul className="ml-6 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>A valid Google account with Gmail</li>
              <li>Authorization to access your Gmail in read-only mode</li>
              <li>A valid phone number capable of receiving calls</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">3. Account and Authorization</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Google Account:</strong> You must sign in with a valid Google
                account to use CallMail. You are responsible for maintaining the security of your Google account
                credentials.
              </p>
              <p>
                <strong className="text-foreground">Authorization:</strong> By connecting your Google account, you
                authorize CallMail to access your Gmail inbox in read-only mode to check for new emails. You can revoke
                this authorization at any time through your Google Account settings.
              </p>
              <p>
                <strong className="text-foreground">Accurate Information:</strong> You agree to provide accurate and
                complete information, including a valid phone number for receiving call notifications.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">4. Acceptable Use</h2>
            <p className="text-muted-foreground">You agree not to:</p>
            <ul className="ml-6 mt-2 list-disc space-y-1 text-muted-foreground">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
              <li>Use the Service in violation of Google&apos;s Terms of Service</li>
              <li>Provide false or misleading information</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">5. Service Limitations</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Availability:</strong> We strive to provide reliable service, but we
                do not guarantee 100% uptime. The Service may be temporarily unavailable due to maintenance, updates, or
                circumstances beyond our control.
              </p>
              <p>
                <strong className="text-foreground">Call Delivery:</strong> Call notifications depend on third-party
                services (Twilio) and your phone carrier. We cannot guarantee delivery of all calls, especially if your
                phone is off, in Do Not Disturb mode, or has poor reception.
              </p>
              <p>
                <strong className="text-foreground">Email Detection:</strong> While we strive for accuracy, we cannot
                guarantee detection of all emails due to delays in Gmail API, network issues, or other technical
                factors.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">6. Costs and Charges</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Service Fees:</strong> The basic CallMail service may be free or
                paid depending on current offerings. Any fees will be clearly communicated before you incur them.
              </p>
              <p>
                <strong className="text-foreground">Phone Charges:</strong> You may incur charges from your phone
                carrier for receiving calls. These charges are your responsibility.
              </p>
              <p>
                <strong className="text-foreground">Third-Party Costs:</strong> Any costs associated with your internet
                connection, mobile data, or other third-party services are your responsibility.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">7. Privacy</h2>
            <p className="text-muted-foreground">
              Your use of CallMail is also governed by our{" "}
              <Link href="/privacy" className="text-primary underline">
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your information. By using the Service, you consent to
              the practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service, including its design, features, and content, is owned by CallMail and protected by
              intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the
              Service without our express permission.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, OR COMPLETELY SECURE.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">10. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CALLMAIL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES,
              ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE
              SERVICE IN THE PAST 12 MONTHS, OR $100, WHICHEVER IS LESS.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">11. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless CallMail, its officers, directors, employees, and agents from any
              claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, your
              violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">12. Termination</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">By You:</strong> You may stop using the Service at any time by
                revoking Google account access and deleting the app.
              </p>
              <p>
                <strong className="text-foreground">By Us:</strong> We reserve the right to suspend or terminate your
                account and access to the Service immediately, at our sole discretion, with or without cause, and with
                or without notice. Reasons for termination may include, but are not limited to:
              </p>
              <ul className="ml-6 mt-2 list-disc space-y-1 text-muted-foreground">
                <li>Violation of these Terms of Service</li>
                <li>Suspected fraudulent, abusive, or illegal activity</li>
                <li>Excessive or inappropriate use of the Service</li>
                <li>Providing false or misleading information</li>
                <li>Breach of third-party terms (including Google's Terms of Service)</li>
                <li>Any conduct we determine to be harmful to the Service, other users, or our business</li>
                <li>Discontinuation or material modification of the Service</li>
              </ul>
              <p className="mt-2">
                <strong className="text-foreground">Effect of Termination:</strong> Upon termination, your right to use
                the Service will immediately cease. We may delete your account data, though some information may be
                retained as required by law or for legitimate business purposes. We are not obligated to provide refunds
                for any unused services.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Monitoring:</strong> We reserve the right to monitor user activity
                and audit logs for abuse detection, security purposes, and service improvement. This monitoring may be
                conducted at our discretion without prior notice.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">13. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. Changes will be effective when posted. Your
              continued use of the Service after changes constitutes acceptance of the new Terms. We encourage you to
              review these Terms periodically.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">14. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without
              regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">15. Contact Information</h2>
            <p className="text-muted-foreground">If you have any questions about these Terms, please contact us at:</p>
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
