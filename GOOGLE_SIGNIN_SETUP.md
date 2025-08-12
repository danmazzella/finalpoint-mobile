# Google Sign-In Setup for FinalPoint Mobile

This guide explains how to set up Google Sign-In for the FinalPoint mobile app.

## Prerequisites

1. A Google Cloud Console project with OAuth 2.0 enabled
2. Firebase project configured for the mobile app
3. Expo development environment set up

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Google+ API and Google Identity Services API
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Choose "Web application" as the application type
7. Fill in the required information:
   - Name: FinalPoint Mobile
   - **Important**: This web client ID will be used by the mobile app
   - No redirect URIs needed for mobile apps

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: FinalPoint
   - User support email: your-email@domain.com
   - Developer contact information: your-email@domain.com
4. Add the following scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users if needed

## Step 3: Environment Variables

Create a `.env` file in the `finalpoint-mobile` directory with:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# Other existing environment variables...
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
# ... etc
```

## Step 4: Update app.json

The app.json has already been configured with:
- Custom scheme: `finalpoint` (for general deep linking)
- Google Sign-In SDK integration
- No OAuth redirect URIs needed

## Step 5: Backend API Endpoint

Ensure your backend has a `/users/google-login` endpoint that accepts:
```json
{
  "googleAccessToken": "string",
  "email": "string",
  "name": "string",
  "googleId": "string",
  "avatar": "string",
  "pushToken": "string (optional)",
  "platform": "ios|android (optional)"
}
```

1. Start the development server:
   ```bash
   npm start
   ```

2. Run on device or emulator:
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

3. Test the Google Sign-In flow:
   - Navigate to the login screen
   - Tap "Continue with Google"
   - Complete the OAuth flow in the web browser
   - Verify successful sign-in

## Troubleshooting

### Common Issues:

1. **"Invalid OAuth client" error**
   - Verify the client ID is correct
   - Ensure you're using a "Web application" OAuth client type
   - The web client ID is used by the mobile app, not redirect URIs

2. **"Google Sign-In not working"**
   - Check that all required APIs are enabled
   - Verify the OAuth consent screen is configured
   - Check the mobile app console for any errors
   - Ensure Google Play Services are available on the device

3. **"Play Services not available" error**
   - This error occurs on emulators or devices without Google Play Services
   - Use a device with Google Play Services for testing
   - Or use an emulator with Google Play Services installed

### Debug Information:

The app logs configuration status on startup. Check the console for:
- Google OAuth configuration status
- Firebase configuration status
- Any missing environment variables

## Security Notes

1. Never commit the `.env` file to version control
2. Use different OAuth client IDs for development and production
3. Regularly rotate OAuth client secrets
4. Monitor OAuth usage in Google Cloud Console
5. Implement proper token validation on the backend

## Additional Resources

- [React Native Google Sign-In Documentation](https://github.com/react-native-google-signin/google-signin)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
