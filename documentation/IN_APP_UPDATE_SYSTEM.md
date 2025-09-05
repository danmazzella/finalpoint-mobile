# In-App Update System

This document describes the in-app update system implemented for the FinalPoint mobile app, which allows users to receive notifications about app updates and easily update to the latest version.

## Overview

The in-app update system provides:
- Automatic version checking when the app starts or becomes active
- Clean, user-friendly update popup with release notes
- Support for both Android and iOS platforms
- Required vs optional update handling
- Skip functionality for non-required updates
- Admin interface for managing app versions

## Architecture

### Components

1. **UpdateService** (`src/services/UpdateService.ts`)
   - Handles API communication for version checking
   - Manages app store redirection
   - Version comparison logic

2. **UpdateContext** (`src/context/UpdateContext.tsx`)
   - Manages update state across the app
   - Handles automatic update checking
   - Manages user preferences (skip functionality)

3. **UpdatePopup** (`components/UpdatePopup.tsx`)
   - Clean, modern UI for update notifications
   - Supports both light and dark themes
   - Handles required vs optional updates

4. **App Versions Screen** (`app/app-versions.tsx`)
   - Admin interface for managing app versions
   - Add new versions with release notes
   - Mark updates as required or optional

### Backend API

1. **App Controller** (`finalpoint-api/api/controllers/appController.js`)
   - `POST /api/app/check-update` - Check for available updates
   - `GET /api/app/versions` - Get all app versions (admin)
   - `POST /api/app/versions` - Create/update app version (admin)

2. **Database Table** (`app_versions`)
   - Stores version information for each platform
   - Tracks required vs optional updates
   - Stores release notes and update URLs

## Features

### Automatic Update Checking

- Checks for updates when the app starts
- Checks when the app becomes active (foreground)
- Respects user preferences (skipped versions)
- Rate limiting (24-hour intervals between checks)

### Update Popup

- **Required Updates**: Users must update to continue using the app
- **Optional Updates**: Users can skip and update later
- **Release Notes**: Shows what's new in the update
- **Version Comparison**: Displays current vs latest version
- **Platform-Specific**: Handles Android and iOS differently

### Admin Management

- Add new app versions through the admin interface
- Set release notes and update requirements
- Manage both Android and iOS versions separately
- Track version history

## Usage

### For Users

1. **Automatic**: The app will automatically check for updates and show a popup if available
2. **Update Now**: Tap to open the appropriate app store
3. **Skip**: For optional updates, users can skip and be reminded later
4. **Required Updates**: Must be updated to continue using the app

### For Admins

1. Navigate to the App Versions screen (admin only)
2. Add new versions with:
   - Version number (e.g., "1.0.9")
   - Platform (Android/iOS)
   - Build number/version code
   - Release notes
   - Whether the update is required
3. The system will automatically notify users of the new version

## Configuration

### Update Check Frequency

The system checks for updates:
- When the app starts
- When the app becomes active (foreground)
- Maximum once every 24 hours (configurable in `UpdateContext`)

### Skip Functionality

Users can skip optional updates, and the system will:
- Remember the skipped version
- Not show the popup again for that version
- Still check for newer versions

### Required Updates

Required updates:
- Cannot be skipped
- Must be updated to continue using the app
- Show a different UI indicating the update is mandatory

## Platform Differences

### Android

- Uses `versionCode` for version comparison
- Opens Google Play Store for updates
- Supports in-app updates (future enhancement)

### iOS

- Uses `buildNumber` for version comparison
- Opens App Store for updates
- Follows Apple's update guidelines

## API Endpoints

### Check for Updates

```http
POST /api/app/check-update
Content-Type: application/json

{
  "currentVersion": "1.0.8",
  "platform": "android",
  "buildNumber": "15"
}
```

**Response:**
```json
{
  "success": true,
  "hasUpdate": true,
  "currentVersion": "1.0.8",
  "latestVersion": "1.0.9",
  "isRequired": false,
  "releaseNotes": "Bug fixes and performance improvements",
  "updateUrl": "https://play.google.com/store/apps/details?id=com.finalpoint.mobile"
}
```

### Get App Versions (Admin)

```http
GET /api/app/versions
Authorization: Bearer <admin_token>
```

### Create App Version (Admin)

```http
POST /api/app/versions
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "version": "1.0.9",
  "platform": "android",
  "android_version_code": 16,
  "is_required": false,
  "release_notes": "Bug fixes and performance improvements"
}
```

## Database Schema

```sql
CREATE TABLE app_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    platform ENUM('android', 'ios') NOT NULL,
    android_version_code INT,
    ios_build_number VARCHAR(20),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    release_notes TEXT,
    update_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Future Enhancements

1. **In-App Updates for Android**: Use Google Play's in-app update API
2. **Progressive Updates**: Download updates in the background
3. **Update Scheduling**: Allow users to schedule updates
4. **Analytics**: Track update adoption rates
5. **A/B Testing**: Test different update prompts

## Troubleshooting

### Common Issues

1. **Update not showing**: Check if the version was marked as skipped
2. **API errors**: Verify the backend is running and accessible
3. **Store not opening**: Check device configuration and app store availability

### Debug Information

The system logs update check results to the console:
- `🔍 Checking for updates` - When checking starts
- `📱 Update check result` - Shows the result
- `⏭️ Skipping update popup` - When version was previously skipped
- `✅ App is up to date` - When no update is available

## Security Considerations

- Admin endpoints require authentication
- Version data is validated before storage
- Update URLs are validated for security
- Rate limiting prevents abuse

## Testing

### Manual Testing

1. **Add a new version** through the admin interface
2. **Lower the current version** in `app.json` to trigger an update
3. **Test skip functionality** with optional updates
4. **Test required updates** by marking a version as required

### Automated Testing

The system can be tested by:
- Mocking the API responses
- Testing different version scenarios
- Verifying UI behavior for different update types
