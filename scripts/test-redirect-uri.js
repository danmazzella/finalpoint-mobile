#!/usr/bin/env node

// Test script to verify redirect URI generation
console.log('🔍 Testing Redirect URI Generation...\n');

// Simulate the same logic as in your app
const scheme = 'finalpoint';
const path = 'auth';

// This is what AuthSession.makeRedirectUri would generate
const redirectUri = `${scheme}://${path}`;

console.log('📱 App Configuration:');
console.log(`✅ Scheme: ${scheme}`);
console.log(`✅ Path: ${path}`);
console.log(`✅ Generated Redirect URI: ${redirectUri}`);

console.log('\n🔧 Google Cloud Console Configuration Required:');
console.log('In your Android OAuth 2.0 Client ID, make sure you have:');
console.log(`- Package name: com.finalpoint.mobile`);
console.log(`- SHA-1 certificate fingerprint (from your keystore)`);
console.log(`- Authorized redirect URIs: ${redirectUri}`);

console.log('\n📋 To get SHA-1 fingerprint for development:');
console.log('keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android');

console.log('\n⚠️ Important Notes:');
console.log('- The redirect URI must EXACTLY match: finalpoint://auth');
console.log('- No trailing slashes or additional paths');
console.log('- Case sensitive');
console.log('- Make sure your Android OAuth client has the correct package name and SHA-1');
