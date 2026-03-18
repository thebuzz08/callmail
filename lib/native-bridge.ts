/**
 * Native Bridge for Capacitor iOS App
 * Handles communication between web app and native iOS shell
 * 
 * This uses Capacitor with a custom StoreKit 2 plugin for in-app purchases.
 * See ios-plugin/CallMailIAP/ for the native Swift code.
 * 
 * Note: Capacitor is dynamically imported to avoid build errors on web (Vercel).
 */

// Define the IAP plugin interface
export interface CallMailIAPPlugin {
  getProducts(): Promise<{ products: IAPProduct[] }>
  purchase(options: { productId: string }): Promise<IAPPurchaseResult>
  restorePurchases(): Promise<IAPPurchaseResult>
  getSubscriptionStatus(): Promise<{ subscription: any; hasActiveSubscription: boolean }>
}

// Define the Push plugin interface
export interface CallMailPushPlugin {
  requestPermissions(): Promise<{ granted: boolean }>
  checkPermissions(): Promise<{ granted: boolean; status: string }>
  getToken(): Promise<{ token: string | null }>
}

// Capacitor plugin instances (initialized lazily)
let CallMailIAP: CallMailIAPPlugin | null = null
let CallMailPush: CallMailPushPlugin | null = null
let capacitorInitialized = false

// Initialize Capacitor plugins dynamically
async function initCapacitor(): Promise<boolean> {
  if (capacitorInitialized) return CallMailIAP !== null
  capacitorInitialized = true
  
  try {
    const { Capacitor, registerPlugin } = await import("@capacitor/core")
    if (Capacitor.isNativePlatform()) {
      CallMailIAP = registerPlugin<CallMailIAPPlugin>("CallMailIAP")
      CallMailPush = registerPlugin<CallMailPushPlugin>("CallMailPush")
      return true
    }
  } catch (e) {
    // Capacitor not available (running on web)
  }
  return false
}

// Detect if running inside a native app
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false
  
  // Check for Capacitor native platform indicator
  if ((window as any).Capacitor?.isNativePlatform?.()) return true
  
  // Legacy: Median.co detection (if user hasn't migrated)
  if ((window as any).median) return true
  
  // Legacy: GoNative detection
  if ((window as any).gonative) return true
  
  return false
}

// Open URL in system browser (for OAuth flows that need to return via Universal Links)
export async function openExternalUrl(url: string): Promise<void> {
  if (typeof window === "undefined") return
  
  // Try Capacitor Browser plugin first (opens Safari, allows return via Universal Links)
  try {
    const { Browser } = await import("@capacitor/browser")
    await Browser.open({ url, presentationStyle: "popover" })
    return
  } catch (e) {
    // Browser plugin not available
  }
  
  // Median.co API for opening external URLs
  if ((window as any).median?.share?.open) {
    (window as any).median.share.open({ url })
    return
  }
  
  // GoNative API
  if ((window as any).gonative?.open) {
    (window as any).gonative.open({ url })
    return
  }
  
  // Fallback: window.open for external browser
  window.open(url, "_blank")
}

// Navigate to URL within the app's WebView
export function navigateInApp(url: string): void {
  if (typeof window === "undefined") return
  
  // Median.co API for internal navigation
  if ((window as any).median?.webview?.navigate) {
    (window as any).median.webview.navigate({ url })
    return
  }
  
  // Fallback: direct navigation
  window.location.href = url
}

// Detect platform
export function getPlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web"
  
  // Capacitor platform detection
  const capacitorPlatform = (window as any).Capacitor?.getPlatform?.()
  if (capacitorPlatform === "ios") return "ios"
  if (capacitorPlatform === "android") return "android"
  
  // Fallback to user agent
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return "ios"
  if (/android/.test(ua)) return "android"
  return "web"
}

// Product IDs for each platform
export const PRODUCTS = {
  ios: {
    monthly: "xyz.callmail.pro.monthly",
    annual: "xyz.callmail.pro.annual",
    trial: "xyz.callmail.pro.trial",
  },
  android: {
    monthly: "xyz.callmail.pro.monthly",
    annual: "xyz.callmail.pro.annual",
    trial: "xyz.callmail.pro.trial",
  },
}

