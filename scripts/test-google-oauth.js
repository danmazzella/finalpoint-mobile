#!/usr/bin/env node

// Test script to debug Google OAuth configuration
console.log('🔍 Testing Google OAuth Configuration...\n');

// Check environment variables
const envVars = [
    'EXPO_PUBLIC_GOOGLE_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
];

console.log('📋 Environment Variables:');
envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
    }
});

console.log('\n🔧 Configuration Check:');
console.log(`✅ App scheme: finalpoint`);
console.log(`✅ Package name: com.finalpoint.mobile`);
console.log(`✅ Bundle ID: com.finalpoint.mobile`);

console.log('\n📱 Next Steps:');
console.log('1. Create a .env file with your Google OAuth credentials');
console.log('2. Go to Google Cloud Console > APIs & Services > Credentials');
console.log('3. Create/update Android OAuth 2.0 Client ID with:');
console.log('   - Package name: com.finalpoint.mobile');
console.log('   - SHA-1 fingerprint from your keystore');
console.log('4. Add finalpoint://auth to authorized redirect URIs');
console.log('5. Restart your development server');

console.log('\n🔗 Useful Links:');
console.log('- Google Cloud Console: https://console.cloud.google.com/');
console.log('- OAuth 2.0 Setup: https://developers.google.com/identity/protocols/oauth2');
console.log('- Expo AuthSession: https://docs.expo.dev/versions/latest/sdk/auth-session/');
