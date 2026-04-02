"use client"

import { useEffect, useState, Suspense } from "react"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

function AuthSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const completeAuth = async () => {
      const token = searchParams.get("token")
      
      if (!token) {
        // No token - redirect to app (web flow with cookies already set)
        window.location.href = "https://call-mail.xyz/app"
        return
      }

      // Native app flow: Pass token to app page
      // The app page (running in WKWebView) will exchange the token for cookies
      // We can't do it here because this page runs in SFSafariViewController
      setStatus("success")
      window.location.href = `https://call-mail.xyz/app?auth_token=${token}`
    }

    completeAuth()
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold mb-2">
        {status === "loading" && "Signing you in..."}
        {status === "success" && "Sign in successful!"}
        {status === "error" && "Sign in failed"}
      </h1>
      <p className="text-muted-foreground text-center">
        {status === "loading" && "Please wait..."}
        {status === "success" && "Redirecting to CallMail..."}
        {status === "error" && "Redirecting back to try again..."}
      </p>
    </div>
  )
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h1 className="text-xl font-semibold mb-2">Signing you in...</h1>
        <p className="text-muted-foreground text-center">Please wait...</p>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  )
}
