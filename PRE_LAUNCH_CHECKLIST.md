# CallMail Pre-Launch Checklist

**Status:** Final verification before production deployment

---

## Phase 1: Environment & Infrastructure ✅

- [ ] Vercel project created and connected to GitHub
- [ ] GitHub repository connected to Vercel (auto-deploy on push)
- [ ] Custom domain `call-mail.xyz` pointing to Vercel
- [ ] HTTPS certificate auto-renewing (automatic with Vercel)
- [ ] Database backups enabled in Supabase
- [ ] All environment variables set (see COMPLETE_ENV_VARS below)

---

## Phase 2: Apple & Payment Setup

### Apple Developer Portal
- [ ] Apple Developer account created
- [ ] Team ID: `7N54XHKAPW` (verify in your portal)
- [ ] Bundle ID registered: `xyz.callmail.app`
- [ ] APNs Key created and downloaded (.p8 file saved securely)
- [ ] APNs Key ID noted (e.g., `ABC123DEFG`)

### App Store Connect
- [ ] App created with bundle ID `xyz.callmail.app`
- [ ] **THREE subscription products created:**
  1. `xyz.callmail.pro.monthly` - $6.99/month
  2. `xyz.callmail.pro.annual` - $59.99/year  
  3. `xyz.callmail.pro.trial` - Free 7-day trial
- [ ] All three products have proper display names and descriptions
- [ ] Server notification URL set to: `https://call-mail.xyz/api/apple/webhook`
- [ ] App-Specific Shared Secret generated

### Stripe
- [ ] Stripe account created
- [ ] API keys obtained (Secret Key and Webhook Secret)
- [ ] Webhook URL configured: `https://call-mail.xyz/api/stripe/webhook`
- [ ] Test mode verified before going live
- [ ] Pricing plans created or using product IDs

### Google Cloud
- [ ] Google OAuth credentials created
- [ ] Client ID and Secret obtained
- [ ] Redirect URIs configured (both web and iOS)

### Twilio
- [ ] Twilio account created
- [ ] Phone number provisioned (SMS & Voice capable)
- [ ] Auth Token and Account SID obtained
- [ ] Phone number added to environment variables

---

## Phase 3: Legal & Compliance ✅

- [ ] Terms of Service reviewed and updated (Last updated: March 15, 2026)
- [ ] Privacy Policy covers all data practices
- [ ] Security Policy documents encryption and incident response
- [ ] Subprocessors page lists all third-party services
- [ ] GDPR/CCPA compliance language included
- [ ] Login screen displays: "By continuing, you agree to our Terms of Service and Privacy Policy"
- [ ] All legal pages accessible and linked in footer

---

## Phase 4: Security & Admin Features ✅

- [ ] Admin panel accessible (admin-only)
- [ ] User search and filtering works
- [ ] Ban User button functional
- [ ] **Terminate Account button functional** - permanently deletes all user data
- [ ] Audit logging records all admin actions
- [ ] Rate limiting enabled on all public endpoints
- [ ] CORS properly configured
- [ ] No API keys hardcoded in repository

---

## Phase 5: iOS App Configuration

### Xcode Setup
- [ ] Capacitor installed locally
- [ ] iOS plugins added (StoreKit 2 IAP + Push Notifications)
- [ ] Bundle ID set to `xyz.callmail.app`
- [ ] Development Team selected (your Apple account)
- [ ] Signing certificate configured
- [ ] Provisioning profile generated

### Capabilities (in Xcode)
- [ ] ✅ Associated Domains - For Google OAuth callback
- [ ] ✅ In-App Purchase - For subscription management
- [ ] ✅ Push Notifications - For weekly digest

### App Assets
- [ ] App icon (1024x1024 PNG) added to Assets
- [ ] Launch screen configured
- [ ] App display name set correctly

---

## Phase 6: Feature Testing

### Authentication
- [ ] Google Sign-In works on web
- [ ] Google Sign-In works on iOS app (WebView)
- [ ] Session persists after app close
- [ ] Logout clears session properly

