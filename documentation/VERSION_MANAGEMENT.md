# Version Management System

This project includes an automated version management system that handles different version codes and build numbers for each environment, ensuring unique builds and proper versioning across development, staging, and production.

## How It Works

### **Automatic Version Management**

Version management is now handled **automatically in `app.config.js`** during every build, regardless of how the build is triggered:

- **Development**: Auto-increments build numbers for testing
- **Staging**: Auto-increments build numbers for QA
- **Production**: Fixed version numbers for store releases
- **Production APK**: Fixed version numbers for direct distribution

### **Version Components**

- **`version`**: Semantic version (e.g., "1.0.8")
- **`androidVersionCode`**: Android version code (integer)
- **`iosBuildNumber`**: iOS build number (string)
- **`autoIncrement`**: Whether to automatically increment versions

## Configuration Files

### **Hybrid Configuration Approach**

The system uses a **hybrid approach** with multiple configuration files:

1. **`version-config.template.json`** - Template configuration (committed to git)
2. **`version-config.local.json`** - Local configuration (gitignored, auto-generated)
3. **`version-config.json`** - Project configuration (optional, can be committed)

### **File Priority (Highest to Lowest)**

1. **`version-config.local.json`** - Local overrides (gitignored)
2. **`version-config.json`** - Project-specific configuration
3. **`version-config.template.json`** - Base template (committed to git)
4. **Default values** - Hardcoded fallbacks

### **Version Configuration Structure**

```json
{
  "development": {
    "version": "1.0.8",
    "androidVersionCode": 43,
    "iosBuildNumber": 43,
    "autoIncrement": true
  },
  "staging": {
    "version": "1.0.8",
    "androidVersionCode": 43,
    "iosBuildNumber": 43,
    "autoIncrement": true
  },
  "production": {
    "version": "1.0.8",
    "androidVersionCode": 15,
    "iosBuildNumber": 43,
    "autoIncrement": false
  },
  "production-apk": {
    "version": "1.0.8",
    "androidVersionCode": 15,
    "iosBuildNumber": 43,
    "autoIncrement": false
  }
}
```

### **Auto-Increment Strategy**

- **Development & Staging**: Build numbers increment automatically
- **Production**: Fixed versions (manual updates only)
- **Build Types**: `build` (default), `patch`, `minor`, `major`

## Usage

### **Version Management Commands**

```bash
# Initialize local version configuration
npm run version:init

# Check version status for all environments
npm run version:status

# Increment versions for an environment
npm run version:increment <environment> [type]

# Update app.config.js with environment versions
npm run version:update-config <environment>

# Reset to template values
npm run version:reset

# Show help
npm run version:help
```

### **Examples**

```bash
# Increment build numbers for development
npm run version:increment development

# Increment patch version for staging
npm run version:increment staging patch

# Update production config
npm run version:update-config production

# Reset to template values
npm run version:reset

# Check all version statuses
npm run version:status
```

### **Automatic Version Management**

Version management happens automatically during **any build**, regardless of how it's triggered:

```bash
# These all automatically handle version management:
npm run build:dev            # Auto-increments dev versions
npm run build:staging        # Auto-increments staging versions
npm run build:prod           # Uses fixed production versions
npm run build:prod-apk       # Uses fixed production versions

# Direct EAS commands also work:
eas build --profile development --local  # Auto-increments dev versions
eas build --profile staging --local      # Auto-increments staging versions
eas build --profile production --local   # Uses fixed production versions
```

## Version Increment Types

### **Build Increment (Default)**
- Increments `androidVersionCode` and `iosBuildNumber`
- Used for development and staging builds
- Ensures unique builds for testing

### **Semantic Version Increments**
- **`patch`**: Increments patch version (1.0.8 → 1.0.9)
- **`minor`**: Increments minor version (1.0.8 → 1.1.0)
- **`major`**: Increments major version (1.0.8 → 2.0.0)

## Integration with Build System

### **Automatic Version Updates**

