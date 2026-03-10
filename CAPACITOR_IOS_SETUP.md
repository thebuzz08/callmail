# CallMail iOS App - Complete Setup Guide

This guide walks you through building the CallMail iOS app with Capacitor, Google Sign-In, and In-App Purchases.

**Bundle ID:** `xyz.callmail.app`  
**Team ID:** `7N54XHKAPW`

---

# PART 1: Apple Developer Portal Setup

## Step 1.1: Register New App ID

1. Go to https://developer.apple.com/account
2. Click **Certificates, Identifiers & Profiles**
3. Click **Identifiers** in the left sidebar
4. Click the **+** button (top left)
5. Select **App IDs** → Click **Continue**
6. Select **App** → Click **Continue**
7. Fill in:
   - **Description:** `CallMail`
   - **Bundle ID:** Select **Explicit** and enter: `xyz.callmail.app`
8. Scroll down to **Capabilities** and check these boxes:
   - **Associated Domains**
   - **In-App Purchase**
   - **Push Notifications**
9. Click **Continue** → Click **Register**

## Step 1.2: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → Click **+** → Click **New App**
3. Fill in:
   - **Platforms:** Check **iOS**
   - **Name:** `CallMail`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select `xyz.callmail.app` from dropdown
   - **SKU:** `callmail-ios-001`
   - **User Access:** Full Access
4. Click **Create**

## Step 1.3: Create In-App Purchase Products

1. In your app in App Store Connect, click **Subscriptions** in the left sidebar
2. Next to "Subscription Groups", click the **+** button
3. Enter Group Reference Name: `CallMail Pro` → Click **Create**
4. Click into the **CallMail Pro** group
5. Click **+** next to "Subscriptions" to add:

**First subscription (Monthly):**
- Reference Name: `CallMail Pro Monthly`
- Product ID: `com.callmail.pro.monthly`
- Click **Create**
- Set **Subscription Duration:** 1 Month
- Set **Subscription Price:** $6.99 (or choose a price point)
- Click **Add Localization** → English (U.S.):
  - Display Name: `CallMail Pro Monthly`
  - Description: `Get phone calls for important emails. Unlimited VIP contacts, domains, and keywords. Break through Do Not Disturb. Cancel anytime.`
- Click **Save**

**Second subscription (Annual):**
- Reference Name: `CallMail Pro Annual`
- Product ID: `com.callmail.pro.annual`
- Click **Create**
- Set **Subscription Duration:** 1 Year
- Set **Subscription Price:** $59.99 (or choose a price point)
- Click **Add Localization** → English (U.S.):
  - Display Name: `CallMail Pro Annual`
  - Description: `Get phone calls for important emails. Unlimited VIP contacts, domains, and keywords. Break through Do Not Disturb. Save 29% with annual billing.`
- Click **Save**

## Step 1.4: Configure Apple Server Notifications

1. In App Store Connect, click **App Information** in the left sidebar
2. Scroll down to **App Store Server Notifications**
3. For **Production Server URL**, enter: `https://call-mail.xyz/api/apple/webhook`
4. Select **Version 2 Notifications**
5. Click **Save**

---

# PART 2: Get the Code on Your Mac

## Option A: Download ZIP from v0 (Easiest)

1. In v0, click the three dots (**⋯**) in the top right corner
2. Click **Download ZIP**
3. Find the downloaded ZIP in your Downloads folder
4. Double-click to unzip it
5. Open **Terminal** (press Cmd + Space, type "Terminal", press Enter)
6. Type this command and press Enter:
```bash
cd ~/Downloads/v0-project
```
(If the folder has a different name, adjust the command accordingly)

## Option B: Clone from GitHub

Open Terminal and run:
```bash
cd ~/Desktop
git clone https://github.com/thebuzz08/callmail.git
cd callmail
```

---

# PART 3: Build the iOS Project

Run these commands in Terminal, **one at a time**, pressing Enter after each:

## Step 3.1: Install dependencies
```bash
npm install
```
Wait for it to complete (may take a minute).

## Step 3.2: Add Capacitor iOS platform
```bash
npx cap add ios
```

## Step 3.3: Sync web content to iOS
```bash
npx cap sync ios
```

## Step 3.4: Open in Xcode
```bash
npx cap open ios
```

Xcode will launch automatically.

---

# PART 4: Configure Xcode

