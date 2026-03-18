import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "xyz.callmail.app",
  appName: "CallMail",
  webDir: "out",
  server: {
    // Point directly to /app for native app users
    url: "https://call-mail.xyz/app",
    // Allow navigation to external URLs (for OAuth)
    allowNavigation: ["accounts.google.com", "*.google.com", "call-mail.xyz"],
  },
  ios: {
    scheme: "CallMail",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
  plugins: {
    // We use a custom StoreKit plugin for In-App Purchases
  },
}

export default config
