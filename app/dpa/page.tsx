import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Data Processing Agreement - CallMail",
  description:
    "CallMail Data Processing Agreement (DPA) governing how we process personal data, security measures, subprocessors, and data protection obligations.",
  keywords: [
    "CallMail DPA",
    "data processing agreement",
    "GDPR compliance",
    "data protection",
    "personal data processing",
  ],
  openGraph: {
    title: "Data Processing Agreement - CallMail",
    description: "Data Processing Agreement governing how CallMail handles your personal data.",
    type: "article",
  },
}

export default function DPAPage() {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Data Processing Agreement</h1>
          </div>
          <p className="text-muted-foreground">
            This Data Processing Agreement (&quot;DPA&quot;) governs how CallMail processes personal data on your
            behalf.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Last updated: December 31, 2024</p>
        </div>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Definitions</h2>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p>
                <strong className="text-foreground">&quot;Personal Data&quot;</strong> means any information relating to
                an identified or identifiable natural person.
              </p>
              <p>
                <strong className="text-foreground">&quot;Processing&quot;</strong> means any operation performed on
                Personal Data, such as collection, storage, use, or deletion.
              </p>
              <p>
                <strong className="text-foreground">&quot;Data Controller&quot;</strong> means you, the user who
                determines the purposes and means of processing Personal Data.
              </p>
              <p>
                <strong className="text-foreground">&quot;Data Processor&quot;</strong> means CallMail, which processes
                Personal Data on behalf of the Data Controller.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Scope of Processing</h2>
            <div className="space-y-3 text-muted-foreground text-sm">
              <p>CallMail processes the following categories of Personal Data:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>
                  <strong className="text-foreground">Account Information:</strong> Email address, name (from Google
                  OAuth)
                </li>
                <li>
                  <strong className="text-foreground">Contact Information:</strong> Phone number for call notifications
                </li>
                <li>
                  <strong className="text-foreground">Email Metadata:</strong> Sender addresses, subject lines,
                  timestamps (read-only access)
                </li>
                <li>
                  <strong className="text-foreground">User Preferences:</strong> VIP contacts, keywords, settings
                </li>
              </ul>
              <p className="mt-3">
                <strong className="text-foreground">Purpose:</strong> Processing is performed solely to provide the
                CallMail email notification service - monitoring Gmail for specified senders/keywords and placing phone
                calls when matches are found.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Data Protection Obligations</h2>
            <div className="space-y-3 text-muted-foreground text-sm">
              <p>CallMail commits to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Process Personal Data only in accordance with your documented instructions</li>
                <li>Ensure that persons authorized to process Personal Data are bound by confidentiality</li>
                <li>
                  Implement appropriate technical and organizational security measures (see{" "}
                  <Link href="/security" className="text-primary underline">
                    Security Practices
                  </Link>
                  )
                </li>
                <li>
                  Not engage another processor without your authorization (see{" "}
                  <Link href="/subprocessors" className="text-primary underline">
                    Subprocessors
                  </Link>
                  )
                </li>
                <li>Assist you in responding to data subject requests</li>
                <li>Delete or return all Personal Data upon termination of service, at your choice</li>
                <li>Make available all information necessary to demonstrate compliance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Subprocessors</h2>
            <p className="text-muted-foreground text-sm">
              CallMail uses approved subprocessors to deliver the service. A complete list is available on our{" "}
              <Link href="/subprocessors" className="text-primary underline">
                Subprocessors page
              </Link>
              . We will notify you of any intended changes to subprocessors, giving you the opportunity to object.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Transfers</h2>
            <p className="text-muted-foreground text-sm">
              Personal Data is processed and stored in the United States. For transfers outside your jurisdiction, we
              rely on appropriate safeguards such as Standard Contractual Clauses where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Data Retention</h2>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p>
                <strong className="text-foreground">Active Accounts:</strong> Data is retained for the duration of your
                account.
              </p>
              <p>
                <strong className="text-foreground">Processed Email IDs:</strong> Retained for 30 days for deduplication
                purposes.
              </p>
              <p>
                <strong className="text-foreground">Account Deletion:</strong> Upon account deletion or request, we will
                delete your Personal Data within 30 days, except where retention is required by law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Security Incidents</h2>
            <p className="text-muted-foreground text-sm">
              CallMail will notify you without undue delay (and in any event within 72 hours) upon becoming aware of any
              Personal Data breach. Notification will include the nature of the breach, categories of data affected, and
              measures taken to address the breach.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Audit Rights</h2>
            <p className="text-muted-foreground text-sm">
              Upon reasonable request and subject to confidentiality obligations, CallMail will provide information
              reasonably necessary to demonstrate compliance with this DPA. We undergo regular security assessments
              (CASA) and can provide summary reports upon request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground text-sm">
              This DPA terminates when the underlying service agreement terminates. Upon termination, CallMail will
              delete all Personal Data within 30 days unless legal retention requirements apply. You may request a data
              export before deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground text-sm">
              For questions about this DPA or to exercise your rights, contact us at:{" "}
              <a href="mailto:burke@omnisound.xyz" className="text-primary underline">
                burke@omnisound.xyz
              </a>
            </p>
          </section>
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
          <Link href="/subprocessors" className="text-primary underline">
            Subprocessors
          </Link>
        </div>
      </div>
    </div>
  )
}
