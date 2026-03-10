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

## Step 3: Add Custom JavaScript for In-App Purchases

Since Median's IAP plugin requires a business account ($7200/yr), we use custom JavaScript instead.

### In Median Dashboard:
1. Go to your app → **Customizations** → **Custom JavaScript**
2. Copy the entire contents of `docs/median-storekit-bridge.js` from this repo
3. Paste it into the Custom JavaScript field
4. Save

This JavaScript:
- Interfaces directly with StoreKit (native iOS)
- Shows Apple's payment sheet for purchases
- Sends receipts to your backend for validation
- Handles purchase restoration

### In App Store Connect:
1. Make sure your products are created:
   - com.callmail.pro.monthly - $6.99/month auto-renewable
   - com.callmail.pro.annual - $59.99/year auto-renewable
2. Products must be in "Ready to Submit" or "Approved" status
3. Add App-Specific Shared Secret (already set in Vercel)

## Step 4: Configure Server Notifications

In App Store Connect → Your App → App Information:
- App Store Server Notifications URL: `https://call-mail.xyz/api/apple/webhook`
- Select Version 2 Notifications

## Step 5: How It Works

The JavaScript bridge + your backend handles everything:

1. User taps "Subscribe" in the app
2. Your web app calls `CallMailIAP.purchase('monthly')` or `CallMailIAP.purchase('annual')`
3. StoreKit shows Apple's native payment sheet
4. User completes purchase with Face ID/Touch ID
5. Receipt is sent to `/api/apple/validate-receipt`
6. Backend validates with Apple's servers
7. Subscription is stored in your database
8. User gets access to pro features

**For web users** (not in the app), Stripe checkout is used instead.

**Apple handles:**
- Payment processing
- Subscription renewals (automatic)
- Cancellations (via Settings app)
- Refunds

**Your backend handles:**
- Receipt validation
- Webhook notifications (renewals, cancellations)
- Subscription status checks

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
