import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "co.median.ios.qddwkjj",
  appName: "CallMail",
  webDir: "out",
  server: {
    // In production, the app loads from the bundled files
    // For development, you can use a live URL:
    // url: "http://localhost:3000",
    // cleartext: true,
  },
  ios: {
    scheme: "CallMail",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    // Allow navigation to your domain for OAuth
    allowsLinkPreview: true,
    scrollEnabled: true,
  },
  plugins: {
    // We use a custom StoreKit plugin, not a third-party one
  },
}

export default config
