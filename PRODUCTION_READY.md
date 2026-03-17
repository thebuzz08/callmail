# CallMail - Complete Production Ready Documentation

**Status**: ✅ Production Ready  
**Last Updated**: March 17, 2026  
**Version**: 1.0.0

---

## Quick Summary

CallMail is a fully compliant iOS & web app that:
- Monitors Gmail for important emails
- Triggers Twilio phone calls when critical emails arrive
- Processes subscriptions via Stripe (web) and Apple IAP (iOS)
- Sends weekly push notifications with email statistics
- Includes comprehensive admin panel for account management and user termination

**All code is production-ready. All legal documents are in place. All security controls are implemented.**

---

## 📋 Documentation Files

Start with these in order:

1. **PRE_LAUNCH_CHECKLIST.md** ← START HERE
   - Complete checklist before deployment
   - All required API keys and setup steps
   - Testing procedures

2. **CAPACITOR_IOS_SETUP.md**
   - Step-by-step iOS app development guide
   - Xcode configuration
   - TestFlight & App Store submission
   - **Read this if you're building the iOS app**

3. **COMPLIANCE_CHECKLIST.md**
   - CASA Tier 2 security requirements
   - Legal compliance verification
   - Data privacy and GDPR/CCPA notes
   - **Read this for security audit**

4. **README.md** (in project root)
   - Local development setup
   - Running the app locally
   - Deployment instructions

---

## 🚀 Quick Start

### Prerequisites
- macOS (for iOS development)
- Xcode 15+
- Node.js 18+
- All environment variables (10 total)

### Local Development

```bash
# Clone and install
git clone https://github.com/thebuzz08/callmail.git
cd callmail
pnpm install

# Run web app
pnpm dev
# Opens http://localhost:3000

# Run iOS app
npx cap sync ios
npx cap open ios
# Build & run in Xcode (Cmd + R)
```

### Deploy Web

```bash
git push origin main
# Vercel auto-deploys
# Done! Available at call-mail.xyz
```

### Build iOS App

1. Follow **CAPACITOR_IOS_SETUP.md** PART 1-6 (environment setup)
2. Run: `npx cap open ios`
3. In Xcode: Press Cmd + R to build
4. When ready: Archive and upload to TestFlight

---

## 🔐 Security Features

✅ **Authentication**
- Google OAuth 2.0 (no passwords)
- HTTP-only session cookies
- Logout clears session

✅ **Data Protection**
- TLS 1.3 encryption in transit
- Supabase encryption at rest
- Environment variables for secrets
- No hardcoded API keys

✅ **Audit & Logging**
- All admin actions logged
- User authentication events tracked
- Account modifications recorded
- Audit logs preserved indefinitely

✅ **Account Management**
- Ban users (preserves audit trail)
- Terminate accounts (complete data deletion)
- Data export (GDPR compliance)
- Email deletion support

✅ **Rate Limiting**
- Prevents brute force attacks
- API endpoint protection
- Configurable limits

---

## 💳 Payment Processing

### Web (Stripe)
- Monthly: $6.99/month
- Annual: $59.99/year
- Test mode available for testing
- Webhook validation implemented
- Automatic billing on signup

### iOS (Apple IAP)
- Monthly: `xyz.callmail.pro.monthly`
- Annual: `xyz.callmail.pro.annual`
- Trial: `xyz.callmail.pro.trial` (7 days free)
- StoreKit 2 implementation
- Receipt validation on backend
- Apple webhook integration

---

## 📧 Email Monitoring

- **Check Interval**: Every 5 minutes (Vercel cron)
- **Processing**: 1 second delay between Twilio calls
- **Queue Monitoring**: Admin panel shows longest wait time
- **Metrics**: Weekly digest sent to users

---

## 📱 Push Notifications

- **Opt-in**: Users grant permission on app launch
- **Frequency**: Weekly digest every Monday 10am UTC
- **Content**: "You received X phone calls this week"
- **Implementation**: APNs with native iOS plugin
- **Requirements**: APNS_KEY_ID and APNS_KEY env vars

---

## 👨‍💼 Admin Panel

Located at `/admin` (admin-only):

**User Management**
- Search users by email
- View user details and subscription status
- See call history and audit logs

**Actions**
- Ban User (blocks login)
- Terminate Account (deletes all data)
- View Call Cost Summary
- Check Queue Metrics

**Security**
- All actions logged with timestamp
- Reason required for termination
- Double confirmation dialogs

---

## 📱 iOS App Features

✅ All web features via WebView  
✅ Native In-App Purchase integration (StoreKit 2)  
✅ Push notification support (APNs)  
✅ "Restore Purchases" for returning users  
✅ Animated splash screen  
✅ Offline detection with retry  
✅ Google OAuth sign-in  