1. **Build Triggered**: Any build command (EAS, npm script, direct)
2. **Version Check**: `app.config.js` checks if auto-increment is enabled
3. **Version Update**: Increments appropriate version numbers
4. **Config Update**: Saves updated versions to `version-config.local.json`
5. **Build Execution**: EAS build runs with updated versions

### **Environment Mapping**

The system maps EAS build profiles to version configurations:

- `development` → `development`
- `staging` → `staging`
- `production` → `production`
- `production-apk` → `production-apk`

### **Universal Compatibility**

Version management works with **any build method**:

- ✅ **npm/yarn scripts**: `npm run build:dev`
- ✅ **Direct EAS commands**: `eas build --profile development`
- ✅ **Build script**: `./scripts/build-env.sh development`
- ✅ **CI/CD pipelines**: Any automated build process
- ✅ **Manual builds**: Direct EAS CLI usage

## File Structure

```
finalpoint-mobile/
├── version-config.template.json  # Template configuration (committed to git)
├── version-config.local.json     # Local configuration (gitignored, auto-generated)
├── version-config.json           # Project configuration (optional)
├── scripts/
│   ├── version-manager.js        # Version management script
│   └── build-env.sh             # Build script (version management removed)
├── app.config.js                 # Dynamic configuration with automatic version management
└── documentation/
    └── VERSION_MANAGEMENT.md     # This documentation
```

## Best Practices

### **Development Workflow**

1. **Daily Development**: Use any method to build for development
2. **QA Testing**: Use any method to build for staging
3. **Production Release**: Use any method to build for production
4. **Direct Distribution**: Use any method to build production APK

### **Version Management**

1. **Keep Production Fixed**: Don't auto-increment production versions
2. **Regular Development**: Let development/staging auto-increment
3. **Manual Updates**: Update production versions when ready to release
4. **Version Tracking**: Use `npm run version:status` to monitor versions
5. **Template Updates**: Update `version-config.template.json` for team-wide changes

### **Release Process**

1. **Feature Complete**: Development and staging are tested
2. **Version Update**: Manually update production version in template
3. **Team Sync**: Commit template changes for team coordination
4. **Production Build**: Run any production build command with new version
5. **Store Upload**: Upload to App Store/Play Store

### **Team Collaboration**

1. **Template File**: `version-config.template.json` is committed to git
2. **Local Overrides**: `version-config.local.json` is gitignored
3. **Version Sync**: Team can reset to template with `npm run version:reset`
4. **Conflict Resolution**: Local changes don't interfere with team builds

## Troubleshooting

### **Common Issues**

- **Version Conflicts**: Ensure each environment has unique version codes
- **Build Failures**: Check that version configuration files exist and are valid
- **Auto-increment Issues**: Verify autoIncrement settings in configuration
- **File Not Found**: Use `npm run version:init` to create local config

### **Reset Versions**

To reset version numbers for an environment:

```bash
# Reset to template values
npm run version:reset

# Or edit version-config.local.json manually
# Or use version manager to set specific values
npm run version:increment development build
```

### **Manual Version Override**

For emergency fixes, you can manually edit `version-config.local.json`:

```json
{
  "development": {
    "version": "1.0.9",
    "androidVersionCode": 50,
    "iosBuildNumber": 50,
    "autoIncrement": true
  }
}
```

## Benefits

- ✅ **Universal**: Works with any build method (EAS, npm scripts, CI/CD)
- ✅ **Automatic**: No manual intervention needed during builds
- ✅ **Team Coordination**: Template file ensures version consistency
- ✅ **Local Flexibility**: Developers can have local overrides
- ✅ **Unique Builds**: Each environment has distinct version codes
- ✅ **Environment Isolation**: Development and production versions are separate
- ✅ **Build Consistency**: Versions are automatically applied to builds
- ✅ **Easy Rollbacks**: Can easily revert to previous versions
- ✅ **Store Compliance**: Meets app store versioning requirements
- ✅ **Flexible**: Use your preferred build method without losing version management
