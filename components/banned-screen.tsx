import { Mail, Ban } from "lucide-react"

export function BannedScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <Ban className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>

      <h1 className="text-2xl font-semibold mb-2">Account Suspended</h1>

      <p className="text-muted-foreground mb-8 max-w-sm">
        Your account has been suspended. If you believe this is a mistake, please contact support.
      </p>

      <a
        href="mailto:burke@omnisound.xyz"
        className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
      >
        <Mail className="w-4 h-4" />
        Contact Support
      </a>

      <p className="text-sm text-muted-foreground mt-4">burke@omnisound.xyz</p>
    </div>
  )
}
