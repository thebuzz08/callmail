# Median.co Setup Guide for CallMail

This guide walks you through setting up CallMail as an iOS app using Median.co.

## Prerequisites

1. Apple Developer Account ($99/year) - developer.apple.com
2. App created in App Store Connect with In-App Purchases configured
3. Median.co account

## Step 1: Create Your App on Median.co

1. Go to median.co and sign up/log in
2. Click "Create New App"
3. Enter your website URL: `https://call-mail.xyz/app`
4. App name: `CallMail`

## Step 2: Configure App Settings

### General Settings
- App Name: CallMail
- App Icon: Upload your icon (1024x1024)
- Start URL: `https://call-mail.xyz/app`

### Navigation
- Disable native navigation bar (your web app has its own)
- Enable swipe back gesture: Yes
- Enable pull to refresh: Yes

### Appearance
- Status bar style: Dark content (or Light if you have dark theme)
- Disable bounce/overscroll: Yes

## Step 3: Enable In-App Purchases

This is the critical part for subscriptions to work.

### In Median Dashboard:
1. Go to "Native Plugins" → "In-App Purchases"
2. Enable In-App Purchases
3. Add your product IDs:
   - `com.callmail.pro.monthly`
   - `com.callmail.pro.annual`

### In App Store Connect:
1. Make sure your products are created:
   - com.callmail.pro.monthly - $6.99/month auto-renewable
   - com.callmail.pro.annual - $59.99/year auto-renewable
2. Products must be in "Ready to Submit" or "Approved" status
3. Add App-Specific Shared Secret (copy to your server env vars)

## Step 4: Configure Server Notifications

In App Store Connect → Your App → App Information:
- App Store Server Notifications URL: `https://call-mail.xyz/api/apple/webhook`
- Select Version 2 Notifications

## Step 5: How It Works

The web app automatically detects when it's running inside Median:

1. User taps "Start Free Trial" 
2. Web app detects native environment
3. Calls Median's native IAP purchase flow
4. Native Apple Pay sheet appears
5. After purchase, receipt is sent to your server
6. Server validates with Apple and activates subscription
7. User is redirected to dashboard

For web users (not in the app), Stripe checkout is used instead.

## Step 6: Build & Test

1. In Median, click "Build" → "iOS"
2. Download the Xcode project
3. Open in Xcode on your Mac
4. Connect your iPhone
5. Run the app on your device
6. Test the purchase flow (uses Sandbox account)

### Testing In-App Purchases:
1. In App Store Connect → Users and Access → Sandbox Testers
2. Create a sandbox tester account
3. On your iPhone, sign out of App Store
4. When purchasing in the app, use sandbox credentials
5. No real charges occur in sandbox

## Step 7: Submit to App Store

1. In Xcode: Product → Archive
2. Upload to App Store Connect
3. Fill out app metadata, screenshots, etc.
4. Submit for review

## Troubleshooting

### Purchase not working?
- Check product IDs match exactly
- Ensure products are in "Ready to Submit" status
- Check sandbox tester is properly set up

### Subscription not activating?
- Check server logs at `/api/apple/validate-receipt`
- Verify APPLE_SHARED_SECRET is set
- Check webhook is receiving notifications

### Web app not loading?
- Ensure URL is correct: `https://call-mail.xyz/app`
- Check SSL certificate is valid
- Test URL in mobile Safari first

## Environment Variables Required

Make sure these are set in your Vercel project:

```
APPLE_SHARED_SECRET=your_app_specific_shared_secret
```

## Support

- Median docs: https://median.co/docs
- Apple IAP docs: https://developer.apple.com/in-app-purchase/
- CallMail support: support@call-mail.xyz
