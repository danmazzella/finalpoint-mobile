#!/bin/bash

# FinalPoint Mobile App - Environment-Specific Build Script
# This script builds the app for different environments with appropriate configurations

# Function to cleanup on exit
cleanup() {
    print_status "🧹 Cleaning up..."
    restore_app_config
}

# Set trap to cleanup on exit
trap cleanup EXIT

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Function to show help
show_help() {
    echo "FinalPoint Mobile App - Environment Build Script"
    echo ""
    echo "Usage: $0 <environment> [platform]"
    echo ""
    echo "Environments:"
    echo "  development, dev    - Development build (APK, auto-increment versions)"
    echo "  staging             - Staging build (AAB, auto-increment versions)"
    echo "  production, prod    - Production build (AAB, fixed versions)"
    echo "  production-apk      - Production APK build (Android only, fixed versions)"
    echo ""
    echo "Platforms:"
    echo "  android             - Build for Android only"
    echo "  ios                 - Build for iOS only"
    echo "  all                 - Build for all platforms (default)"
    echo ""
    echo "Examples:"
    echo "  $0 development android"
    echo "  $0 staging ios"
    echo "  $0 production all"
    echo "  $0 production-apk"
    echo "  $0 staging --dry-run"
    echo ""
    echo "Version Management:"
    echo "  Development/Staging: Auto-increments version codes"
    echo "  Production: Uses fixed versions from version-config.template.json"
    echo ""
    echo "Options:"
    echo "  --dry-run           - Show configuration changes without building"
}

# Function to handle version management using version-manager.js
manage_versions() {
    local environment=$1
    local platform=$2
    
    print_status "🔧 Managing versions for $environment environment..."
    
    # Load version configuration to check auto-increment setting
    local versionLocalPath="./version-config.local.json"
    local auto_increment=false
    
    if [ -f "$versionLocalPath" ]; then
        # Extract auto-increment setting for the specific environment
        local environmentKey=""
        case $environment in
            "development"|"dev")
                environmentKey="development"
                ;;
            "staging")
                environmentKey="staging"
                ;;
            "production"|"prod")
                environmentKey="production"
                ;;
            "production-apk")
                environmentKey="production-apk"
                ;;
        esac
        
        # Check if auto-increment is enabled for this environment
        if [ -n "$environmentKey" ]; then
            auto_increment=$(cat "$versionLocalPath" | jq -r ".$environmentKey.autoIncrement // false")
            print_status "📋 Auto-increment setting for $environment: $auto_increment"
        fi
    else
        print_status "📁 No local version config found, using default behavior"
        # Default behavior: auto-increment for dev/staging, fixed for production
        case $environment in
            "development"|"dev"|"staging")
                auto_increment=true
                ;;
            "production"|"prod"|"production-apk")
                auto_increment=false
                ;;
        esac
    fi
    
    if [ "$auto_increment" = true ]; then
        print_status "🔄 Auto-incrementing versions for $environment environment..."
        
        # Only increment versions for the platforms being built
        if [ "$platform" = "android" ]; then
            print_status "📱 Incrementing Android version code only..."
            node scripts/version-manager.js increment "$environment" "android"
        elif [ "$platform" = "ios" ]; then
            print_status "🍎 Incrementing iOS build number only..."
            node scripts/version-manager.js increment "$environment" "ios"
        elif [ "$platform" = "all" ]; then
            # For "all" platforms, only increment if this is a development/staging build
            # Production builds with "all" should not auto-increment (use fixed versions)
            if [ "$environment" = "development" ] || [ "$environment" = "dev" ] || [ "$environment" = "staging" ]; then
                print_status "📱🍎 Incrementing both Android and iOS versions for development/staging..."
                node scripts/version-manager.js increment "$environment" "android"
                node scripts/version-manager.js increment "$environment" "ios"
            else
                print_status "ℹ️  Production build with 'all' platforms - using fixed versions (no increment)"
            fi
        fi
    else
        print_status "ℹ️  Using fixed versions for $environment environment"
    fi
}

