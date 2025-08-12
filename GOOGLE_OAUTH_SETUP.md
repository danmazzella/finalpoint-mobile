# Google OAuth Setup for FinalPoint Mobile

## Required Environment Variables

Create a `.env` file in the `finalpoint-mobile` directory with the following variables:

```bash
# Google OAuth Configuration
# Get these from Google Cloud Console > APIs & Services > Credentials
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here.apps.googleusercontent.com
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Create or configure OAuth 2.0 Client IDs:

### Web Client ID
- **Application type**: Web application
- **Authorized redirect URIs**: 
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback` (for development)

### iOS Client ID
- **Application type**: iOS
- **Bundle ID**: `com.finalpoint.mobile`

### Android Client ID
- **Application type**: Android
- **Package name**: `com.finalpoint.mobile`
- **SHA-1 certificate fingerprint**: Get this from your keystore

## How It Works

1. **Mobile App**: Uses Expo AuthSession to handle Google OAuth flow
2. **Deep Linking**: App uses `finalpoint://auth` scheme for OAuth redirects
3. **Backend Integration**: Sends Google ID token to your API endpoint `/users/google-auth`
4. **User Creation/Authentication**: Backend verifies token and creates/authenticates user

## Testing

1. Set up environment variables
2. Run `npm start` in the mobile app
3. Test Google Sign-In on both iOS and Android
4. Check that new users are created and existing users can sign in

## Troubleshooting

- **"Missing Google OAuth client ID"**: Check your `.env` file
- **OAuth redirect errors**: Verify the scheme in `app.json` matches your redirect URI
- **Backend errors**: Check that the Google OAuth migration has run on your database
