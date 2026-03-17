import Foundation
import Capacitor
import UserNotifications

@objc(CallMailPushPlugin)
public class CallMailPushPlugin: CAPPlugin, UNUserNotificationCenterDelegate {
    
    private var notificationCenter: UNUserNotificationCenter {
        return UNUserNotificationCenter.current()
    }
    
    public override func load() {
        notificationCenter.delegate = self
    }
    
    // Request push notification permissions
    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        notificationCenter.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                call.reject("Permission request failed: \(error.localizedDescription)")
                return
            }
            
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                call.resolve([
                    "granted": granted
                ])
            }
        }
    }
    
    // Check current permission status
    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        notificationCenter.getNotificationSettings { settings in
            let granted = settings.authorizationStatus == .authorized
            call.resolve([
                "granted": granted,
                "status": self.authorizationStatusToString(settings.authorizationStatus)
            ])
        }
    }
    
    // Get the device push token (called from AppDelegate after registration)
    @objc func getToken(_ call: CAPPluginCall) {
        // The token is stored when didRegisterForRemoteNotificationsWithDeviceToken is called
        if let token = UserDefaults.standard.string(forKey: "callmail_push_token") {
            call.resolve([
                "token": token
            ])
        } else {
            call.resolve([
                "token": NSNull()
            ])
        }
    }
    
    // Store the push token (called from AppDelegate)
    public static func storeToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: "callmail_push_token")
    }
    
    private func authorizationStatusToString(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "notDetermined"
        case .denied:
            return "denied"
        case .authorized:
            return "authorized"
        case .provisional:
            return "provisional"
        case .ephemeral:
            return "ephemeral"
        @unknown default:
            return "unknown"
        }
    }
    
    // Handle notification when app is in foreground
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       willPresent notification: UNNotification,
                                       withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
        
        // Notify JavaScript
        notifyListeners("pushNotificationReceived", data: [
            "title": notification.request.content.title,
            "body": notification.request.content.body,
            "data": notification.request.content.userInfo
        ])
    }
    
    // Handle notification tap
    public func userNotificationCenter(_ center: UNUserNotificationCenter,
                                       didReceive response: UNNotificationResponse,
                                       withCompletionHandler completionHandler: @escaping () -> Void) {
        let notification = response.notification
        
        notifyListeners("pushNotificationActionPerformed", data: [
            "title": notification.request.content.title,
            "body": notification.request.content.body,
            "data": notification.request.content.userInfo,
            "actionId": response.actionIdentifier
        ])
        
        completionHandler()
    }
}
