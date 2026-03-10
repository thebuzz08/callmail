/**
 * CallMail StoreKit Bridge for Median
 * 
 * Copy this entire script into Median Dashboard:
 * App → Native Plugins → Custom Code → Custom JavaScript
 * 
 * This handles Apple In-App Purchases WITHOUT the paid Median IAP plugin.
 * It uses native StoreKit and communicates with your backend.
 */

// Product IDs (must match App Store Connect)
const PRODUCTS = {
  monthly: 'com.callmail.pro.monthly',
  annual: 'com.callmail.pro.annual'
};

// Your backend API URL
const API_BASE = 'https://call-mail.xyz';

/**
 * Initialize StoreKit and load products
 */
async function initializeIAP() {
  if (!window.median || !median.iap) {
    console.log('[CallMail] StoreKit not available (not in native app)');
    return false;
  }
  
  try {
    // Load available products from App Store
    const products = await median.iap.getProducts([
      PRODUCTS.monthly,
      PRODUCTS.annual
    ]);
    
    console.log('[CallMail] Products loaded:', products);
    
    // Store products for later use
    window.callmailProducts = products;
    
    // Check for any pending transactions
    await restorePurchases();
    
    return true;
  } catch (error) {
    console.error('[CallMail] Failed to initialize IAP:', error);
    return false;
  }
}

/**
 * Purchase a subscription
 * @param {string} productType - 'monthly' or 'annual'
 */
async function purchaseSubscription(productType) {
  const productId = PRODUCTS[productType];
  
  if (!productId) {
    console.error('[CallMail] Invalid product type:', productType);
    return { success: false, error: 'Invalid product' };
  }
  
  if (!window.median || !median.iap) {
    // Not in native app - redirect to web subscription
    window.location.href = '/app/settings?subscribe=true';
    return { success: false, error: 'Not in native app' };
  }
  
  try {
    console.log('[CallMail] Starting purchase for:', productId);
    
    // This shows Apple's native payment sheet
    const result = await median.iap.purchase(productId);
    
    if (result.success && result.receipt) {
      console.log('[CallMail] Purchase successful, validating receipt...');
      
      // Send receipt to your backend for validation
      const validation = await validateReceipt(result.receipt);
      
      if (validation.success) {
        console.log('[CallMail] Subscription activated!');
        
        // Refresh the page to show pro features
        window.location.reload();
        
        return { success: true, subscription: validation.subscription };
      } else {
        console.error('[CallMail] Receipt validation failed:', validation.error);
        return { success: false, error: validation.error };
      }
    } else {
      // User cancelled or error
      console.log('[CallMail] Purchase not completed:', result);
      return { success: false, error: result.error || 'Purchase cancelled' };
    }
  } catch (error) {
    console.error('[CallMail] Purchase error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate receipt with your backend
 * @param {string} receiptData - Base64 encoded receipt from StoreKit
 */
async function validateReceipt(receiptData) {
  try {
    const response = await fetch(`${API_BASE}/api/apple/validate-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({ receiptData }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, subscription: data.subscription };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('[CallMail] Validation request failed:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Restore previous purchases (e.g., after reinstall)
 */
async function restorePurchases() {
  if (!window.median || !median.iap) {
    return { success: false, error: 'Not in native app' };
  }
  
  try {
    console.log('[CallMail] Restoring purchases...');
    
    const result = await median.iap.restorePurchases();
    
    if (result.success && result.receipt) {
      // Validate the restored receipt
      const validation = await validateReceipt(result.receipt);
      
      if (validation.success) {
        console.log('[CallMail] Purchases restored successfully');
        return { success: true, subscription: validation.subscription };
      }
    }
    
    console.log('[CallMail] No purchases to restore');
    return { success: false, error: 'No purchases found' };
  } catch (error) {
    console.error('[CallMail] Restore failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check current subscription status
 */
async function checkSubscriptionStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/apple/subscription-status`, {
      credentials: 'include',
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    return { hasSubscription: false, status: 'unknown' };
  } catch (error) {
    console.error('[CallMail] Status check failed:', error);
    return { hasSubscription: false, status: 'error' };
  }
}

/**
 * Get formatted product prices
 */
function getProductPrices() {
  if (!window.callmailProducts) {
    return null;
  }
  
  const prices = {};
  
  window.callmailProducts.forEach(product => {
    if (product.productId === PRODUCTS.monthly) {
      prices.monthly = {
        price: product.price,
        priceFormatted: product.localizedPrice,
        currency: product.currency
      };
    } else if (product.productId === PRODUCTS.annual) {
      prices.annual = {
        price: product.price,
        priceFormatted: product.localizedPrice,
        currency: product.currency
      };
    }
  });
  
  return prices;
}

// Expose functions globally for use in your app
window.CallMailIAP = {
  initialize: initializeIAP,
  purchase: purchaseSubscription,
  restore: restorePurchases,
  checkStatus: checkSubscriptionStatus,
  getPrices: getProductPrices,
  products: PRODUCTS
};

// Auto-initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Median's bridge is ready
  setTimeout(() => {
    initializeIAP();
  }, 500);
});

console.log('[CallMail] StoreKit bridge loaded');
