"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Check } from "lucide-react"
import type { UserSession } from "@/app/app/page"
import { isNativeApp, openExternalUrl } from "@/lib/native-bridge"

interface LoginScreenProps {
  onNext: (session: UserSession) => void
  onBack: () => void
}

export function LoginScreen({ onNext, onBack }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for OAuth callback on mount and when returning from OAuth
  const checkForAuthCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const errorParam = params.get("error")

    if (errorParam) {
      setError("Google login was cancelled or failed. Please try again.")
      setIsLoading(false)
      window.history.replaceState({}, "", window.location.pathname)
      return
    }

    if (code) {
      setIsLoading(true)

      try {
        const res = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
        const data = await res.json()
        
        if (data.error) {
          setError(data.error)
          setIsLoading(false)
        } else {
          onNext({
            email: data.email,
            name: data.name,
          })
        }
      } catch {
        setError("Failed to complete login. Please try again.")
        setIsLoading(false)
      }
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [onNext])

  useEffect(() => {
    checkForAuthCallback()
    
    // For WebView apps: listen for when the app becomes visible again
    // This handles the case where OAuth opens externally and returns
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForAuthCallback()
      }
    }
    
    const handleFocus = () => {
      checkForAuthCallback()
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [checkForAuthCallback])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/google")
      const data = await res.json()

      if (data.url) {
        // For native apps, open in system browser so Google OAuth works properly
        // The callback will redirect back and Universal Links will return to the app
        if (isNativeApp()) {
          openExternalUrl(data.url)
        } else {
          // Web: normal redirect
          window.location.href = data.url
        }
      } else {
        setError("Failed to initiate Google login")
        setIsLoading(false)
      }
    } catch {
      setError("Failed to connect to Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with back button */}
      <div className="flex items-center px-6 pt-12">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-8 pt-4">
        <div className="h-1 w-full rounded-full bg-muted">
          <div className="h-1 w-full rounded-full bg-foreground" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="relative mb-8 h-64 w-full max-w-xs">
          {/* Background circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-muted/50" />
          </div>

          {/* Gmail icon - left */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background shadow-sm border border-border">
              <svg className="h-7 w-7" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                />
              </svg>
            </div>
          </div>

          {/* CallMail icon - right */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Image
              src="/images/callmail-contact-photo.jpg"
              alt="CallMail"
              width={56}
              height={56}
              className="rounded-xl shadow-sm border border-border"
            />
          </div>

          {/* Center checkmark */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground bg-background">
              <Check className="h-5 w-5 text-foreground" strokeWidth={3} />
            </div>
          </div>

          {/* Curved arrows */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 220" fill="none">
            {/* Arrow from Gmail to center */}
            <path
              d="M85 95 Q 120 60, 130 95"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-foreground"
            />
            <path d="M127 90 L130 97 L123 96" fill="currentColor" className="text-foreground" />
            {/* Arrow from CallMail to center */}
            <path
              d="M195 125 Q 160 160, 150 125"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-foreground"
            />
            <path d="M153 130 L150 123 L157 124" fill="currentColor" className="text-foreground" />
          </svg>

          {/* Floating labels */}
          <span className="absolute left-0 top-6 text-sm font-medium text-foreground">VIP Emails</span>
          <span className="absolute left-2 top-[75%] text-sm font-medium text-foreground">Keywords</span>
          <span className="absolute right-0 top-8 text-sm font-medium text-foreground">Instant</span>
          <span className="absolute right-4 top-[72%] text-sm font-medium text-foreground">Calls</span>
        </div>

        <h1 className="mb-2 text-center text-2xl font-medium text-foreground">Connect to Gmail</h1>
        <p className="mb-2 text-center text-sm text-muted-foreground">
          We only read emails, never send or modify them.
        </p>

        {error && <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>}
      </div>

      <div className="px-8 pb-12">
        <Button
          className="w-full rounded-full py-6 text-base font-medium"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            "Continue"
          )}
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a 
            href="https://call-mail.xyz/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a 
            href="https://call-mail.xyz/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