---

## ✅ Legal & Compliance

**All Documents Updated & In Place**
- Terms of Service (with termination rights)
- Privacy Policy (GDPR/CCPA compliant)
- Security Policy (encryption details)
- Subprocessors page (third-party services)
- Compliance Checklist (CASA Tier 2)

**User Agreement**
- Login screen displays: "By continuing, you agree to our Terms of Service and Privacy Policy"
- Links are clickable and open in new tabs

---

## 🗄️ Database Schema

**Key Tables**
- `users` - User accounts with subscription status
- `emails` - Email metadata
- `call_logs` - Phone call history
- `audit_logs` - Admin action audit trail
- `queue_metrics` - Cron job performance

**Retention Policies**
- User data: Kept while subscription active, deleted on termination
- Audit logs: Kept indefinitely (legal requirement)
- Email metadata: Can be deleted by user request

---

## 🛠️ Environment Variables (Complete List)

| Variable | Source | Purpose |
|----------|--------|---------|
| `GOOGLE_CLIENT_ID` | Google Cloud | Sign-in |
| `GOOGLE_CLIENT_SECRET` | Google Cloud | OAuth validation |
| `TWILIO_ACCOUNT_SID` | Twilio | Phone calls |
| `TWILIO_AUTH_TOKEN` | Twilio | API auth |
| `TWILIO_PHONE_NUMBER` | Twilio | Caller ID |
| `STRIPE_SECRET_KEY` | Stripe | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook validation |
| `APPLE_SHARED_SECRET` | App Store Connect | Receipt validation |
| `APNS_KEY_ID` | Apple Developer | Push notifications |
| `APNS_KEY` | Apple Developer | Push auth |

**ALL 10 REQUIRED FOR FULL FUNCTIONALITY**

---

## 📊 Performance & Monitoring

**Vercel Analytics**
- Tracks page views, Core Web Vitals
- Performance metrics dashboard
- Error tracking

**Custom Tracking**
- Subscription events (started, cancelled, restored)
- IAP events (initiated, completed, failed)
- Push notification opt-ins

**Queue Monitoring**
- Longest queue time in last 24h
- Alert at 50% of 5-min limit (amber)
- Critical alert at 80% (red)

---

## 🐛 Troubleshooting

**Common Issues & Fixes**

| Issue | Solution |
|-------|----------|
| App won't start | Check all 10 env vars are set |
| Google Sign-In fails | Verify redirect URIs in Google Cloud |
| Twilio calls not working | Check TWILIO_PHONE_NUMBER is active |
| Push notifications don't arrive | Verify APNS_KEY_ID and APNS_KEY |
| iOS build fails | Run `pod install` in `ios` folder |
| App shows offline screen | Check health endpoint: `/api/health` |

---

## 🚢 Deployment Checklist

### Before Deploying
- [ ] All tests passing locally
- [ ] All 10 environment variables set in Vercel
- [ ] Git pushed to main branch
- [ ] No console errors

### Web Deployment
- [ ] `git push origin main`
- [ ] Vercel auto-deploys (takes ~3-5 min)
- [ ] Check deployment status in Vercel dashboard
- [ ] Test at live domain

### iOS Deployment
- [ ] Follow CAPACITOR_IOS_SETUP.md
- [ ] Build & test on physical device
- [ ] Create archive in Xcode
- [ ] Upload to App Store Connect
- [ ] Complete App Review form
- [ ] Submit for review (~24-48 hours)

---

## 📞 Support

**For Security Issues**
- Visit: `/app/security`
- Follow responsible disclosure guidelines

**For Technical Questions**
- Check documentation files above
- Review setup guide for step-by-step help

**For Legal Questions**
- Review: `/app/terms`, `/app/privacy`, `/app/security`

---

## 📝 Version History

**v1.0.0** (March 17, 2026)
- ✅ Initial production release
- ✅ Full CASA Tier 2 compliance
- ✅ iOS app ready for TestFlight
- ✅ Admin panel with account termination
- ✅ Push notifications implemented
- ✅ All legal documents finalized

---

## 🎯 Next Steps

1. **Read PRE_LAUNCH_CHECKLIST.md** - verify all requirements
2. **Set all 10 environment variables** in Vercel
3. **Deploy web app** - `git push origin main`
4. **Build iOS app** - follow CAPACITOR_IOS_SETUP.md
5. **Submit to TestFlight** - test with beta users
6. **Submit to App Store** - await review
7. **Monitor metrics** - check Vercel dashboard

---

**You're ready to launch! 🚀**

For any questions or issues, refer to the specific documentation files listed at the top of this document.
