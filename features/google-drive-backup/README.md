# Google Drive backup

The backup feature uses native Google Sign-In and the private Drive `appDataFolder`.

## Google Cloud setup

1. Enable the Google Drive API in the Google Cloud project used by the app.
2. Configure the OAuth consent screen and add the non-sensitive scope
   `https://www.googleapis.com/auth/drive.appdata`.
3. Create OAuth clients for the platforms that will be distributed:
   - Android package: `com.joaolucena.controlevendas` (with the signing certificate SHA-1).
   - iOS bundle identifier: `com.joaolucena.controlevendas`.
   - Web client ID used by the native SDK configuration.
4. Add the client IDs to a local `.env` based on `.env.example`.
5. Rebuild the development/production app after installing or changing Google Sign-In.

The Android OAuth client must contain every SHA-1 used to sign the app: local debug, EAS
development/preview, upload key, and Google Play App Signing as applicable. A missing SHA-1 usually
appears as `DEVELOPER_ERROR`.

The native sign-in package cannot run in Expo Go. Never commit OAuth client secrets.
