import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "xyz.callmail.app",
  appName: "CallMail",
  webDir: "out",
  server: {
    // Use live URL so OAuth, cookies, and API calls work properly
    url: "https://call-mail.xyz",
    // Allow navigation to external URLs (for OAuth)
    allowNavigation: ["accounts.google.com", "*.google.com"],
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