// Types for IAP
export interface IAPProduct {
  productId: string
  title: string
  description: string
  price: string
  priceValue: number
  currency: string
}

export interface IAPPurchaseResult {
  success: boolean
  productId?: string
  transactionId?: string
  receipt?: string
  error?: string
}

// Initialize IAP and get available products
export async function getProducts(): Promise<IAPProduct[]> {
  if (!isNativeApp()) {
    return []
  }

  const platform = getPlatform()
  if (platform === "web") {
    return []
  }

  try {
    await initCapacitor()
    if (!CallMailIAP) return []
    const result = await CallMailIAP.getProducts()
    return result.products || []
  } catch (error) {
    console.error("[IAP] Failed to get products:", error)
    return []
  }
}

// Purchase a product
export async function purchaseProduct(productId: string): Promise<IAPPurchaseResult> {
  if (!isNativeApp()) {
    return { success: false, error: "Not running in native app" }
  }

  try {
    await initCapacitor()
    if (!CallMailIAP) return { success: false, error: "Capacitor not available" }
    const result = await CallMailIAP.purchase({ productId })
    return result
  } catch (error: any) {
    console.error("[IAP] Purchase failed:", error)
    return { success: false, error: error.message || "Purchase failed" }
  }
}

// Restore previous purchases
export async function restorePurchases(): Promise<IAPPurchaseResult> {
  if (!isNativeApp()) {
    return { success: false, error: "Not running in native app" }
  }

  try {
    await initCapacitor()
    if (!CallMailIAP) return { success: false, error: "Capacitor not available" }
    const result = await CallMailIAP.restorePurchases()
    return result
  } catch (error: any) {
    console.error("[IAP] Restore failed:", error)
    return { success: false, error: error.message || "Restore failed" }
  }
}

// Get current subscription status from the native app
export async function getSubscriptionStatus(): Promise<{ hasActiveSubscription: boolean; subscription: any }> {
  if (!isNativeApp()) {
    return { hasActiveSubscription: false, subscription: null }
  }

  try {
    await initCapacitor()
    if (!CallMailIAP) return { hasActiveSubscription: false, subscription: null }
    const result = await CallMailIAP.getSubscriptionStatus()
    return result
  } catch (error: any) {
    console.error("[IAP] Get subscription status failed:", error)
    return { hasActiveSubscription: false, subscription: null }
  }
}

// ========================================
// Push Notifications
// ========================================

// Request push notification permissions
export async function requestPushPermissions(): Promise<boolean> {
  if (!isNativeApp()) {
    return false
  }

  try {
    await initCapacitor()
    if (!CallMailPush) return false
    const result = await CallMailPush.requestPermissions()
    return result.granted
  } catch (error: any) {
    console.error("[Push] Permission request failed:", error)
    return false
  }
}

// Check push notification permissions
export async function checkPushPermissions(): Promise<{ granted: boolean; status: string }> {
  if (!isNativeApp()) {
    return { granted: false, status: "web" }
  }

  try {
    await initCapacitor()
    if (!CallMailPush) return { granted: false, status: "not_available" }
    const result = await CallMailPush.checkPermissions()
    return result
  } catch (error: any) {
    console.error("[Push] Check permissions failed:", error)
    return { granted: false, status: "error" }
  }
}

// Get push notification token
export async function getPushToken(): Promise<string | null> {
  if (!isNativeApp()) {
    return null
  }

  try {
    await initCapacitor()
    if (!CallMailPush) return null
    const result = await CallMailPush.getToken()
    return result.token
  } catch (error: any) {
    console.error("[Push] Get token failed:", error)
    return null
  }
}

// Register push token with server
export async function registerPushToken(): Promise<boolean> {
  if (!isNativeApp()) {
    return false
  }

  try {
    // First request permissions
    const granted = await requestPushPermissions()
    if (!granted) {
      console.log("[Push] Permissions not granted")
      return false
    }

    // Wait a moment for the token to be generated
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Get the token
    const token = await getPushToken()
    if (!token) {
      console.log("[Push] No token available")
      return false
    }

    // Send to server
    const response = await fetch("/api/user/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushToken: token, platform: getPlatform() }),
    })

    return response.ok
  } catch (error: any) {
    console.error("[Push] Registration failed:", error)
    return false
  }
}