## Step 4.1: Add the Plugin Files

1. In Xcode, look at the **left sidebar** (called Project Navigator)
2. You'll see a folder structure like this:
   ```
   ▼ App
     ▼ App
       ▼ App
         AppDelegate.swift
         SceneDelegate.swift
         ...
   ```
3. **Right-click** on the innermost **App** folder (the one that contains `AppDelegate.swift`)
4. Click **Add Files to "App"...**
5. A file browser will open. Navigate to your project folder, then add files from **BOTH** plugin folders:

**First, add the IAP plugin files from `ios-plugin/CallMailIAP/`:**
- `CallMailIAPPlugin.swift`
- `CallMailIAPPlugin.m`

**Then repeat and add the Push plugin files from `ios-plugin/CallMailPush/`:**
- `CallMailPushPlugin.swift`
- `CallMailPushPlugin.m`

6. For each, make sure these options are set:
   - **"Copy items if needed"** is CHECKED
   - **"Create groups"** is selected (not "Create folder references")
   - Under "Add to targets", **"App"** is CHECKED
7. Click **Add**

You should now see all 4 plugin files in the left sidebar under the App folder.

## Step 4.2: Find the Signing Settings

1. In the left sidebar, click on **"App"** at the very top (it has a blue icon that looks like a small building/blueprint)
2. The center of Xcode will change to show project settings
3. On the left side of the center panel, under **TARGETS**, click **"App"**
4. At the top of the center panel, you'll see tabs: **General | Signing & Capabilities | ...**
5. Click **"Signing & Capabilities"**

## Step 4.3: Configure Signing

1. Make sure **"Automatically manage signing"** is checked
2. For **Team**, click the dropdown and select your Apple Developer account
   - It should show your name or company name
   - If it says "Add Account", click it and sign in with your Apple ID
3. For **Bundle Identifier**, change it to: `xyz.callmail.app`
   - Triple-click to select all, then type the new value
4. Xcode will automatically create a provisioning profile

## Step 4.4: Add Required Capabilities

1. While still on the **Signing & Capabilities** tab, click **+ Capability** (button in the top left of this section)
2. In the search box, type: `In-App Purchase`
3. Double-click **In-App Purchase** to add it
4. Click **+ Capability** again
5. Type: `Push Notifications`
6. Double-click **Push Notifications** to add it
7. Click **+ Capability** again
8. Type: `Associated Domains`
9. Double-click **Associated Domains** to add it
10. Under the new **Associated Domains** section, click **+** and add:
    - `applinks:call-mail.xyz`
11. Click **+** again and add:
    - `webcredentials:call-mail.xyz`

## Step 4.5: Verify Everything Looks Right

Your Signing & Capabilities tab should show:
- **Team:** Your Apple Developer account
- **Bundle Identifier:** `xyz.callmail.app`
- **Signing Certificate:** Apple Development: [your email]
- **Provisioning Profile:** Xcode Managed Profile
- **Capabilities listed:** Associated Domains, In-App Purchase, Push Notifications

---

# PART 5: Build and Run on Your iPhone

## Step 5.1: Connect Your iPhone

