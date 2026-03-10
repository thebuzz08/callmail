"use client"

import { Button } from "@/components/ui/button"
import { Check, Zap, RotateCcw } from "lucide-react"
import { useState, useEffect } from "react"
import { isNativeApp, getPlatform, purchaseProduct, restorePurchases, PRODUCTS } from "@/lib/native-bridge"
import { trackIAPInitiated, trackIAPCompleted, trackIAPFailed, trackIAPRestored, trackSubscriptionStarted } from "@/lib/analytics"

interface SubscriptionGateProps {
  userEmail?: string
  onBack?: () => void
  onSkip?: () => void
  onSubscriptionComplete?: () => void
}

const FEATURES = [
  "Unlimited VIP email contacts",
  "Domain-wide monitoring (@company.com)",
  "Custom subject keyword triggers",
  "Phone calls that break through DND",
  "Adjustable check frequency (1-5 min)",
  "Quiet hours / Do Not Disturb",
  "Call history and data export",
]

export function SubscriptionGate({ userEmail, onBack, onSkip, onSubscriptionComplete }: SubscriptionGateProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual")
  const [isNative, setIsNative] = useState(false)
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if running in native app on mount
    setIsNative(isNativeApp())
    setPlatform(getPlatform())
  }, [])

  const handleSubscribe = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // If in native iOS/Android app, use native IAP
      if (isNative && platform !== "web") {
        trackIAPInitiated(selectedPlan)
        const productId = PRODUCTS[platform][selectedPlan]
        const result = await purchaseProduct(productId)
        
        if (result.success) {
          trackIAPCompleted(selectedPlan)
          trackSubscriptionStarted(selectedPlan, "ios")
          // Purchase successful, subscription should be active
          onSubscriptionComplete?.()
          window.location.reload()
        } else {
          trackIAPFailed(selectedPlan, result.error || "Unknown error")
          setError(result.error || "Purchase failed")
        }
      } else {
        // Web: use Stripe checkout
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: selectedPlan }),
        })
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (e) {
      console.error("Failed to process subscription:", e)
      setError("Something went wrong. Please try again.")
    }
    setIsLoading(false)
  }

  const handleRestore = async () => {
    setIsRestoring(true)
    setError(null)
    
    try {
      const result = await restorePurchases()
      if (result.success) {
        trackIAPRestored()
        onSubscriptionComplete?.()
        window.location.reload()
      } else {
        setError(result.error || "No purchases found to restore")
      }
    } catch (e) {
      setError("Failed to restore purchases")
    }
    setIsRestoring(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-foreground" />
            <h1 className="text-3xl font-light tracking-tight text-foreground">CallMail</h1>
          </div>
          <p className="text-muted-foreground">
            Never miss an important email again
          </p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full p-1 glass squircle-sm">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                selectedPlan === "monthly"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan("annual")}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                selectedPlan === "annual"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1 text-xs opacity-75">Save $24</span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="rounded-2xl p-6 space-y-6 glass-card squircle animate-glass-in">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pro Plan</p>
            {selectedPlan === "monthly" ? (
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-semibold text-foreground">$6.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            ) : (
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-semibold text-foreground">$59.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {selectedPlan === "annual" 
                ? "7-day free trial, then $5/mo billed annually" 
                : "7-day free trial, cancel anytime"}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground">
                  <Check className="h-3 w-3 text-background" />
                </div>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            className="w-full rounded-full py-6 text-base spring-bounce glow-accent"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Start Free Trial"}
          </Button>

          {error && (
            <p className="text-center text-sm text-red-500">
              {error}
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {"You won't be charged until your 7-day trial ends. Cancel anytime."}
          </p>

          {/* Restore purchases - only show on native iOS/Android */}
          {isNative && platform !== "web" && (
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <RotateCcw className={`h-4 w-4 ${isRestoring ? "animate-spin" : ""}`} />
              {isRestoring ? "Restoring..." : "Restore Purchases"}
            </button>
          )}
        </div>

        {/* Skip option */}
        {onSkip && (
          <div className="text-center">
            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now and explore the app
            </button>
          </div>
        )}

        {/* Footer */}
        {userEmail && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{userEmail}</span>
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