# Function to update app.json configuration for the environment
update_app_config() {
    local environment=$1
    local platform=$2
    
    print_status "⚙️  Updating app.json configuration for $environment environment..."
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        print_error "❌ jq is not installed. Please install jq to use this script."
        print_error "   macOS: brew install jq"
        print_error "   Ubuntu/Debian: sudo apt-get install jq"
        print_error "   CentOS/RHEL: sudo yum install jq"
        exit 1
    fi
    
    # Check if app.json exists
    if [ ! -f "app.json" ]; then
        print_error "❌ app.json not found in current directory"
        exit 1
    fi
    
    # Create backup of original app.json in a more protected location
    print_status "📋 Creating backup of app.json..."
    local backupDir="./.build-backup"
    mkdir -p "$backupDir"
    
    if cp app.json "$backupDir/app.json.backup"; then
        print_success "✅ Backup created: $backupDir/app.json.backup"
        # Verify backup exists and has content
        if [ -f "$backupDir/app.json.backup" ] && [ -s "$backupDir/app.json.backup" ]; then
            print_status "📋 Backup verified: $(wc -c < "$backupDir/app.json.backup") bytes"
            # Also create a symlink for compatibility
            ln -sf "$backupDir/app.json.backup" app.json.backup
        else
            print_error "❌ Backup creation failed or backup is empty"
            exit 1
        fi
    else
        print_error "❌ Failed to create backup of app.json"
        exit 1
    fi
    
    # Load version configuration
    local versionLocalPath="./version-config.local.json"
    local versionInfo='{"version":"1.0.8","androidVersionCode":15,"iosBuildNumber":43}'
    
    if [ -f "$versionLocalPath" ]; then
        print_status "📁 Using local version configuration"
        versionInfo=$(cat "$versionLocalPath")
    else
        print_status "📁 Using default version configuration"
    fi
    
    # Parse version info for the specific environment
    local environmentKey=""
    case $environment in
        "development"|"dev")
            environmentKey="development"
            ;;
        "staging")
            environmentKey="staging"
            ;;
        "production"|"prod")
            environmentKey="production"
            ;;
        "production-apk")
            environmentKey="production-apk"
            ;;
    esac
    
    # Extract version info for the specific environment using jq
    local version=$(echo "$versionInfo" | jq -r ".$environmentKey.version // empty")
    local androidVersionCode=$(echo "$versionInfo" | jq -r ".$environmentKey.androidVersionCode // empty")
    local iosBuildNumber=$(echo "$versionInfo" | jq -r ".$environmentKey.iosBuildNumber // empty")
    
    # Validate parsed values
    if [ -z "$androidVersionCode" ] || [ -z "$iosBuildNumber" ]; then
        print_error "❌ Failed to parse version information for $environment from $versionLocalPath"
        print_error "   Expected format: {\"$environmentKey\": {\"version\":\"1.0.8\",\"androidVersionCode\":15,\"iosBuildNumber\":43}}"
        exit 1
    fi
    
    # Update app.json based on environment
    case $environment in
        "development"|"dev")
            # Update for development
            jq --arg name "FP Dev" \
               --arg scheme "finalpoint-dev" \
               --arg androidPackage "com.finalpoint.dev" \
               --arg androidVersionCode "$androidVersionCode" \
               --arg iosBuildNumber "$iosBuildNumber" \
               '.expo.name = $name | .expo.scheme = $scheme | .expo.android.package = $androidPackage | .expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.ios.buildNumber = $iosBuildNumber' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "staging")
            # Update for staging
            jq --arg name "FP Staging" \
               --arg scheme "finalpoint-staging" \
               --arg androidPackage "com.finalpoint.staging" \
               --arg androidVersionCode "$androidVersionCode" \
               --arg iosBuildNumber "$iosBuildNumber" \
               '.expo.name = $name | .expo.scheme = $scheme | .expo.android.package = $androidPackage | .expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.ios.buildNumber = $iosBuildNumber' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "production"|"prod")
            # Update for production
            jq --arg androidVersionCode "$androidVersionCode" \
               --arg iosBuildNumber "$iosBuildNumber" \
               '.expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.ios.buildNumber = $iosBuildNumber' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "production-apk")
            # Update for production APK (Android only)
            jq --arg androidVersionCode "$androidVersionCode" \
               '.expo.android.versionCode = ($androidVersionCode | tonumber)' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
    esac
    
    # Verify backup still exists after jq operations
    local backupDir="./.build-backup"
    if [ ! -f "$backupDir/app.json.backup" ] || [ ! -s "$backupDir/app.json.backup" ]; then
        print_error "❌ Protected backup file was lost during configuration update"
        exit 1
    fi
    
    print_success "✅ App configuration updated for $environment"
}

