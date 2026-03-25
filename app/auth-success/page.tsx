"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Capacitor } from "@capacitor/core"

export default function AuthSuccessPage() {
  useEffect(() => {
    const closeAuthPopup = async () => {
      // Wait for auth cookie to be set
      await new Promise(resolve => setTimeout(resolve, 800))

      console.log("[v0] Auth successful - closing popup")

      if (Capacitor.isNativePlatform()) {
        try {
          // Use Capacitor Browser to close the SFSafariViewController popup
          const { Browser } = await import("@capacitor/browser")
          console.log("[v0] Calling Browser.close()")
          await Browser.close()
          console.log("[v0] Browser closed successfully")
        } catch (error) {
          console.error("[v0] Browser.close() failed:", error)
          // Fallback: try window.close()
          try {
            window.close()
          } catch (e) {
            // If close fails, redirect to app
            window.location.href = "https://call-mail.xyz/app"
          }
        }
      } else {
        // Web: close popup window if opened as popup
        if (window.opener) {
          window.close()
        } else {
          // Regular navigation - redirect to app
          window.location.href = "https://call-mail.xyz/app"
        }
      }
    }

    closeAuthPopup()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold mb-2">Sign in successful!</h1>
      <p className="text-muted-foreground text-center">
        Returning to CallMail...
      </p>
    </div>
  )
}
