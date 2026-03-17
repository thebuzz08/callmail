# CallMail - Project Files Summary

**Complete Overview of All Features, Components, and Integrations**

---

## 📁 Core Application Files

### Web Pages
- `/app/page.tsx` - Landing page with parallax background
- `/app/app/page.tsx` - User dashboard (email monitoring, settings)
- `/app/terms/page.tsx` - Terms of Service (updated March 2026)
- `/app/privacy/page.tsx` - Privacy Policy (GDPR/CCPA compliant)
- `/app/security/page.tsx` - Security disclosure & contact
- `/app/subprocessors/page.tsx` - Third-party data processors
- `/app/admin/page.tsx` - Admin panel (user management, account termination)

### Core Components
- `/components/login-screen.tsx` - Google OAuth login with terms notice
- `/components/subscription-gate.tsx` - Stripe & Apple IAP payment UI
- `/components/dashboard-screen.tsx` - Main user dashboard
- `/components/settings-screen.tsx` - User settings & preferences
- `/components/splash-screen.tsx` - Animated loading screen
- `/components/offline-screen.tsx` - Offline detection & retry
- `/components/app-wrapper.tsx` - Splash + offline screen wrapper
- `/components/onboarding-screen.tsx` - First-time user onboarding

### Layout & Navigation
- `/app/layout.tsx` - Root layout with AppWrapper
- `/app/app/layout.tsx` - App section layout

---

## 🔌 API Endpoints

### Authentication & User
- `/api/auth/google/callback` - OAuth callback handler
- `/api/user/profile` - Get/update user profile
- `/api/user/delete` - User account deletion
- `/api/user/push-token` - Register push notification token

### Admin Actions
- `/api/admin/ban` - Ban/unban user (audit logged)
- `/api/admin/terminate` - **Permanent account termination (full data deletion)**
- `/api/admin/queue-metrics` - Get queue performance metrics

### Subscriptions & Payments
- `/api/stripe/webhook` - Stripe webhook handler
- `/api/apple/webhook` - Apple receipt webhook
- `/api/apple/validate-receipt` - Validate purchase receipt

### Background Jobs
- `/api/cron/check-emails` - Email checking cron (every 5 min)
- `/api/cron/weekly-digest` - Weekly push notification digest (Monday 10am)

### Utilities
- `/api/health` - Health check (offline detection)

---

## 📱 iOS Native Integration

### StoreKit 2 (In-App Purchase)
- `/ios-plugin/CallMailIAP/CallMailIAPPlugin.swift` - Product fetching & purchase
- `/ios-plugin/CallMailIAP/CallMailIAPPlugin.m` - Objective-C bridge

### Push Notifications (APNs)
- `/ios-plugin/CallMailPush/CallMailPushPlugin.swift` - Permission handling & token registration
- `/ios-plugin/CallMailPush/CallMailPushPlugin.m` - Objective-C bridge

### Configuration
- `/capacitor.config.ts` - Capacitor configuration
- `/ios-plugin/` - Swift native plugin files

---

## 🛠️ Utilities & Libraries

### Native Bridge (JavaScript ↔ Native)
- `/lib/native-bridge.ts` - Capacitor plugin wrapper with:
  - `isNativeApp()` - Detect if running in native app
  - `getPlatform()` - Return platform (iOS/Android/web)
  - `getProducts()` - Fetch IAP products
  - `purchaseProduct()` - Initiate purchase
  - `restorePurchases()` - Restore previous purchases
  - `getSubscriptionStatus()` - Check subscription status
  - `requestPushPermissions()` - Request push notification permission
  - `getPushToken()` - Get device push token
  - `registerPushToken()` - Register token with server

### Analytics
- `/lib/analytics.ts` - Custom event tracking for:
  - User authentication (sign in/out)
  - Subscriptions (started, cancelled, restored)
  - In-App Purchases (initiated, completed, failed)
  - Push notifications (permissions)

### Supabase
- `/lib/supabase/server.ts` - Server-side Supabase client
- `/lib/supabase/admin.ts` - Admin client for sensitive operations

### Audit Logging
- `/lib/audit-log.ts` - Log all admin actions with timestamp

---

## 📊 Database Schema

### Main Tables
- `users` - User accounts, subscription status, push tokens
- `emails` - Email metadata from Gmail
- `call_logs` - Phone call history & costs
- `call_costs` - Cost tracking per user
- `call_retries` - Retry attempts for failed calls
- `audit_logs` - Admin action audit trail (immutable)
- `queue_metrics` - Cron job performance metrics

