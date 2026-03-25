"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AuthSuccessPage() {
  useEffect(() => {
    // This page is shown after OAuth completes in the Safari popup
    // We need to close the popup and return to the app
    
    // Try to close the Safari View Controller by navigating to a custom scheme
    // or just redirect to the app - the cookies are already set
    
    // For Capacitor apps, we can try to trigger a return
    const returnToApp = () => {
      // First, try to use postMessage to communicate with the app
      if (window.opener) {
        window.opener.postMessage({ type: "auth-success" }, "*")
        window.close()
        return
      }
      
      // For SFSafariViewController, we redirect to the app URL
      // The Capacitor app will intercept this via its WebView
      window.location.href = "https://call-mail.xyz/app?auth=success"
    }
    
    // Small delay to ensure cookies are set
    setTimeout(returnToApp, 500)
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
