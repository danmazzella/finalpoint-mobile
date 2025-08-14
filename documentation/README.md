# FinalPoint Mobile App

A React Native/Expo app for F1 fantasy league management.

## Build System

This project uses a simplified build system that directly modifies `app.json` for different environments instead of complex dynamic configuration.

### Prerequisites

- **jq**: Required for JSON manipulation in build scripts
  ```bash
  # macOS
  brew install jq
  
  # Ubuntu/Debian
  sudo apt-get install jq
  
  # CentOS/RHEL
  sudo yum install jq
  ```

### Build Commands

#### Using npm scripts (recommended)
```bash
# Development builds
npm run build:dev          # All platforms
npm run build:dev:android  # Android only
npm run build:dev:ios      # iOS only

# Staging builds
npm run build:staging          # All platforms
npm run build:staging:android # Android only
npm run build:staging:ios     # iOS only

# Production builds
npm run build:prod          # All platforms
npm run build:prod:android  # Android only
npm run build:prod:ios      # iOS only

# Production APK (Android only)
npm run build:prod-apk
```

#### Using build script directly
```bash
./scripts/build-env.sh development
./scripts/build-env.sh staging
./scripts/build-env.sh production
```

#### Using EAS directly
```bash
eas build --profile development --local
eas build --profile staging --local
eas build --profile production --local
```

### How It Works

1. **Backup**: The script creates a backup of your original `app.json`
2. **Modify**: Updates `app.json` with environment-specific values:
   - App names and schemes
   - Bundle identifiers (Android only - iOS keeps consistent)
   - Version codes and build numbers
   - **Note**: Slug remains consistent to avoid EAS project conflicts
3. **Build**: Runs the EAS build with the modified configuration
4. **Restore**: Automatically restores the original `app.json` after build

### Environment-Specific Configurations

#### Development
- **App Name**: FP Dev
- **Bundle ID**: com.finalpoint.dev (Android), com.finalpoint.mobile (iOS)
- **Slug**: finalpoint-mobile (consistent across environments)
- **Scheme**: finalpoint-dev

#### Staging
- **App Name**: FP Staging
- **Bundle ID**: com.finalpoint.staging (Android), com.finalpoint.mobile (iOS)
- **Slug**: finalpoint-mobile (consistent across environments)
- **Scheme**: finalpoint-staging

#### Production
- **App Name**: FinalPoint
- **Bundle ID**: com.finalpoint.mobile (both platforms)
- **Slug**: finalpoint-mobile (consistent across environments)
- **Scheme**: finalpoint

### Version Management

- **Development/Staging**: Auto-increments version codes
- **Production**: Uses fixed versions from `version-config.template.json`

### File Structure

```
finalpoint-mobile/
├── app.json                    # Base configuration (modified during builds)
├── eas.json                    # EAS build profiles
├── scripts/
│   ├── build-env.sh           # Main build script
│   └── version-manager.js     # Version management
├── version-config.template.json # Version template
└── builds/                     # Organized build outputs
    ├── development/
    ├── staging/
    └── production/
```

### Benefits of This Approach

1. **Simplicity**: No complex dynamic configuration logic
2. **Reliability**: Direct file modification is more predictable
3. **Debugging**: Easy to see exactly what configuration is being used
4. **Safety**: Automatic backup and restore prevents configuration loss
5. **Consistency**: iOS always uses the same bundle identifier and app name

### Troubleshooting

- **jq not found**: Install jq using the commands above
- **app.json not found**: Ensure you're running the script from the project root
- **Build failures**: Check that your EAS configuration is correct
- **Version issues**: Verify your `version-config.local.json` file exists and is valid
