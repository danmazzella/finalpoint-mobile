#!/bin/bash

# FinalPoint Mobile App - Environment-Specific Build Script
# This script builds the app for different environments with appropriate configurations

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
    echo "  production_apk      - Production APK build (Android only, fixed versions)"
    echo "  production_ipa      - Production IPA build (iOS only, fixed versions)"
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
    echo "  $0 production_apk"
    echo "  $0 production_ipa"
    echo "  $0 staging --dry-run"
    echo ""
    echo "Version Management:"
    echo "  Development/Staging: Auto-increments build numbers (versionCode/buildNumber)"
    echo "  Production: Uses fixed build numbers from version-config.template.json"
    echo "  Semantic versions (1.0.8, etc.) are managed manually and not auto-incremented"
    echo ""
    echo "Options:"
    echo "  --dry-run           - Show configuration changes without building"
    echo ""
    echo "Note: This script modifies app.json directly. Manual changes will persist."
}

# Function to handle version management using version-manager.js
manage_versions() {
    local environment=$1
    local platform=$2
    
    print_status "🔧 Managing build numbers for $environment environment..."
    
    # Determine if we should auto-increment build numbers (not semantic versions)
    local should_increment_build_numbers=false
    
    case $environment in
        "development"|"dev"|"staging")
            should_increment_build_numbers=true
            print_status "📋 Auto-incrementing build numbers for $environment environment"
            ;;
        "production"|"prod"|"production_apk"|"production_ipa")
            should_increment_build_numbers=false
            print_status "📋 Using fixed build numbers for $environment environment"
            ;;
    esac
    
    if [ "$should_increment_build_numbers" = true ]; then
        print_status "🔄 Auto-incrementing build numbers (versionCode/buildNumber) for $environment environment..."
        print_status "ℹ️  Semantic version will remain unchanged (managed manually)"
        
        # Only increment build numbers for the platforms being built
        if [ "$platform" = "android" ]; then
            print_status "📱 Incrementing Android version code only..."
            node scripts/version-manager.js increment "$environment" "android"
        elif [ "$platform" = "ios" ]; then
            print_status "🍎 Incrementing iOS build number only..."
            node scripts/version-manager.js increment "$environment" "ios"
        elif [ "$platform" = "all" ]; then
            print_status "📱🍎 Incrementing both Android and iOS build numbers..."
            node scripts/version-manager.js increment "$environment" "all"
        fi
    else
        print_status "ℹ️  Using fixed build numbers for $environment environment"
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
    
    # Load version configuration
    local versionLocalPath="./version-config.local.json"
    local versionInfo='{"version":"1.0.8","androidVersionCode":15,"iosBuildNumber":43}'
    
    if [ -f "$versionLocalPath" ]; then
        print_status "📁 Using local version configuration"
        versionInfo=$(cat "$versionLocalPath")
    else
        print_status "📁 Using default version configuration"
    fi
    
    # Parse version info for the specific environment using jq
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
            "production_apk")
                environmentKey="production_apk"
                ;;
            "production_ipa")
                environmentKey="production_ipa"
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
               --arg version "$version" \
               --arg scheme "finalpoint-dev" \
               --arg androidPackage "com.finalpoint.dev" \
               --arg androidVersionCode "$androidVersionCode" \
               --arg iosBuildNumber "$iosBuildNumber" \
               --arg iosBundleId "com.finalpoint.dev" \
               --arg namespace "com.finalpoint.dev" \
               '.expo.name = $name | .expo.version = $version | .expo.scheme = $scheme | .expo.android.package = $androidPackage | .expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.ios.buildNumber = $iosBuildNumber | .expo.ios.bundleIdentifier = $iosBundleId | .expo.plugins[4][1].android.namespace = $namespace' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "staging")
            # Update for staging
            jq --arg name "FP Staging" \
               --arg version "$version" \
               --arg scheme "finalpoint-staging" \
               --arg androidPackage "com.finalpoint.staging" \
               --arg androidVersionCode "$androidVersionCode" \
               --arg iosBuildNumber "$iosBuildNumber" \
               --arg iosBundleId "com.finalpoint.staging" \
               --arg namespace "com.finalpoint.staging" \
               '.expo.name = $name | .expo.version = $version | .expo.scheme = $scheme | .expo.android.package = $androidPackage | .expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.ios.buildNumber = $iosBuildNumber | .expo.ios.bundleIdentifier = $iosBundleId | .expo.plugins[4][1].android.namespace = $namespace' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "production"|"prod")
            # Update for production
            jq --arg name "FinalPoint" \
               --arg version "$version" \
               --arg scheme "finalpoint" \
               --arg androidPackage "com.finalpoint.mobile" \
               --arg androidVersionCode "$androidVersionCode" \
               --arg iosBuildNumber "$iosBuildNumber" \
               --arg iosBundleId "com.finalpoint.mobile" \
               --arg namespace "com.finalpoint.mobile" \
               '.expo.name = $name | .expo.version = $version | .expo.scheme = $scheme | .expo.android.package = $androidPackage | .expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.ios.buildNumber = $iosBuildNumber | .expo.ios.bundleIdentifier = $iosBundleId | .expo.plugins[4][1].android.namespace = $namespace' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "production_apk")
            # Update for production APK (Android only)
            jq --arg name "FinalPoint" \
               --arg version "$version" \
               --arg scheme "finalpoint" \
               --arg androidPackage "com.finalpoint.mobile" \
               --arg androidVersionCode "$androidVersionCode" \
               --arg namespace "com.finalpoint.mobile" \
               '.expo.name = $name | .expo.version = $version | .expo.scheme = $scheme | .expo.android.package = $androidPackage | .expo.android.versionCode = ($androidVersionCode | tonumber) | .expo.plugins[4][1].android.namespace = $namespace' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
        "production_ipa")
            # Update for production IPA (iOS only)
            jq --arg name "FinalPoint" \
               --arg version "$version" \
               --arg scheme "finalpoint" \
               --arg iosBuildNumber "$iosBuildNumber" \
               --arg iosBundleId "com.finalpoint.mobile" \
               --arg namespace "com.finalpoint.mobile" \
               '.expo.name = $name | .expo.version = $version | .expo.scheme = $scheme | .expo.ios.buildNumber = $iosBuildNumber | .expo.ios.bundleIdentifier = $iosBundleId | .expo.plugins[4][1].android.namespace = $namespace' \
               app.json > app.json.tmp && mv app.json.tmp app.json
            ;;
    esac
    
    print_success "✅ App configuration updated for $environment"
    print_warning "⚠️  Note: app.json has been modified. Manual changes will persist."
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

