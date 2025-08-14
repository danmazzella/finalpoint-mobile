#!/usr/bin/env node

// Test script to simulate Expo AuthSession redirect URI generation
console.log('🔍 Testing Expo AuthSession Redirect URI Generation...\n');

// Simulate the exact logic from your googleSignIn.ts
const scheme = 'finalpoint';
const path = 'auth';

// This is what AuthSession.makeRedirectUri generates
const redirectUri = `${scheme}://${path}`;

console.log('📱 App Configuration:');
console.log(`✅ Scheme: ${scheme}`);
console.log(`✅ Path: ${path}`);
console.log(`✅ Generated Redirect URI: ${redirectUri}`);

console.log('\n🔧 Google Cloud Console Requirements:');
console.log('For Android OAuth 2.0 Client ID, you need:');
console.log(`- Application type: Android`);
console.log(`- Package name: com.finalpoint.mobile`);
console.log(`- SHA-1 certificate fingerprint: 44:E1:0C:84:6C:81:6B:CC:F3:F1:35:B4:E6:5A:AB:63:B9:08:BD:63`);

console.log('\n⚠️ Important Notes:');
console.log('- Android OAuth clients typically do NOT require redirect URIs');
console.log('- The redirect URI is handled internally by the Android app');
console.log('- Make sure your OAuth client type is "Android", not "Web application"');
console.log('- The package name must match exactly: com.finalpoint.mobile');

console.log('\n🔍 Debug Steps:');
console.log('1. Verify OAuth client type is "Android"');
console.log('2. Verify package name is exactly "com.finalpoint.mobile"');
console.log('3. Verify SHA-1 matches: 44:E1:0C:84:6C:81:6B:CC:F3:F1:35:B4:E6:5A:AB:63:B9:08:BD:63');
console.log('4. Check if there are any additional OAuth scopes or settings');