### Subscriptions (Web - Stripe)
- [ ] Monthly subscription checkout works
- [ ] Annual subscription checkout works
- [ ] Subscription active after payment
- [ ] Webhook updates user subscription status

### Subscriptions (iOS - Apple IAP)
- [ ] In-App Purchase prompt appears
- [ ] Free trial works (sandbox environment)
- [ ] Subscription status syncs with backend
- [ ] Refund request works (test mode)

### Email Monitoring
- [ ] Email checking cron runs (every 5 minutes)
- [ ] Twilio calls triggered for important emails
- [ ] Call queue never exceeds 5 minutes
- [ ] Admin panel shows queue metrics

### Push Notifications
- [ ] App requests push notification permission on launch
- [ ] Push token registers with backend
- [ ] Weekly digest sends Monday 10am UTC
- [ ] Notifications received on physical iOS device

### Admin Functions
- [ ] User search works
- [ ] Ban user removes login access
- [ ] Terminate account deletes all user data
- [ ] Audit log records show all actions with timestamps

### Offline Mode
- [ ] App shows offline screen when no internet
- [ ] Auto-retry every 5 seconds
- [ ] Graceful recovery when connection restored
- [ ] Splash screen animates on app launch

---

## Phase 7: Deployment & Monitoring

- [ ] All tests passed on staging environment
- [ ] No console errors in browser dev tools
- [ ] No error logs in Vercel dashboard
- [ ] Vercel deployment successful (green checkmark)
- [ ] DNS propagated and domain working
- [ ] Performance metrics acceptable (LCP < 2.5s, CLS < 0.1)

---

## Phase 8: TestFlight & App Store

### TestFlight (Before App Store Review)
- [ ] Archive built in Xcode
- [ ] Uploaded to App Store Connect
- [ ] Added internal testers (your team)
- [ ] TestFlight app downloaded and installed on test device
- [ ] All features tested on real device:
  - [ ] Google Sign-In
  - [ ] In-App Purchase
  - [ ] Push notifications
  - [ ] Email monitoring
  - [ ] Settings/account deletion

### App Store Review Submission
- [ ] App screenshots prepared (6 for each device size)
- [ ] App description updated with correct product IDs
- [ ] Keywords and category set
- [ ] Age rating completed
- [ ] Privacy policy link verified in App Store Connect
- [ ] Contact email provided for App Review team
- [ ] Demo account credentials provided (if needed)
- [ ] No hard-coded API keys or test mode references in binary

---

## COMPLETE_ENV_VARS - Double Check This List

These MUST be set in Vercel before deployment:

```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
APPLE_SHARED_SECRET=<your-apple-shared-secret>
APNS_KEY_ID=<your-apns-key-id>
APNS_KEY=<your-apns-key-contents-with-begin-end-lines>
```

**10 environment variables total. Missing even ONE will cause failures.**

---

## Critical Reminders

1. **APNS_KEY Download**: Only available ONCE. Store the .p8 file securely.
2. **Shared Secret**: Can be regenerated, but reconfigure APPLE_SHARED_SECRET if you do.
3. **Webhook URLs**: Must be accessible from internet (Vercel does this automatically).
4. **Test Mode**: Use Stripe test mode before going live.
5. **Sandbox**: Use Apple's sandbox environment for testing IAP before production.
6. **Audit Logs**: Never delete - required for compliance.

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Apple Developer**: https://developer.apple.com/documentation
- **Stripe Docs**: https://stripe.com/docs
- **Google OAuth**: https://developers.google.com/identity
- **Twilio Docs**: https://www.twilio.com/docs

---

## Post-Launch Monitoring

After launch, monitor:

- [ ] Error rates in Vercel dashboard (should be < 1%)
- [ ] API response times (should be < 500ms)
- [ ] Database query performance
- [ ] Webhook delivery success rates
- [ ] User feedback and support tickets
- [ ] App crashes (via Xcode organizer)
- [ ] Push notification delivery rates

---

**Last Updated**: March 17, 2026  
**App Status**: Ready for submission to App Store