# Function to check backup status
check_backup_status() {
    local context="$1"
    local backupDir="./.build-backup"
    
    if [ -f "$backupDir/app.json.backup" ]; then
        if [ -s "$backupDir/app.json.backup" ]; then
            print_status "📋 Backup status [$context]: $backupDir/app.json.backup ($(wc -c < "$backupDir/app.json.backup") bytes)"
        else
            print_warning "⚠️  Backup status [$context]: $backupDir/app.json.backup exists but is empty"
        fi
    elif [ -f "app.json.backup" ]; then
        if [ -s "app.json.backup" ]; then
            print_status "📋 Backup status [$context]: app.json.backup ($(wc -c < app.json.backup) bytes)"
        else
            print_warning "⚠️  Backup status [$context]: app.json.backup exists but is empty"
        fi
    else
        print_warning "⚠️  Backup status [$context]: No backup file found in either location"
    fi
}

# Function to restore original app.json
restore_app_config() {
    print_status "🔄 Restoring original app.json configuration..."
    local backupDir="./.build-backup"
    
    # Check if backup exists and has content in protected directory
    if [ -f "$backupDir/app.json.backup" ]; then
        if [ -s "$backupDir/app.json.backup" ]; then
            print_status "📋 Found backup: $backupDir/app.json.backup ($(wc -c < "$backupDir/app.json.backup") bytes)"
            if cp "$backupDir/app.json.backup" app.json; then
                print_success "✅ Original app.json restored from protected backup"
                # Clean up
                rm -f "$backupDir/app.json.backup"
                rm -f app.json.backup  # Remove symlink if it exists
                rmdir "$backupDir" 2>/dev/null || true
            else
                print_error "❌ Failed to restore app.json from protected backup"
            fi
        else
            print_warning "⚠️  Protected backup file exists but is empty"
            rm -f "$backupDir/app.json.backup"
        fi
    elif [ -f "app.json.backup" ]; then
        if [ -s "app.json.backup" ]; then
            print_status "📋 Found backup: app.json.backup ($(wc -c < app.json.backup) bytes)"
            if mv app.json.backup app.json; then
                print_success "✅ Original app.json restored"
            else
                print_error "❌ Failed to restore app.json from backup"
                # Try to copy instead of move if move fails
                if cp app.json.backup app.json; then
                    print_success "✅ Original app.json restored (copied)"
                    rm app.json.backup
                else
                    print_error "❌ Failed to restore app.json completely"
                fi
            fi
        else
            print_warning "⚠️  Backup file exists but is empty"
            rm -f app.json.backup
        fi
    else
        print_warning "⚠️  No backup found to restore"
        # List files in current directory to help debug
        print_status "📁 Current directory contents:"
        ls -la | grep -E "(app\.json|backup)" || print_status "   No app.json or backup files found"
        print_status "📁 Protected backup directory contents:"
        ls -la "$backupDir" 2>/dev/null || print_status "   Protected backup directory not found"
    fi
}

# Function to organize build outputs after build completion
organize_build_outputs() {
    local environment=$1
    local platform=$2
    local output_dir="./builds/$environment"
    
    print_status "📁 Organizing build outputs to $output_dir..."
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Find and move build artifacts based on platform
    if [ "$platform" = "android" ] || [ "$platform" = "all" ]; then
        # Look for Android APK/AAB files
        find . -maxdepth 2 -name "*.apk" -o -name "*.aab" | while read -r file; do
            if [ -f "$file" ]; then
                local filename=$(basename "$file")
                print_status "📱 Moving Android artifact: $filename"
                mv "$file" "$output_dir/"
            fi
        done
    fi
    
    if [ "$platform" = "ios" ] || [ "$platform" = "all" ]; then
        # Look for iOS IPA files
        find . -maxdepth 2 -name "*.ipa" | while read -r file; do
            if [ -f "$file" ]; then
                local filename=$(basename "$file")
                print_status "🍎 Moving iOS artifact: $filename"
                mv "$file" "$output_dir/"
            fi
        done
    fi
    
    print_success "✅ Build outputs organized in $output_dir"
}

