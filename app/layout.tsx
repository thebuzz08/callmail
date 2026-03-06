import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { CookieConsent } from "@/components/cookie-consent"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://call-mail.xyz"),
  title: {
    default: "CallMail - Get a Phone Call When You Receive an Important Email",
    template: "%s | CallMail",
  },
  description:
    "Get a phone call when you receive an important email. CallMail monitors your Gmail and calls you instantly for VIP senders or urgent keywords. Breaks through Do Not Disturb so you never miss critical emails.",
  keywords: [
    // Primary high-intent keywords
    "get call for important email",
    "phone call for email",
    "call me when I get an email",
    "email to phone call",
    "important email notification call",
    "urgent email phone alert",
    // Feature-focused keywords
    "email call notification",
    "Gmail phone call alert",
    "VIP email caller",
    "break through do not disturb email",
    "bypass DND for email",
    "email breaks do not disturb",
    // Problem-focused keywords
    "never miss important email",
    "urgent email alert",
    "critical email notification",
    "important email alert system",
    // Product/Brand keywords
    "CallMail",
    "email to call app",
    "Gmail call notification app",
    // Long-tail keywords
    "get called when boss emails",
    "phone rings for important email",
    "call notification for urgent emails",
    "email triggers phone call",
    "automatic call for email",
  ],
  authors: [{ name: "CallMail" }],
  creator: "CallMail",
  publisher: "CallMail",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CallMail - Get a Phone Call for Important Emails",
    description:
      "Never miss critical emails again. CallMail calls your phone when VIP senders or urgent keywords appear in your inbox. Breaks through Do Not Disturb mode.",
    siteName: "CallMail",
    images: [
      {
        url: "/images/callmail-contact-photo.jpg",
        width: 1200,
        height: 630,
        alt: "CallMail - Get a Phone Call When You Receive an Important Email",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CallMail - Get a Phone Call for Important Emails",
    description:
      "Never miss critical emails. Get instant phone calls when VIP senders or urgent keywords appear. Breaks through Do Not Disturb.",
    images: ["/images/callmail-contact-photo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://call-mail.xyz",
  },
  icons: {
    icon: [{ url: "/images/callmail-contact-photo.jpg", sizes: "any" }],
    apple: "/images/callmail-contact-photo.jpg",
    shortcut: "/images/callmail-contact-photo.jpg",
  },
  manifest: "/manifest.json",
  category: "productivity",
  classification: "Email Notification Service",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  if (typeof window !== "undefined") {
    ;(window as any).__SUPPRESS_GOTRUE_WARNING__ = true
  }

  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CallMail" />
        <Script
          id="schema-software"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "CallMail",
              alternateName: "Call Mail",
              description:
                "Get a phone call when you receive an important email. CallMail monitors your Gmail inbox and calls your phone when VIP senders or urgent keywords appear. Never miss critical emails - breaks through Do Not Disturb mode.",
              applicationCategory: "ProductivityApplication",
              applicationSubCategory: "Email Notification",
              operatingSystem: "Web, iOS, Android",
              url: "https://call-mail.xyz",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5.0",
                reviewCount: "1",
                bestRating: "5",
                worstRating: "1",
              },
              featureList: [
                "Phone calls for important emails",
                "VIP sender alerts",
                "Keyword-triggered calls",
                "Do Not Disturb bypass",
                "Gmail integration",
                "Real-time email monitoring",
              ],
              screenshot: "https://call-mail.xyz/images/callmail-contact-photo.jpg",
            }),
          }}
        />
        <Script
          id="schema-org"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "CallMail",
              url: "https://call-mail.xyz",
              logo: "https://call-mail.xyz/images/callmail-contact-photo.jpg",
              description: "Get a phone call when you receive an important email",
              contactPoint: {
                "@type": "ContactPoint",
                email: "burke@omnisound.xyz",
                contactType: "customer support",
              },
            }),
          }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "CallMail",
              url: "https://call-mail.xyz",
              description: "Get a phone call when you receive an important email",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://call-mail.xyz/app",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Script
          id="schema-faq"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How do I get a phone call when I receive an important email?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "CallMail monitors your Gmail inbox and automatically calls your phone when emails from VIP senders or containing urgent keywords arrive. Simply connect your Gmail, add your VIP contacts and keywords, and CallMail will call you instantly when matching emails arrive.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can CallMail break through Do Not Disturb mode?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes! Phone calls from CallMail can break through Do Not Disturb mode on most phones, ensuring you never miss critical emails even when your phone is silenced.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is CallMail free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, CallMail offers a free tier to get started. You can monitor your Gmail and receive phone calls for important emails without any upfront cost.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Does CallMail read my email content?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. CallMail only reads email metadata (sender address and subject line). We never access or store the body content of your emails, ensuring your privacy is protected.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  )
}
