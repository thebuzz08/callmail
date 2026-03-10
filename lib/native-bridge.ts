/**
 * Native Bridge for Median.co / GoNative.io WebView apps
 * Handles communication between web app and native iOS/Android shell
 * 
 * NOTE: This uses Median's native code injection for StoreKit access,
 * NOT the paid IAP plugin. The StoreKit bridge is injected via Custom JavaScript
 * in Median dashboard (see docs/median-storekit-bridge.js).
 * 
 * Median documentation: https://median.co/docs
 */

// Detect if running inside a native app
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false
  
  // Median.co detection
  if ((window as any).median) return true
  
  // GoNative detection
  if ((window as any).gonative) return true
  
  // iOS WebView detection (WKWebView)
  if ((window as any).webkit?.messageHandlers?.median) return true
  
  // Check user agent for common WebView indicators
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("median") || ua.includes("gonative")) return true
  
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
  return new Promise((resolve) => {
    if (!isNativeApp()) {
      resolve([])
      return
    }

    const platform = getPlatform()
    if (platform === "web") {
      resolve([])
      return
    }

    const productIds = Object.values(PRODUCTS[platform])

    // Median.co API
    if ((window as any).median?.iap) {
      (window as any).median.iap.getProducts(productIds, (products: IAPProduct[]) => {
        resolve(products || [])
      })
      return
    }

    // GoNative API
    if ((window as any).gonative?.iap) {
      (window as any).gonative.iap.getProducts({
        productIds,
        callback: (products: IAPProduct[]) => {
          resolve(products || [])
        },
      })
      return
    }

    resolve([])
  })
}

// Purchase a product
export async function purchaseProduct(productId: string): Promise<IAPPurchaseResult> {
  if (!isNativeApp()) {
    return { success: false, error: "Not running in native app" }
  }

  // Determine plan type from product ID
  const planType = productId.includes("monthly") ? "monthly" : "annual"

  // Use our custom StoreKit bridge (injected via Median Custom JavaScript)
  // See docs/median-storekit-bridge.js
  if ((window as any).CallMailIAP) {
    try {
      const result = await (window as any).CallMailIAP.purchase(planType)
      return {
        success: result.success,
        productId: productId,
        error: result.error,
      }
    } catch (e: any) {
      return { success: false, error: e.message || "Purchase failed" }
    }
  }

  // Fallback: Median.co paid IAP plugin (if they upgrade later)
  if ((window as any).median?.iap) {
    return new Promise((resolve) => {
      (window as any).median.iap.purchase(productId, async (result: any) => {
        if (result.success && result.receipt) {
          try {
            const response = await fetch("/api/apple/validate-receipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ receiptData: result.receipt }),
            })
            const data = await response.json()
            if (data.success) {
              resolve({
                success: true,
                productId: result.productId,
                transactionId: result.transactionId,
                receipt: result.receipt,
              })
            } else {
              resolve({ success: false, error: data.error || "Receipt validation failed" })
            }
          } catch (e) {
            resolve({ success: false, error: "Failed to validate receipt" })
          }
        } else {
          resolve({ success: false, error: result.error || "Purchase failed" })
        }
      })
    })
  }

  return { success: false, error: "No IAP handler found. Make sure the StoreKit bridge is loaded." }
}

// Restore previous purchases
export async function restorePurchases(): Promise<IAPPurchaseResult> {
  if (!isNativeApp()) {
    return { success: false, error: "Not running in native app" }
  }

  // Use our custom StoreKit bridge (injected via Median Custom JavaScript)
  if ((window as any).CallMailIAP) {
    try {
      const result = await (window as any).CallMailIAP.restore()
      return {
        success: result.success,
        error: result.error,
      }
    } catch (e: any) {
      return { success: false, error: e.message || "Restore failed" }
    }
  }

  // Fallback: Median.co paid IAP plugin
  if ((window as any).median?.iap) {
    return new Promise((resolve) => {
      (window as any).median.iap.restore(async (result: any) => {
        if (result.success && result.receipt) {
          try {
            const response = await fetch("/api/apple/validate-receipt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ receiptData: result.receipt }),
            })
            const data = await response.json()
            resolve({
              success: data.success,
              receipt: result.receipt,
              error: data.error,
            })
          } catch (e) {
            resolve({ success: false, error: "Failed to validate receipt" })
          }
        } else {
          resolve({ success: false, error: result.error || "No purchases to restore" })
        }
      })
    })
  }

  return { success: false, error: "No IAP handler found. Make sure the StoreKit bridge is loaded." }
}