# Function to output adb install commands for Android builds
output_adb_commands() {
    local environment=$1
    local platform=$2
    local output_dir="./builds/$environment"
    
    if [ "$platform" = "android" ] || [ "$platform" = "all" ]; then
        print_status "📱 Android build completed! Use these commands to install:"
        echo ""
        
        # Find the most recently created APK file in the output directory (macOS compatible)
        local latest_apk=$(find "$output_dir" -name "*.apk" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [ -n "$latest_apk" ]; then
            echo "For APK installation:"
            echo "adb install \"$latest_apk\""
            echo ""
        fi
        
        # Find the most recently created AAB file in the output directory (macOS compatible)
        local latest_aab=$(find "$output_dir" -name "*.aab" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [ -n "$latest_aab" ]; then
            echo "For AAB installation (requires bundletool):"
            echo "bundletool build-apks --bundle=\"$latest_aab\" --output=\"$latest_aab.apks\""
            echo "bundletool install-apks --apks=\"$latest_aab.apks\""
            echo ""
        fi
        
        # Check if device is connected
        if command -v adb &> /dev/null; then
            local device_count=$(adb devices | grep -v "List of devices" | grep -c "device$" 2>/dev/null || echo "0")
            # Ensure device_count is a valid number
            if [[ "$device_count" =~ ^[0-9]+$ ]] && [ "$device_count" -gt 0 ]; then
                print_success "✅ Android device detected and ready for installation"
            else
                print_warning "⚠️  No Android devices connected. Connect a device and run 'adb devices' to verify."
            fi
        else
            print_warning "⚠️  adb not found. Install Android SDK Platform Tools to use adb commands."
        fi
    fi
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
                "production_apk")
        PROFILE="production_apk"
        echo "Using production APK profile (Android only)..."
        # Force Android platform for production_apk
        if [ "$PLATFORM" != "android" ] && [ "$PLATFORM" != "all" ]; then
            echo "Warning: production_apk is Android only. Setting platform to android."
            PLATFORM="android"
        fi
        ;;
    "production_ipa")
        PROFILE="production_ipa"
        echo "Using production IPA profile (iOS only)..."
        # Force iOS platform for production_ipa
        if [ "$PLATFORM" != "ios" ] && [ "$PLATFORM" != "all" ]; then
            echo "Warning: production_ipa is iOS only. Setting platform to ios."
            PLATFORM="ios"
        fi
        ;;
    *)
        print_error "Invalid environment. Use: development, staging, production, production_apk, or production_ipa"
        echo "Run '$0' for help"
        exit 1
        ;;