# Check if help is requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ] || [ "$1" = "help" ]; then
    show_help
    exit 0
fi

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "❌ Environment not specified"
    echo ""
    show_help
    exit 1
fi

ENVIRONMENT=$1
PLATFORM=${2:-"all"}

# Check for dry-run flag and adjust platform if needed
DRY_RUN=false
if [ "$2" = "--dry-run" ]; then
    DRY_RUN=true
    PLATFORM="all"  # Default to all platforms in dry-run mode
    print_status "🔍 DRY RUN MODE - No actual build will be performed"
elif [ "$3" = "--dry-run" ]; then
    DRY_RUN=true
    print_status "🔍 DRY RUN MODE - No actual build will be performed"
fi

print_status "Building for environment: $ENVIRONMENT"
print_status "Platform: $PLATFORM"

# Determine EAS profile
case $ENVIRONMENT in
    "development"|"dev")
        PROFILE="development"
        echo "Using development profile..."
        ;;
    "staging")
        PROFILE="staging"
        echo "Using staging profile..."
        ;;
    "production"|"prod")
        PROFILE="production"
        echo "Using production profile..."
        ;;
    "production-apk")
        PROFILE="production-apk"
        echo "Using production APK profile (Android only)..."
        # Force Android platform for production-apk
        if [ "$PLATFORM" != "android" ] && [ "$PLATFORM" != "all" ]; then
            echo "Warning: production-apk is Android only. Setting platform to android."
            PLATFORM="android"
        fi
        ;;
    *)
        print_error "Invalid environment. Use: development, staging, production, or production-apk"
        echo "Run '$0' for help"
        exit 1
        ;;
esac

# Handle version management using version-manager.js
manage_versions "$ENVIRONMENT" "$PLATFORM"

# Update app.json configuration for the environment
update_app_config "$ENVIRONMENT" "$PLATFORM"

# Check backup status after configuration update
check_backup_status "after config update"

# Skip build if in dry-run mode
if [ "$DRY_RUN" = true ]; then
    print_status "🔍 DRY RUN: Configuration updated, skipping build"
    print_status "🔍 DRY RUN: Would run: eas build --platform $PLATFORM --profile $PROFILE --local"
    print_status "🔍 DRY RUN: Check app.json to see the changes that would be applied"
    exit 0
fi

# Check backup status before starting build
check_backup_status "before build start"

# Build based on platform (without --output flag to avoid directory conflicts)
case $PLATFORM in
    "android")
        echo "Building Android for $ENVIRONMENT environment..."
        eas build --platform android --profile $PROFILE --local
        ;;
    "ios")
        # Prevent iOS builds for production-apk
        if [ "$ENVIRONMENT" = "production-apk" ]; then
            print_error "Error: production-apk profile is Android only. Use 'production' for iOS builds."
            exit 1
        fi
        echo "Building iOS for $ENVIRONMENT environment..."
        eas build --platform ios --profile $PROFILE --local
        ;;
    "all")
        # Prevent all-platform builds for production-apk
        if [ "$ENVIRONMENT" = "production-apk" ]; then
            echo "Error: production-apk profile is Android only. Building for Android only."
            eas build --platform android --profile $PROFILE --local
        else
            echo "Building for all platforms for $ENVIRONMENT environment..."
            eas build --platform all --profile $PROFILE --local
        fi
        ;;
    *)
        print_error "Invalid platform. Use: android, ios, or all"
        echo "Run '$0' for help"
        exit 1
        ;;
esac

# Organize build outputs after successful build
organize_build_outputs "$ENVIRONMENT" "$PLATFORM"

print_success "Build completed for $ENVIRONMENT environment!"
echo "📁 Build outputs organized in ./builds/$ENVIRONMENT/"
