import { track } from "@vercel/analytics"

/**
 * Custom analytics events for CallMail
 * 
 * Vercel Analytics automatically tracks page views and Core Web Vitals.
 * These custom events track specific user actions for business insights.
 */

// User authentication events
export function trackSignIn(method: "google") {
  track("sign_in", { method })
}

export function trackSignOut() {
  track("sign_out")
}

// Subscription events
export function trackSubscriptionStarted(plan: "monthly" | "annual", source: "web" | "ios") {
  track("subscription_started", { plan, source })
}

export function trackSubscriptionCancelled(plan: "monthly" | "annual") {
  track("subscription_cancelled", { plan })
}

export function trackTrialStarted() {
  track("trial_started")
}

// Feature usage events
export function trackVipAdded(type: "contact" | "domain" | "keyword") {
  track("vip_added", { type })
}

export function trackVipRemoved(type: "contact" | "domain" | "keyword") {
  track("vip_removed", { type })
}

export function trackCallTriggered(reason: "vip_contact" | "vip_domain" | "keyword") {
  track("call_triggered", { reason })
}

export function trackCallCompleted(duration: number, answered: boolean) {
  track("call_completed", { duration, answered })
}

// Onboarding events
export function trackOnboardingStep(step: number, stepName: string) {
  track("onboarding_step", { step, stepName })
}

export function trackOnboardingCompleted() {
  track("onboarding_completed")
}

// Settings events
export function trackSettingsChanged(setting: string) {
  track("settings_changed", { setting })
}

// Error events
export function trackError(errorType: string, message: string) {
  track("error", { errorType, message })
}

// IAP events (iOS specific)
export function trackIAPInitiated(product: "monthly" | "annual") {
  track("iap_initiated", { product })
}

export function trackIAPCompleted(product: "monthly" | "annual") {
  track("iap_completed", { product })
}

export function trackIAPFailed(product: "monthly" | "annual", error: string) {
  track("iap_failed", { product, error })
}

export function trackIAPRestored() {
  track("iap_restored")
}

// Push notification events
export function trackPushPermissionRequested() {
  track("push_permission_requested")
}

export function trackPushPermissionGranted() {
  track("push_permission_granted")
}

export function trackPushPermissionDenied() {
  track("push_permission_denied")
}
