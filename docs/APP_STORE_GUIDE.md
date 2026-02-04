# Better Half - App Store Deployment Guide 🚀

## Prerequisites Completed ✅
- [x] `eas.json` - EAS Build configuration
- [x] `app.json` - iOS/Android metadata with permissions
- [x] `store.config.json` - App Store/Play Store descriptions

## Next Steps for App Store Submission

### Step 1: Initialize EAS Project
Run this in your terminal (one-time setup):
```bash
npx eas-cli login
npx eas-cli init --id betterhalf
```

### Step 2: Configure Apple Credentials
```bash
npx eas-cli credentials --platform ios
```
Select "Build credentials" > "Set up for a new project"
- Apple ID: justin@newbold.cloud
- Team ID: 3KA9RC7YE6

### Step 3: Create App Store Connect Entry
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" > "+" > "New App"
3. Fill in:
   - Platform: iOS
   - Name: Better Half - Couples Game
   - Primary Language: English (U.S.)
   - Bundle ID: com.newbold.betterhalf
   - SKU: betterhalf-ios-001
4. Save the App Store Connect App ID for eas.json

### Step 4: Build for iOS
```bash
# Preview build (for TestFlight internal testing)
npx eas-cli build --platform ios --profile preview

# Production build (for App Store)
npx eas-cli build --platform ios --profile production
```

### Step 5: Submit to App Store
```bash
npx eas-cli submit --platform ios --profile production
```

### Step 6: Build for Android (Google Play)
```bash
# Create upload key
npx eas-cli credentials --platform android

# Build AAB for Play Store
npx eas-cli build --platform android --profile production
```

## App Store Screenshots Needed
| Device | Size | Count |
|--------|------|-------|
| iPhone 6.7" | 1290 x 2796 | 3-10 |
| iPhone 6.5" | 1284 x 2778 | 3-10 |
| iPhone 5.5" | 1242 x 2208 | 3-10 |
| iPad Pro 12.9" | 2048 x 2732 | 3-10 |

### Recommended Screenshots:
1. Home screen with streak display
2. Daily Sync question screen
3. Match celebration with confetti
4. Achievements screen
5. Friends & Family connection

## App Store Review Notes
```
Demo Account:
Email: demo@betterhalf.app
Password: demo123456

Test Instructions:
1. Log in with demo account
2. Partner account auto-linked for testing
3. Play Daily Sync game to see matching
4. View achievements in Settings
```

## Privacy Policy Required Items
- [ ] Data collection disclosure
- [ ] Third-party services (Supabase)
- [ ] Account deletion instructions
- [ ] GDPR compliance statement

## Estimated Timeline
- EAS Setup: 30 minutes
- First Build: 15-30 minutes
- TestFlight Review: 24-48 hours
- App Store Review: 24-48 hours

---
*Generated: Feb 4, 2026*
