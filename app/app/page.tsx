"use client"

import { useState, useEffect } from "react"
import { OnboardingScreen } from "@/components/onboarding-screen"
import { LoginScreen } from "@/components/login-screen"
import { DashboardScreen } from "@/components/dashboard-screen"
import { SettingsScreen, type Theme } from "@/components/settings-screen"
import { SubscriptionGate } from "@/components/subscription-gate"
import { AppIntroScreen } from "@/components/app-intro-screen"
import { Mail } from "lucide-react"
import { registerPushToken } from "@/lib/native-bridge"

export type AppScreen = "intro" | "onboarding" | "login" | "dashboard" | "settings" | "banned" | "subscription"

export interface UserSession {
  userId?: string
  email: string
  name: string
}

export interface VipContact {
  id: string
  email: string
  name?: string
}

export interface Keyword {
  id: string
  keyword: string
}

export interface VipDomain {
  id: string
  domain: string
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift()
    return cookieValue ? decodeURIComponent(cookieValue) : null
  }
  return null
}

function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return

  const root = document.documentElement

  if (theme === "system") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", systemDark)
    root.classList.toggle("light", !systemDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
  }
}

export default function AppPage() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const authToken = params.get("auth_token")
      const clientCookie = getCookie("callmail_client")

      // If we have an auth_token from native OAuth flow, we need to exchange it
      if (authToken) {
        return "login" // Show login screen while exchanging token
      }
      if (code) {
        return "login"
      }
      if (clientCookie) {
        return "dashboard"
      }
    }
    // Start with intro screen for new users (shows login + app info)
    return "intro"
  })
  
  // Handle native app auth token exchange
  useEffect(() => {
    const exchangeNativeToken = async () => {
      if (typeof window === "undefined") return
      
      const params = new URLSearchParams(window.location.search)
      const authToken = params.get("auth_token")
      
      if (!authToken) return
      
      try {
        // Exchange the one-time token for session cookies in this WKWebView context
        const res = await fetch(`/api/auth/native-token?token=${authToken}`)
        const data = await res.json()
        
        if (data.success) {
          // Clear the token from URL and reload to apply cookies
          window.history.replaceState({}, "", "/app")
          window.location.reload()
        } else {
          console.error("Token exchange failed:", data.error)
          window.history.replaceState({}, "", "/app?error=token_exchange_failed")
          setCurrentScreen("intro")
        }
      } catch (error) {
        console.error("Native auth token exchange error:", error)
        window.history.replaceState({}, "", "/app?error=auth_failed")
        setCurrentScreen("intro")
      }
    }
    
    exchangeNativeToken()
  }, [])
  const [watchedEmails, setWatchedEmails] = useState<VipContact[]>([])
  const [watchedDomains, setWatchedDomains] = useState<VipDomain[]>([])
  const [watchedKeywords, setWatchedKeywords] = useState<Keyword[]>([])
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [userPhoneNumber, setUserPhoneNumber] = useState("")
  const [showPhoneSetup, setShowPhoneSetup] = useState(false)
  const [theme, setTheme] = useState<Theme>("light")
  const [checkIntervalMinutes, setCheckIntervalMinutes] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [isBanned, setIsBanned] = useState(false)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState("23:00")
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00")
  const [quietHoursTimezone, setQuietHoursTimezone] = useState("America/New_York")
  const [subscription, setSubscription] = useState<{
    status: string
    trial_end: string | null
    cancel_at_period_end: boolean
    current_period_end: string | null
  } | null>(null)

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/data")
      if (response.ok) {
        const data = await response.json()

        if (data.user?.is_banned) {
          setIsBanned(true)
          setCurrentScreen("banned")
          return
        }

        if (data.contacts) {
          setWatchedEmails(
            data.contacts.map((c: { id: string; email: string; name?: string }) => ({
              id: c.id,
              email: c.email,
              name: c.name,
            })),
          )
        }
        if (data.domains) {
          setWatchedDomains(
            data.domains.map((d: { id: string; domain: string }) => ({
              id: d.id,
              domain: d.domain,
            })),
          )
        }
        if (data.keywords) {
          setWatchedKeywords(
            data.keywords.map((k: { id: string; keyword: string }) => ({
              id: k.id,
              keyword: k.keyword,
            })),
          )
        }
        if (data.user?.phone_number) {
          setUserPhoneNumber(data.user.phone_number)
        }
        if (data.subscription) {
          console.log("[v0] Subscription data from API:", data.subscription)
          setSubscription(data.subscription)
        } else {
          console.log("[v0] No subscription found in API response")
        }
        if (data.settings) {
          if (data.settings.theme) {
            setTheme(data.settings.theme)
            applyTheme(data.settings.theme)
          }
          if (data.settings.check_interval_minutes) {
            setCheckIntervalMinutes(data.settings.check_interval_minutes)
          }
          if (data.settings.quiet_hours_enabled !== undefined) {
            setQuietHoursEnabled(data.settings.quiet_hours_enabled)
          }
          if (data.settings.quiet_hours_start) {
            setQuietHoursStart(data.settings.quiet_hours_start)
          }
          if (data.settings.quiet_hours_end) {
            setQuietHoursEnd(data.settings.quiet_hours_end)
          }
          if (data.settings.quiet_hours_timezone) {
            setQuietHoursTimezone(data.settings.quiet_hours_timezone)
          }
          if (!data.settings.phone_setup_completed && !data.user?.phone_number) {
            setShowPhoneSetup(true)
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch user data:", e)
    }
  }

  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true)
      const params = new URLSearchParams(window.location.search)

      // Check if returning from successful subscription checkout
      const subscriptionSuccess = params.get("subscription") === "success"
      
      // Clean up URL params after OAuth or subscription redirect
      if (params.get("auth") === "success" || params.get("subscription")) {
        window.history.replaceState({}, "", window.location.pathname)
      }

      // Read session from client cookie (non-sensitive data only)
      const clientCookie = getCookie("callmail_client")
      let session: UserSession | null = null

      if (clientCookie) {
        try {
          session = JSON.parse(clientCookie)
        } catch (e) {
          console.error("Failed to parse client session:", e)
        }
      }

      // Verify session is still valid server-side and refresh tokens if needed
      if (session) {
        try {
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.valid) {
              session = {
                ...session,
                email: data.email,
                name: data.name,
              }
            } else {
              // Only clear session if server explicitly says it's invalid
              // (not on network errors or other issues)
              console.log("[v0] Session invalid, clearing:", data.error)
              session = null
            }
          } else if (response.status === 401) {
            // Explicit auth failure - clear session
            console.log("[v0] Session expired (401), clearing")
            session = null
          }
          // On other errors (500, network), keep the session and try anyway
          // The API calls will fail gracefully if the token is actually invalid
        } catch (e) {
          // Network error - don't log out, just continue with existing session
          // User may just have spotty connection
          console.log("[v0] Session check failed (network), continuing with cached session")
        }
      }

      const savedTheme = localStorage.getItem("callmail_theme") as Theme | null
      if (savedTheme) {
        setTheme(savedTheme)
        applyTheme(savedTheme)
      } else {
        applyTheme("light")
      }

      if (session) {
        setUserSession(session)
        setCurrentScreen("dashboard")
        await fetchUserData()
        
        // Register for push notifications (if on iOS/Android app)
        registerPushToken().catch(e => console.error("[v0] Push token registration failed:", e))
        
        // If returning from successful checkout, poll for subscription update
        // (webhook may take a moment to process)
        if (subscriptionSuccess) {
          console.log("[v0] Polling for subscription status after checkout...")
          let attempts = 0
          const maxAttempts = 10
          const pollInterval = setInterval(async () => {
            attempts++
            try {
              const res = await fetch("/api/user/data")
              if (res.ok) {
                const data = await res.json()
                if (data.subscription && (data.subscription.status === "active" || data.subscription.status === "trialing")) {
                  console.log("[v0] Subscription found:", data.subscription.status)
                  setSubscription(data.subscription)
                  clearInterval(pollInterval)
                }
              }
            } catch (e) {
              console.error("[v0] Poll error:", e)
            }
            if (attempts >= maxAttempts) {
              console.log("[v0] Max poll attempts reached")
              clearInterval(pollInterval)
            }
          }, 2000) // Poll every 2 seconds
        }
      } else {
        if (params.get("code")) {
          setCurrentScreen("login")
        }
      }

      setIsLoading(false)
    }

    initSession()
  }, [])

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyTheme("system")

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("callmail_theme", theme)
    applyTheme(theme)
  }, [theme])

  const handleLogin = async (session: UserSession) => {
    setUserSession(session)
    await fetchUserData()
    
    // After login, show onboarding tutorial which will then lead to subscription
    // The onboarding teaches users about VIP contacts, domains, keywords
    setCurrentScreen("onboarding")
  }

  const handleLogout = () => {
  setUserSession(null)
  setWatchedEmails([])
  setWatchedKeywords([])
  setUserPhoneNumber("")
  localStorage.removeItem("callmail_theme")
  // Clear both session cookies
  document.cookie = "callmail_session=; Path=/; Max-Age=0"
  document.cookie = "callmail_client=; Path=/; Max-Age=0"
  setCurrentScreen("intro")
  }

  const addWatchedEmail = async (email: string) => {
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_contact", data: { email } }),
      })
      await fetchUserData()
    } catch (e) {
      console.error("Failed to add contact:", e)
    }
  }

  const removeWatchedEmail = async (contactId: string) => {
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_contact", data: { contactId } }),
      })
      setWatchedEmails((prev) => prev.filter((c) => c.id !== contactId))
    } catch (e) {
      console.error("Failed to remove contact:", e)
    }
  }

  const addWatchedDomain = async (domain: string) => {
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_domain", data: { domain } }),
      })
      await fetchUserData()
    } catch (e) {
      console.error("Failed to add domain:", e)
    }
  }

  const removeWatchedDomain = async (domainId: string) => {
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_domain", data: { domainId } }),
      })
      setWatchedDomains((prev) => prev.filter((d) => d.id !== domainId))
    } catch (e) {
      console.error("Failed to remove domain:", e)
    }
  }

  const addWatchedKeyword = async (keyword: string) => {
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_keyword", data: { keyword } }),
      })
      await fetchUserData()
    } catch (e) {
      console.error("Failed to add keyword:", e)
    }
  }

  const removeWatchedKeyword = async (keywordId: string) => {
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_keyword", data: { keywordId } }),
      })
      setWatchedKeywords((prev) => prev.filter((k) => k.id !== keywordId))
    } catch (e) {
      console.error("Failed to remove keyword:", e)
    }
  }

  const handlePhoneChange = async (phone: string) => {
    setUserPhoneNumber(phone)
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_phone", data: { phoneNumber: phone } }),
      })
    } catch (e) {
      console.error("Failed to update phone:", e)
    }
  }

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme)
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", data: { theme: newTheme } }),
      })
    } catch (e) {
      console.error("Failed to update theme:", e)
    }
  }

  const handleQuietHoursChange = async (settings: {
    quiet_hours_enabled?: boolean
    quiet_hours_start?: string
    quiet_hours_end?: string
    quiet_hours_timezone?: string
  }) => {
    if (settings.quiet_hours_enabled !== undefined) setQuietHoursEnabled(settings.quiet_hours_enabled)
    if (settings.quiet_hours_start) setQuietHoursStart(settings.quiet_hours_start)
    if (settings.quiet_hours_end) setQuietHoursEnd(settings.quiet_hours_end)
    if (settings.quiet_hours_timezone) setQuietHoursTimezone(settings.quiet_hours_timezone)

    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", data: settings }),
      })
    } catch (e) {
      console.error("Failed to update quiet hours:", e)
    }
  }

  const handleDeleteAccount = async () => {
    setUserSession(null)
    setWatchedEmails([])
    setWatchedKeywords([])
    setUserPhoneNumber("")
    localStorage.removeItem("callmail_theme")
    document.cookie = "callmail_session=; Path=/; Max-Age=0"
    document.cookie = "callmail_client=; Path=/; Max-Age=0"
    setCurrentScreen("onboarding")
  }

  const handleCheckIntervalChange = async (minutes: number) => {
    setCheckIntervalMinutes(minutes)
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_settings", data: { check_interval_minutes: minutes } }),
      })

      await fetch("/api/qstash/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", intervalMinutes: minutes }),
      })
    } catch (e) {
      console.error("Failed to update check interval:", e)
    }
  }

  const hasActiveSubscription = subscription && (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "incomplete" || // Add incomplete for payment processing
    (subscription.status === "canceled" && subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())
  )
  
  // Debug log for subscription status
  console.log("[v0] Subscription state:", { 
    subscription, 
    hasActiveSubscription,
    status: subscription?.status,
    current_period_end: subscription?.current_period_end
  })

  if (isLoading && currentScreen === "dashboard") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    )
  }

  if (currentScreen === "banned" || isBanned) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Account Suspended</h1>
            <p className="text-muted-foreground">
              Your account has been suspended. If you believe this is an error, please contact support.
            </p>
          </div>
          <div className="pt-4">
            <a
              href="mailto:burke@omnisound.xyz"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Contact burke@omnisound.xyz
            </a>
          </div>
        </div>
      </main>
    )
  }

  // After onboarding, show subscription if not subscribed
  const handleOnboardingComplete = () => {
    if (hasActiveSubscription) {
      setCurrentScreen("dashboard")
    } else {
      setCurrentScreen("subscription")
    }
  }

  return (
  <main className="min-h-screen bg-background">
      {currentScreen === "intro" && (
        <AppIntroScreen 
          onLogin={() => setCurrentScreen("login")} 
        />
      )}
      {currentScreen === "onboarding" && <OnboardingScreen onNext={() => setCurrentScreen("subscription")} />}
      {currentScreen === "login" && <LoginScreen onNext={handleLogin} onBack={() => setCurrentScreen("intro")} />}
      {currentScreen === "subscription" && (
        <SubscriptionGate 
          userEmail={userSession?.email} 
          onBack={handleLogout}
          onSkip={() => setCurrentScreen("dashboard")}
          onSubscriptionComplete={() => {
            fetchUserData()
            setCurrentScreen("dashboard")
          }}
        />
      )}
      {currentScreen === "dashboard" && (
        <DashboardScreen
          watchedEmails={watchedEmails}
          onAddEmail={addWatchedEmail}
          onRemoveEmail={removeWatchedEmail}
          watchedDomains={watchedDomains}
          onAddDomain={addWatchedDomain}
          onRemoveDomain={removeWatchedDomain}
          userSession={userSession}
          userPhoneNumber={userPhoneNumber}
          onPhoneChange={handlePhoneChange}
          watchedKeywords={watchedKeywords}
          onAddKeyword={addWatchedKeyword}
          onRemoveKeyword={removeWatchedKeyword}
          onOpenSettings={() => setCurrentScreen("settings")}
          checkIntervalMinutes={checkIntervalMinutes}
          showPhoneSetup={showPhoneSetup}
          onPhoneSetupComplete={() => setShowPhoneSetup(false)}
          hasActiveSubscription={hasActiveSubscription}
          onSubscribe={() => setCurrentScreen("subscription")}
        />
      )}
      {currentScreen === "settings" && (
        <SettingsScreen
          onBack={() => setCurrentScreen("dashboard")}
          theme={theme}
          onThemeChange={handleThemeChange}
          checkIntervalMinutes={checkIntervalMinutes}
          onCheckIntervalChange={handleCheckIntervalChange}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          userEmail={userSession?.email}
          quietHoursEnabled={quietHoursEnabled}
          quietHoursStart={quietHoursStart}
          quietHoursEnd={quietHoursEnd}
          quietHoursTimezone={quietHoursTimezone}
          onQuietHoursChange={handleQuietHoursChange}
          subscription={subscription}
        />
      )}
    </main>
  )
}
