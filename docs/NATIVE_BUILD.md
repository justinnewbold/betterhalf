- Apple ID: `justin@newbold.cloud`
- Encryption: `ITSAppUsesNonExemptEncryption = false`

### Android (Google Play Console)
- Package Name: `com.newbold.betterhalf`
- Service Account Key: Required for automated submission

## Push Notification Setup

### iOS (APNs)
1. Create APNs Key in Apple Developer Portal
2. Upload to Expo Dashboard or EAS
3. Key will be automatically used during builds

### Android (FCM)
1. Create Firebase project at console.firebase.google.com
2. Download `google-services.json`
3. Place in project root
4. EAS will include it in builds

## Environment Variables

Set these in EAS secrets or `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://wektbfkzbxvtxsremnnk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## OTA Updates

After initial app store approval, use Expo Updates for instant deployments:

```bash
# Push an update to all users
eas update --branch production --message "Bug fixes"

# Preview updates before release
eas update --branch preview --message "Testing new feature"
```

## Troubleshooting

### Build Fails
- Check `eas build:list` for error logs
- Verify credentials in Expo dashboard
- Ensure all required assets exist (icons, splash)

### Push Notifications Not Working
- Verify push token is saved to user profile
- Check APNs/FCM configuration in Expo dashboard
- Test with `eas device:create` for development builds

### App Rejected
- Common issues: Missing privacy policy, incomplete app description
- Check Apple/Google requirements at submission time

## Links

- **Expo Dashboard**: https://expo.dev
- **EAS Documentation**: https://docs.expo.dev/eas
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