esac

# Handle version management using version-manager.js
manage_versions "$ENVIRONMENT" "$PLATFORM"

# Update app.json configuration for the environment
update_app_config "$ENVIRONMENT" "$PLATFORM"

# Skip build if in dry-run mode
if [ "$DRY_RUN" = true ]; then
    print_status "🔍 DRY RUN: Configuration updated, skipping build"
    print_status "🔍 DRY RUN: Would run: eas build --platform $PLATFORM --profile $PROFILE --local"
    print_status "🔍 DRY RUN: Check app.json to see the changes that would be applied"
    exit 0
fi

# Build based on platform (without --output flag to avoid directory conflicts)
case $PLATFORM in
    "android")
        echo "Building Android for $ENVIRONMENT environment..."
        eas build --platform android --profile $PROFILE --local
        ;;
    "ios")
            # Prevent iOS builds for production_apk
        if [ "$ENVIRONMENT" = "production_apk" ]; then
            print_error "Error: production_apk profile is Android only. Use 'production' for iOS builds."
            exit 1
        fi
        # Prevent Android builds for production_ipa
        if [ "$ENVIRONMENT" = "production_ipa" ]; then
            print_error "Error: production_ipa profile is iOS only. Use 'production' for Android builds."
            exit 1
        fi
        echo "Building iOS for $ENVIRONMENT environment..."
        eas build --platform ios --profile $PROFILE --local
        ;;
    "all")
            # Prevent all-platform builds for production_apk
        if [ "$ENVIRONMENT" = "production_apk" ]; then
            echo "Error: production_apk profile is Android only. Building for Android only."
            eas build --platform android --profile $PROFILE --local
        # Prevent all-platform builds for production_ipa
        elif [ "$ENVIRONMENT" = "production_ipa" ]; then
            echo "Error: production_ipa profile is iOS only. Building for iOS only."
            eas build --platform ios --profile $PROFILE --local
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

# Output adb install commands for Android builds
output_adb_commands "$ENVIRONMENT" "$PLATFORM"

print_success "Build completed for $ENVIRONMENT environment!"
echo "📁 Build outputs organized in ./builds/$ENVIRONMENT/"
print_warning "⚠️  Note: app.json has been modified for this environment. Manual changes will persist."
print_status "ℹ️  Build numbers were auto-incremented for development/staging builds"
print_status "ℹ️  Semantic version remains unchanged (manage manually in version-config.local.json)"
