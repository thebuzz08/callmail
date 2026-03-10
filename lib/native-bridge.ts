/**
 * Native Bridge for Capacitor iOS App
 * Handles communication between web app and native iOS shell
 * 
 * This uses Capacitor with a custom StoreKit 2 plugin for in-app purchases.
 * See ios-plugin/CallMailIAP/ for the native Swift code.
 */

import { Capacitor, registerPlugin } from "@capacitor/core"

// Define the plugin interface
export interface CallMailIAPPlugin {
  getProducts(): Promise<{ products: IAPProduct[] }>
  purchase(options: { productId: string }): Promise<IAPPurchaseResult>
  restorePurchases(): Promise<IAPPurchaseResult>
  getSubscriptionStatus(): Promise<{ subscription: any; hasActiveSubscription: boolean }>
}

// Register the plugin
const CallMailIAP = registerPlugin<CallMailIAPPlugin>("CallMailIAP")

// Detect if running inside a native app
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false
  
  // Capacitor detection (primary method)
  if (Capacitor.isNativePlatform()) return true
  
  // Legacy: Median.co detection (if user hasn't migrated)
  if ((window as any).median) return true
  
  // Legacy: GoNative detection
  if ((window as any).gonative) return true
  
  return false
}

// Open URL using Median's openExternal (opens in system browser, can return via Universal Links)
export function openExternalUrl(url: string): void {
  if (typeof window === "undefined") return
  
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
  const platform = Capacitor.getPlatform()
  if (platform === "ios") return "ios"
  if (platform === "android") return "android"
  
  // Fallback to user agent
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return "ios"
  if (/android/.test(ua)) return "android"
  return "web"
}

// Product IDs for each platform
export const PRODUCTS = {
  ios: {
    monthly: "com.callmail.pro.monthly",
    annual: "com.callmail.pro.annual",
  },
  android: {
    monthly: "com.callmail.pro.monthly",
    annual: "com.callmail.pro.annual",
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
    // Use Capacitor plugin
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
    // Use Capacitor plugin - receipt validation is handled automatically in Swift
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
    // Use Capacitor plugin - receipt validation is handled automatically in Swift
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
    const result = await CallMailIAP.getSubscriptionStatus()
    return result
  } catch (error: any) {
    console.error("[IAP] Get subscription status failed:", error)
    return { hasActiveSubscription: false, subscription: null }
  }
}
