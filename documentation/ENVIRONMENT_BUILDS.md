# Environment-Specific Builds

This project supports building different versions of the app for different environments, each with unique names and bundle identifiers. The configuration uses a **hybrid approach** that combines the best of both worlds.

## How It Works

### **Hybrid Configuration Approach**

1. **`app.json`** - Base production configuration (never modified)
2. **`app.config.js`** - Extends `app.json` and overrides specific values for each environment
3. **`eas.json`** - Build profiles with environment-specific variables

This approach:
- ✅ **Preserves your production `app.json`** - never gets overwritten
- ✅ **Uses `app.json` as the base** - maintains all your existing configuration
- ✅ **Overrides only what's needed** - environment-specific values like names and bundle IDs
- ✅ **Follows Expo best practices** - uses the official configuration extension pattern

### **Configuration Priority**

1. **`app.config.js`** - Highest priority (environment-specific overrides)
2. **`app.json`** - Base configuration (production defaults)
3. **Environment variables** - Fallback values

## Environment Configurations

### Development Environment
- **App Name**: FP Dev
- **Bundle ID**: `com.finalpoint.dev`
- **Slug**: `finalpoint-mobile-dev`
- **Scheme**: `finalpoint-dev`
- **Output**: `./builds/development/`

### Staging Environment
- **App Name**: FP Staging
- **Bundle ID**: `com.finalpoint.staging`
- **Slug**: `finalpoint-mobile-staging`
- **Scheme**: `finalpoint-staging`
- **Output**: `./builds/staging/`

### Production Environment
- **App Name**: FinalPoint
- **Bundle ID**: `com.finalpoint.mobile`
- **Slug**: `finalpoint-mobile`
- **Scheme**: `finalpoint`
- **Output**: `./builds/production/`

### Production APK Environment
- **App Name**: FinalPoint
- **Bundle ID**: `com.finalpoint.mobile`
- **Slug**: `finalpoint-mobile`
- **Scheme**: `finalpoint`
- **Output**: `./builds/production-apk/`
- **Platform**: Android only (APK format)

## Build Output Organization

Build outputs are automatically organized using EAS build's `--output` flag. The build script directs each environment's outputs to dedicated folders.

### **Automatic Output Organization**

- **Build Artifacts**: Stored in EAS cloud storage during build
- **Download Location**: Automatically downloaded to specified output directory
- **Organization**: Build script handles organization automatically

### **Environment-Specific Output Folders**

```
builds/
├── development/          # Development builds (APK, iOS) - auto-organized
├── staging/             # Staging builds (AAB, iOS) - auto-organized
├── production/          # Production builds (AAB, iOS) - auto-organized
├── production-apk/      # Production APK builds - auto-organized
└── README.md            # Build documentation
```

### **Build Artifact Types**

- **Development**: APK files (`.apk`) and iOS archives (`.ipa`)
- **Staging**: App Bundle files (`.aab`) and iOS archives (`.ipa`)
- **Production**: App Bundle files (`.aab`) for Play Store and iOS archives (`.ipa`) for App Store
- **Production APK**: APK files (`.apk`) for direct distribution

## Building for Different Environments

### Using npm/yarn scripts (Recommended)

```bash
# Build for all platforms
npm run build:dev      # Development build
npm run build:staging  # Staging build
npm run build:prod     # Production build

# Build for specific platform
npm run build:dev:android    # Development Android build
npm run build:dev:ios        # Development iOS build
npm run build:staging:android # Staging Android build
npm run build:staging:ios     # Staging iOS build
npm run build:prod:android    # Production Android build
npm run build:prod:ios        # Production iOS build
npm run build:prod-apk:android # Production APK build (Android only)
```

### Using the build script directly

```bash
# Build for all platforms
./scripts/build-env.sh development
./scripts/build-env.sh staging
./scripts/build-env.sh production

# Build for specific platform
./scripts/build-env.sh development android
./scripts/build-env.sh development ios
./scripts/build-env.sh staging android
./scripts/build-env.sh staging ios
./scripts/build-env.sh production android
./scripts/build-env.sh production ios
./scripts/build-env.sh production-apk android
```

### Using EAS Build directly

```bash
# Development builds
eas build --profile development --platform all --local
eas build --profile development --platform android --local
eas build --profile development --platform ios --local

# Staging builds
eas build --profile staging --platform all --local
eas build --profile staging --platform android --local
eas build --profile staging --platform ios --local

# Production builds
eas build --profile production --platform all --local
eas build --profile production --platform android --local
eas build --profile production --platform ios --local
```

## Configuration Files

- **`app.json`** - Your base production configuration (never modified)
- **`app.config.js`** - Configuration extender that reads from EAS build profiles
- **`eas.json`** - Build profiles with environment-specific variables and output directories

## Environment Variables

The `app.config.js` reads these environment variables from EAS build profiles:

- `APP_NAME` - Display name for the app
- `BUNDLE_ID` - Bundle identifier/package name
- `SLUG` - Expo slug for the project
- `SCHEME` - URL scheme for deep linking
- `NODE_ENV` - Environment identifier

## Important Notes

1. **Bundle Identifiers**: Each environment has a unique bundle identifier to allow installing multiple versions on the same device.

2. **App Names**: Different app names help distinguish between environments on the device.

3. **Production app.json**: Your production configuration is **never overwritten** - it serves as the base for all environments.

4. **Hybrid Configuration**: `app.config.js` extends `app.json` and only overrides environment-specific values.

5. **Organized Builds**: All build outputs are automatically organized into environment-specific folders.

6. **Automatic Version Management**: Version codes and build numbers are automatically managed in `app.config.js` for all build methods.

7. **Google Services**: Make sure you have the appropriate `google-services.json` and `GoogleService-Info.plist` files for each environment if you're using Firebase.

8. **Local Builds**: All builds use the `--local` flag for faster development builds. Remove this flag for cloud builds.

## Why Keep app.json?

- **Development**: `expo start` and `expo run` use `app.json` by default
- **Base Configuration**: Contains all your production settings, icons, permissions, etc.
- **Fallback**: Provides default values if environment variables are missing
- **Expo Standard**: Follows Expo's recommended configuration pattern

## Troubleshooting

- **Bundle identifier conflicts**: Each environment has unique bundle IDs, so conflicts shouldn't occur
- **iOS builds**: Ensure your provisioning profiles support the bundle identifiers
- **Android builds**: Package names are unique across environments
- **Configuration issues**: Check that `app.config.js` is properly extending `app.json`
- **Build output issues**: Verify the output directories exist and are writable

## File Structure

```
finalpoint-mobile/
├── app.json              # Base production configuration (never modified)
├── app.config.js         # Configuration extender for environments
├── eas.json              # Build profiles with environment variables
├── builds/               # Organized build outputs by environment
│   ├── development/      # Development build artifacts
│   ├── staging/          # Staging build artifacts
│   ├── production/       # Production build artifacts
│   └── production-apk/   # Production APK artifacts
├── scripts/
│   └── build-env.sh     # Build automation script
└── documentation/
    └── ENVIRONMENT_BUILDS.md # This documentation
```
