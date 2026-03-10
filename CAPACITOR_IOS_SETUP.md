# CallMail iOS App - Capacitor Setup Guide

This guide walks you through building the CallMail iOS app using Capacitor with native StoreKit 2 in-app purchases.

## Prerequisites

- macOS with Xcode 15+ installed
- Apple Developer Account (you have this)
- Node.js 18+ installed
- Your App Store Connect products created (com.callmail.pro.monthly, com.callmail.pro.annual)

---

## Step 1: Install Dependencies

Open Terminal in your project folder and run:

```bash
npm install
```

This installs Capacitor and all required dependencies.

---

## Step 2: Create the iOS Project

```bash
npx cap add ios
```

This creates an `ios/` folder with the Xcode project.

---

## Step 3: Add the StoreKit Plugin to Xcode

1. Open the iOS project:
   ```bash
   npx cap open ios
   ```

2. In Xcode, right-click on the **App** folder in the left sidebar and select **"Add Files to 'App'..."**

3. Navigate to `ios-plugin/CallMailIAP/` in your project folder

4. Select both files:
   - `CallMailIAPPlugin.swift`
   - `CallMailIAPPlugin.m`

5. Make sure **"Copy items if needed"** is checked, then click **Add**

---

## Step 4: Configure Signing & Capabilities

1. In Xcode, click on the **App** project in the left sidebar (blue icon at top)

2. Select the **App** target, then the **Signing & Capabilities** tab

3. Set your **Team** to your Apple Developer account (7N54XHKAPW)

4. Set **Bundle Identifier** to: `co.median.ios.qddwkjj`

5. Click **+ Capability** and add:
   - **In-App Purchase**
   - **Push Notifications** (for call alerts)

---

## Step 5: Configure App Transport Security

The app needs to communicate with your backend. In Xcode:

1. Open `ios/App/App/Info.plist`

2. The default Capacitor config should allow HTTPS connections. If you need to test locally, add:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>call-mail.xyz</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
        </dict>
    </dict>
</dict>
```

---

## Step 6: Build the Web App

Before building the iOS app, you need to export the Next.js app as static files:

1. Open `next.config.mjs` and **uncomment** this line:
   ```js
   output: "export",
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

3. Sync with Capacitor:
   ```bash
   npx cap sync ios
   ```

**Important:** Remember to comment out `output: "export"` again before deploying to Vercel!

---

## Step 7: Test on Simulator

1. In Xcode, select an iPhone simulator from the device dropdown

2. Press **Cmd+R** or click the **Play** button to build and run

3. The app should load your web app with native in-app purchase capability

---

## Step 8: Test In-App Purchases (Sandbox)

1. On your iPhone (or simulator), go to **Settings > App Store > Sandbox Account**

2. Sign in with your sandbox tester account (created in App Store Connect)

3. In the app, try to subscribe

4. Apple's sandbox payment sheet should appear

5. Complete the purchase with your sandbox account

6. Check your Supabase `subscriptions` table - a new row should appear with `platform: 'apple'`

---

## Step 9: Build for TestFlight

1. In Xcode, select **Any iOS Device (arm64)** from the device dropdown

2. Go to **Product > Archive**

3. Once archiving completes, the Organizer window opens

4. Click **Distribute App** > **App Store Connect** > **Upload**

5. Follow the prompts to upload to App Store Connect

6. In App Store Connect, go to your app > **TestFlight**

7. Wait for Apple to process the build (usually 15-30 minutes)

8. Add yourself as a tester and install via TestFlight

---

## Step 10: Submit to App Store

1. In App Store Connect, go to your app > **App Store** tab

2. Fill in all required metadata:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL: `https://call-mail.xyz/privacy`

3. Select the build from TestFlight

4. Submit for Review

---

## Troubleshooting

### "No products found"

- Make sure your products in App Store Connect are in "Ready to Submit" status
- The product IDs must match exactly: `com.callmail.pro.monthly`, `com.callmail.pro.annual`
- You've signed the Paid Apps Agreement

### "Purchase failed"

- Make sure you're using a Sandbox tester account
- Check that In-App Purchase capability is added in Xcode
- Verify APPLE_SHARED_SECRET is set in Vercel environment variables

### App shows blank white screen

- Check that `output: "export"` is uncommented in next.config.mjs
- Run `npm run build` again
- Run `npx cap sync ios`

### Build errors in Xcode

- Clean the build: **Product > Clean Build Folder**
- Update CocoaPods: `cd ios && pod install`

---

## File Structure

```
/
├── capacitor.config.ts      # Capacitor configuration
├── ios/                     # Generated Xcode project (after `cap add ios`)
├── ios-plugin/
│   └── CallMailIAP/
│       ├── CallMailIAPPlugin.swift   # StoreKit 2 implementation
│       └── CallMailIAPPlugin.m       # Objective-C bridge
├── lib/
│   └── native-bridge.ts     # JavaScript bridge to native code
├── app/
│   └── api/
│       └── apple/
│           ├── validate-receipt/route.ts   # Receipt validation
│           └── webhook/route.ts            # Apple server notifications
└── out/                     # Static export (created by `next build`)
```

---

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Build web app for iOS
npm run build:ios

# Open Xcode
npm run cap:open:ios

# Sync web changes to iOS
npm run cap:sync

# Full rebuild
npm run build && npx cap sync ios
```

---

## Support

If you have issues:
1. Check the Xcode console for error messages
2. Check your Supabase `audit_logs` table for backend errors
3. Verify all environment variables are set in Vercel