1. Connect your iPhone 13 Pro to your Mac with a USB/Lightning cable
2. If your iPhone asks "Trust This Computer?", tap **Trust** and enter your passcode
3. In Xcode, at the top of the window, you'll see a dropdown that probably says "Any iOS Device (arm64)" or an iPhone simulator name
4. Click that dropdown
5. Under **iOS Devices**, select your **iPhone** (it should show your iPhone's name)

## Step 5.2: Build and Run

1. Press **Cmd + R** (or click the Play ▶ button in the top left)
2. The first build takes a few minutes
3. You may see a prompt on your Mac asking for your login password - enter it
4. On your iPhone, you may see:
   - **"Developer Mode Required"** → Go to Settings > Privacy & Security > Developer Mode → Turn ON → Restart
   - **"Untrusted Developer"** → Go to Settings > General > VPN & Device Management → Tap your developer email → Tap "Trust"
5. The app will install and launch on your iPhone

## Step 5.3: Test Google Sign-In

1. In the app, tap **Sign in with Google**
2. A web page will open for Google sign-in
3. Sign in with your Google account
4. Grant the permissions requested
5. You should be redirected back to the app and see your dashboard

## Step 5.4: Set Up Sandbox Testing for Purchases

1. On your iPhone, open **Settings**
2. Scroll down and tap **App Store**
3. Scroll to the bottom and tap **Sandbox Account**
4. Sign in with your Sandbox tester account
   - If you haven't created one: Go to App Store Connect → Users and Access → Sandbox → Testers → Add (+)
   - Create a tester with a fake email (doesn't need to be real)

## Step 5.5: Test In-App Purchases

1. In the CallMail app, try to subscribe or access a pro feature
2. Apple's sandbox payment sheet should appear
3. It will show **[Environment: Sandbox]** at the top
4. Complete the purchase with Face ID/Touch ID
5. The subscription should activate

---

# PART 6: Submit to TestFlight

## Step 6.1: Archive the App

1. In Xcode, click the device dropdown at the top and select **"Any iOS Device (arm64)"** (not a specific device)
2. Go to menu **Product** → **Archive**
3. Wait for the archive to build (may take a few minutes)
4. When complete, the **Organizer** window opens automatically

## Step 6.2: Upload to App Store Connect

1. In the Organizer window, make sure your archive is selected
2. Click **Distribute App**
3. Select **App Store Connect** → Click **Next**
4. Select **Upload** → Click **Next**
5. Keep the default options checked → Click **Next**
6. Select your distribution certificate → Click **Next**
7. Review the summary → Click **Upload**
8. Wait for the upload to complete (may take several minutes)
9. Click **Done**

## Step 6.3: Configure TestFlight

1. Go to https://appstoreconnect.apple.com
2. Click your app → Click **TestFlight** tab
3. Wait for the build to appear and process (15-30 minutes)
4. Click on the build number
5. If prompted, click **Manage Missing Compliance** and answer the export compliance question (usually "No" for standard encryption)
6. The build should now be available for testing

## Step 6.4: Add Testers

**Internal Testing (your team):**
1. Click **Internal Testing** → **App Store Connect Users**
2. Click **+** to add testers from your App Store Connect team

**External Testing (beta users):**
1. Click **External Testing** → Click **+** to create a group
2. Add testers by email or create a public link

---

# PART 7: Submit to App Store (When Ready)

1. In App Store Connect, click your app
2. Click the **App Store** tab
3. Under **iOS App**, click the blue **+** next to version number
4. Fill in all required information:
   - **Screenshots** for different device sizes
   - **Promotional Text** (optional)
   - **Description**
   - **Keywords**
   - **Support URL:** `https://call-mail.xyz/support`
   - **Marketing URL:** `https://call-mail.xyz`
5. Under **Build**, click **+** and select your TestFlight build
6. Scroll down and fill in:
   - **App Review Information** (contact info for Apple reviewer)
   - **Version Release** (Manually or Automatically)
7. Click **Save** at the top right
8. Click **Add for Review**
9. Click **Submit to App Review**

---

# Troubleshooting

## "Signing certificate not found"
→ In Xcode: Menu **Xcode** → **Settings** → **Accounts** → Select your Apple ID → Click **Download Manual Profiles**

## "Bundle ID already exists"
→ Make sure you registered `xyz.callmail.app` in Step 1.1 of this guide first

## App shows white/blank screen
→ The app loads from your live website (call-mail.xyz). Make sure you have internet connection.

## "No products found" for In-App Purchases
→ Products must be in "Ready to Submit" status in App Store Connect
→ Make sure you signed the Paid Apps Agreement

## "Untrusted Developer" on iPhone
→ Go to iPhone Settings → General → VPN & Device Management → Tap your developer account → Trust

## Build fails with errors
→ In Xcode menu: **Product** → **Clean Build Folder** (Cmd + Shift + K)
→ Try building again

---

# Quick Reference

**Bundle ID:** `xyz.callmail.app`  
**Team ID:** `7N54XHKAPW`  
**Product IDs:**
- `com.callmail.pro.monthly`
- `com.callmail.pro.annual`

**Terminal Commands:**
```bash
npm install              # Install dependencies
npx cap add ios          # Create iOS project
npx cap sync ios         # Sync changes to iOS
npx cap open ios         # Open in Xcode
```

**Important URLs:**
- Apple Developer: https://developer.apple.com/account
- App Store Connect: https://appstoreconnect.apple.com
- Google Cloud Console: https://console.cloud.google.com
