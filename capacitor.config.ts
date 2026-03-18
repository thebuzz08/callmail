import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "xyz.callmail.app",
  appName: "CallMail",
  webDir: "out",
  server: {
    // Use your Vercel preview URL for testing
    // Change this to https://call-mail.xyz when ready for production
    url: "https://callmail-git-main-thebuzz08s-projects.vercel.app",
    // Allow navigation to external URLs (for OAuth)
    allowNavigation: ["accounts.google.com", "*.google.com", "*.vercel.app"],
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