---

## 📋 Documentation Files

### Setup & Deployment
- **`CAPACITOR_IOS_SETUP.md`** - Complete iOS development guide
  - Step-by-step Xcode setup
  - Signing & provisioning profiles
  - Plugin file addition
  - TestFlight submission
  - App Store review

- **`PRE_LAUNCH_CHECKLIST.md`** - Final verification before launch
  - 10 required environment variables
  - All API setup procedures
  - Testing procedures

- **`COMPLIANCE_CHECKLIST.md`** - CASA Tier 2 security compliance
  - Legal documents verification
  - Data security controls
  - Privacy compliance (GDPR/CCPA)
  - iOS app compliance
  - Known limitations

- **`PRODUCTION_READY.md`** - Overview & quick reference
  - Project summary
  - Quick start guide
  - Feature overview
  - Troubleshooting

- **`README.md`** - Local development
  - Installation
  - Running locally
  - Deployment instructions

---

## 🔑 Environment Variables (10 Required)

```
GOOGLE_CLIENT_ID          # Google OAuth
GOOGLE_CLIENT_SECRET      # Google OAuth
TWILIO_ACCOUNT_SID        # Twilio
TWILIO_AUTH_TOKEN         # Twilio
TWILIO_PHONE_NUMBER       # Twilio caller ID
STRIPE_SECRET_KEY         # Web subscriptions
STRIPE_WEBHOOK_SECRET     # Webhook validation
APPLE_SHARED_SECRET       # iOS receipt validation
APNS_KEY_ID               # Push notifications
APNS_KEY                  # Push notifications
```

---

## 🎯 Key Features Implementation

### ✅ User Authentication
- Google OAuth 2.0
- Session management with HTTP-only cookies
- Logout with session clearing

### ✅ Email Monitoring
- Gmail integration (read-only)
- Cron job every 5 minutes
- Twilio phone call integration
- Queue metrics tracking

### ✅ Payment Processing
- **Web**: Stripe checkout
- **iOS**: Apple In-App Purchase (StoreKit 2)
- Free trial support (7 days)
- Subscription status syncing

### ✅ Push Notifications
- Weekly digest (Monday 10am)
- Call statistics summary
- Native iOS implementation (APNs)
- Token registration on app launch

### ✅ Admin Panel
- User search and filtering
- Ban user functionality
- **Account termination (complete data deletion)**
- Audit logging
- Queue metrics display

### ✅ Legal & Compliance
- Terms of Service (with termination rights)
- Privacy Policy
- Security Policy
- Subprocessors listing
- Terms agreement on signup
- Data export/deletion support

### ✅ Security
- TLS 1.3 encryption
- Rate limiting
- Audit logging
- No hardcoded secrets
- Secure session management

---

## 📦 Dependencies

### Core
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### Database & Auth
- Supabase (PostgreSQL)
- @supabase/supabase-js

### Native Mobile
- Capacitor 6
- @capacitor/core
- @capacitor/ios

### Payments
- stripe (web)
- Apple StoreKit 2 (iOS)

### API & Services
- twilio
- @vercel/analytics
- next-uia

### Development
- ESLint
- Prettier
- shadcn/ui components

---

## 🚀 Deployment Structure

### Web Deployment
- Vercel (auto-deploy from GitHub)
- Custom domain: call-mail.xyz
- Database: Supabase (PostgreSQL)
- CDN: Vercel Edge Network

### iOS Deployment
- Xcode build archive
- TestFlight beta distribution
- App Store review & submission
- App Store distribution

---

## 📞 Contact & Support

All contact information available in:
- `/app/security` - Security disclosure
- `/app/terms` - Legal inquiries
- Admin panel - User support

---

## 🎓 Documentation Reading Order

1. **PRODUCTION_READY.md** ← Start here (this file provides overview)
2. **PRE_LAUNCH_CHECKLIST.md** ← Verify all requirements
3. **CAPACITOR_IOS_SETUP.md** ← Build iOS app
4. **COMPLIANCE_CHECKLIST.md** ← Security audit
5. **README.md** ← Local development

---

## ✨ Final Status

✅ All features implemented  
✅ All security controls in place  
✅ All legal documents updated  
✅ CASA Tier 2 compliant  
✅ Production ready  
✅ Documentation complete  

**Ready for launch! 🚀**
