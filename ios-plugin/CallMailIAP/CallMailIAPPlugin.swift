import Foundation
import Capacitor
import StoreKit

@objc(CallMailIAPPlugin)
public class CallMailIAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CallMailIAPPlugin"
    public let jsName = "CallMailIAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSubscriptionStatus", returnType: CAPPluginReturnPromise)
    ]
    
    // Product IDs from App Store Connect
    private let productIds = [
        "com.callmail.pro.monthly",
        "com.callmail.pro.annual"
    ]
    
    private var products: [Product] = []
    private var purchasedProductIDs: Set<String> = []
    private var updateListenerTask: Task<Void, Error>?
    
    public override func load() {
        // Start listening for transaction updates
        updateListenerTask = listenForTransactions()
        
        // Load products on init
        Task {
            await loadProducts()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    // MARK: - Transaction Listener
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    
                    // Deliver product to user
                    await self.updateCustomerProductStatus()
                    
                    // Always finish a transaction
                    await transaction.finish()
                    
                    // Send receipt to backend for validation
                    await self.sendReceiptToBackend(transaction: transaction)
                } catch {
                    print("[CallMailIAP] Transaction verification failed: \(error)")
                }
            }
        }
    }
    
    // MARK: - Plugin Methods
    
    @objc func getProducts(_ call: CAPPluginCall) {
        Task {
            await loadProducts()
            
            let productData = products.map { product -> [String: Any] in
                return [
                    "productId": product.id,
                    "title": product.displayName,
                    "description": product.description,
                    "price": product.displayPrice,
                    "priceValue": NSDecimalNumber(decimal: product.price).doubleValue,
                    "currency": product.priceFormatStyle.currencyCode ?? "USD"
                ]
            }
            
            call.resolve(["products": productData])
        }
    }
    
    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Product ID is required")
            return
        }
        
        Task {
            do {
                guard let product = products.first(where: { $0.id == productId }) else {
                    // Try to load products if not loaded
                    await loadProducts()
                    guard let product = products.first(where: { $0.id == productId }) else {
                        call.reject("Product not found: \(productId)")
                        return
                    }
                    try await purchaseProduct(product, call: call)
                    return
                }
                
                try await purchaseProduct(product, call: call)
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                await updateCustomerProductStatus()
                
                // Check if any active subscriptions were restored
                for await result in Transaction.currentEntitlements {
                    do {
                        let transaction = try checkVerified(result)
                        
                        // Send receipt to backend
                        await sendReceiptToBackend(transaction: transaction)
                        
                        call.resolve([
                            "success": true,
                            "productId": transaction.productID,
                            "restored": true
                        ])
                        return
                    } catch {
                        continue
                    }
                }
                
                call.resolve([
                    "success": false,
                    "error": "No purchases to restore"
                ])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func getSubscriptionStatus(_ call: CAPPluginCall) {
        Task {
            await updateCustomerProductStatus()
            
            var activeSubscription: [String: Any]? = nil
            
            for await result in Transaction.currentEntitlements {
                do {
                    let transaction = try checkVerified(result)
                    
                    if transaction.productType == .autoRenewable {
                        activeSubscription = [
                            "productId": transaction.productID,
                            "originalTransactionId": String(transaction.originalID),
                            "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                            "expiresDate": transaction.expirationDate.map { ISO8601DateFormatter().string(from: $0) } as Any,
                            "isActive": true
                        ]
                        break
                    }
                } catch {
                    continue
                }
            }
            
            if let subscription = activeSubscription {
                call.resolve(["subscription": subscription, "hasActiveSubscription": true])
            } else {
                call.resolve(["subscription": NSNull(), "hasActiveSubscription": false])
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func loadProducts() async {
        do {
            products = try await Product.products(for: productIds)
            print("[CallMailIAP] Loaded \(products.count) products")
        } catch {
            print("[CallMailIAP] Failed to load products: \(error)")
        }
    }
    
    private func purchaseProduct(_ product: Product, call: CAPPluginCall) async throws {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            
            // Update local state
            await updateCustomerProductStatus()
            
            // Finish transaction
            await transaction.finish()
            
            // Send receipt to backend
            await sendReceiptToBackend(transaction: transaction)
            
            call.resolve([
                "success": true,
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "originalTransactionId": String(transaction.originalID)
            ])
            
        case .userCancelled:
            call.resolve([
                "success": false,
                "error": "User cancelled",
                "cancelled": true
            ])
            
        case .pending:
            call.resolve([
                "success": false,
                "error": "Purchase pending approval",
                "pending": true
            ])
            
        @unknown default:
            call.reject("Unknown purchase result")
        }
    }
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.failedVerification
        case .verified(let safe):
            return safe
        }
    }
    
    private func updateCustomerProductStatus() async {
        var purchasedIds: Set<String> = []
        
        for await result in Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                purchasedIds.insert(transaction.productID)
            } catch {
                print("[CallMailIAP] Transaction verification failed: \(error)")
            }
        }
        
        self.purchasedProductIDs = purchasedIds
    }
    
    private func sendReceiptToBackend(transaction: Transaction) async {
        // Get the app receipt
        guard let appStoreReceiptURL = Bundle.main.appStoreReceiptURL,
              FileManager.default.fileExists(atPath: appStoreReceiptURL.path),
              let receiptData = try? Data(contentsOf: appStoreReceiptURL) else {
            print("[CallMailIAP] No receipt found")
            return
        }
        
        let receiptString = receiptData.base64EncodedString()
        
        // Get the web view's URL to determine the backend
        guard let bridge = self.bridge,
              let webView = bridge.webView,
              let url = webView.url,
              let host = url.host else {
            print("[CallMailIAP] Could not determine backend URL")
            return
        }
        
        let backendURL = "\(url.scheme ?? "https")://\(host)/api/apple/validate-receipt"
        
        guard let requestURL = URL(string: backendURL) else {
            print("[CallMailIAP] Invalid backend URL")
            return
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Get session cookie from web view
        let cookies = await MainActor.run {
            return HTTPCookieStorage.shared.cookies(for: url) ?? []
        }
        let cookieHeader = cookies.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
        request.setValue(cookieHeader, forHTTPHeaderField: "Cookie")
        
        let body: [String: Any] = ["receiptData": receiptString]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                print("[CallMailIAP] Backend validation response: \(httpResponse.statusCode)")
                
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    print("[CallMailIAP] Backend response: \(json)")
                }
            }
        } catch {
            print("[CallMailIAP] Failed to send receipt to backend: \(error)")
        }
    }
}

// MARK: - Errors

enum StoreError: Error {
    case failedVerification
}
