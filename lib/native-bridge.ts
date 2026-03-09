/**
 * Native Bridge for Median.co / GoNative.io WebView apps
 * Handles communication between web app and native iOS/Android shell
 * 
 * Median documentation: https://median.co/docs/iap
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
  return new Promise((resolve) => {
    if (!isNativeApp()) {
      resolve({ success: false, error: "Not running in native app" })
      return
    }

    // Median.co API
    if ((window as any).median?.iap) {
      (window as any).median.iap.purchase(productId, async (result: any) => {
        if (result.success && result.receipt) {
          // Validate receipt with our server
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
      return
    }

    // GoNative API
    if ((window as any).gonative?.iap) {
      (window as any).gonative.iap.purchase({
        productId,
        callback: async (result: any) => {
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
        },
      })
      return
    }

    resolve({ success: false, error: "No IAP handler found" })
  })
}

// Restore previous purchases
export async function restorePurchases(): Promise<IAPPurchaseResult> {
  return new Promise((resolve) => {
    if (!isNativeApp()) {
      resolve({ success: false, error: "Not running in native app" })
      return
    }

    // Median.co API
    if ((window as any).median?.iap) {
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
      return
    }

    // GoNative API
    if ((window as any).gonative?.iap) {
      (window as any).gonative.iap.restore({
        callback: async (result: any) => {
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
        },
      })
      return
    }

    resolve({ success: false, error: "No IAP handler found" })
  })
}
