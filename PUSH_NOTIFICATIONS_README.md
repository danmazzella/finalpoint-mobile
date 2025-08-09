# Push Notifications Implementation Guide

This guide covers the implementation of Apple Push Notifications (APNs) and Google Firebase Cloud Messaging (FCM) in your FinalPoint mobile app.

## 🚀 What's Been Implemented

### 1. Dependencies Installed
- `expo-notifications` - Core notification handling
- `expo-device` - Device detection
- `expo-constants` - Access to Expo configuration

### 2. Configuration Updates
- **app.json**: Added notification plugin configuration and iOS bundle identifier
- **App Layout**: Integrated NotificationProvider for global notification handling

### 3. Core Files Created

#### `/utils/notifications.ts`
- Centralized notification utilities
- Token registration functions
- Permission handling
- Local notification scheduling

#### `/hooks/useNotifications.ts`
- React hook for notification management
- Automatic registration support
- Error handling and state management

#### `/components/NotificationProvider.tsx`
- React context provider for global notification state
- Simplified notification access throughout the app

#### `/components/NotificationSettings.tsx`
- Standalone notification settings component (optional)

### 4. Enhanced Existing Features
- **app/notifications.tsx**: Enhanced with push notification registration and token management
- Added visual status indicators for push notification setup
- Integrated test notification functionality

## 🔧 Setup Requirements

### 1. Expo Configuration
Update your EAS project configuration:

```bash
# Make sure you have EAS CLI installed
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Configure your project (if not already done)
eas build:configure
```

### 2. iOS Setup (Apple Push Notifications)

1. **Apple Developer Account**:
   - Ensure you have an active Apple Developer account
   - Register your app's bundle identifier: `com.finalpoint.mobile`

2. **Push Notification Capability**:
   - In Apple Developer Console, enable Push Notifications for your app ID
   - Generate APNs certificates or keys

3. **EAS Build Configuration**:
   ```json
   // In eas.json, add iOS-specific configuration
   {
     "build": {
       "production": {
         "ios": {
           "bundleIdentifier": "com.finalpoint.mobile"
         }
       }
     }
   }
   ```

### 3. Android Setup (Firebase Cloud Messaging)

1. **Firebase Project**:
   - Create a Firebase project at https://console.firebase.google.com
   - Add an Android app with package name: `com.finalpoint.mobile`

2. **Download Configuration**:
   - Download `google-services.json` from Firebase Console
   - Place it in the root directory of your project

3. **Update app.json**:
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json",
         "package": "com.finalpoint.mobile"
       }
     }
   }
   ```

### 4. Notification Icon Setup

Create notification icons and place them in the assets folder:
- `assets/images/notification-icon.png` (Android notification icon)
- Ensure the icon follows Android notification icon guidelines (white and transparent)

## 🔄 Backend Integration

### API Endpoint for Token Storage
You'll need to update your backend to handle push token storage:

```javascript
// Example API endpoint structure
POST /api/push-tokens
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "userId": "12345",
  "platform": "ios" | "android"
}
```

### Sending Push Notifications
Use Expo's push notification service to send notifications:

```javascript
// Example server-side code to send notifications
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const sendPushNotification = async (tokens, title, body, data = {}) => {
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notification receipts:', receipts);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }
};
```

## 📱 Usage in Your App

### Basic Usage
The NotificationProvider is already integrated into your app root, so you can use notifications anywhere:

```tsx
import { useNotificationContext } from '../components/NotificationProvider';

function MyComponent() {
  const { pushToken, showLocalNotification } = useNotificationContext();
  
  const handleTestNotification = async () => {
    await showLocalNotification(
      'Test Title',
      'Test message',
      { customData: 'value' }
    );
  };

  return (
    <TouchableOpacity onPress={handleTestNotification}>
      <Text>Send Test Notification</Text>
    </TouchableOpacity>
  );
}
```

### Advanced Usage
For more control, you can use the hook directly:

```tsx
import { useNotifications } from '../hooks/useNotifications';

function AdvancedComponent() {
  const {
    pushToken,
    isSupported,
    register,
    sendTokenToServer
  } = useNotifications({
    autoRegister: false,
    onNotificationReceived: (notification) => {
      console.log('Received:', notification);
    },
    onNotificationResponse: (response) => {
      // Handle notification tap
      console.log('User tapped:', response);
    }
  });

  // Manual registration
  const handleRegister = async () => {
    await register();
    if (pushToken) {
      await sendTokenToServer('current-user-id');
    }
  };

  return (
    <TouchableOpacity onPress={handleRegister}>
      <Text>Register for Notifications</Text>
    </TouchableOpacity>
  );
}
```

## 🧪 Testing

### Local Testing
1. Use the test notification buttons in the notification settings screen
2. Test with both iOS simulator and Android emulator
3. Test on physical devices for full functionality

### Push Notification Testing
1. Register for notifications in the app
2. Send the token to your server
3. Use Expo's push notification tool: https://expo.dev/notifications
4. Test with different notification payloads

## 🚨 Important Notes

### Development vs Production
- **Development**: Notifications work in Expo Go for testing
- **Production**: Requires building standalone apps for full push notification support

### Permissions
- iOS: Users must explicitly grant notification permissions
- Android: Basic notification permissions are granted by default (Android 13+ requires explicit permission)

### Token Management
- Push tokens can change, especially after app updates
- Implement token refresh logic in your backend
- Handle failed notification deliveries gracefully

### Notification Icon
- Android requires a specific icon format (white silhouette on transparent background)
- Create different icon sizes for different screen densities
- Test the icon appearance in dark and light themes

## 🔄 Next Steps

1. **Configure Firebase/APNs**: Set up your cloud messaging services
2. **Backend Integration**: Update your API to handle push tokens
3. **Build and Test**: Create development builds to test push notifications
4. **Production Setup**: Configure production certificates and keys
5. **Monitoring**: Implement notification delivery tracking

## 📚 Additional Resources

- [Expo Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)
- [Expo Push Notification Tool](https://expo.dev/notifications)

## 🐛 Troubleshooting

### Common Issues
1. **No push token received**: Check device/simulator requirements
2. **Notifications not appearing**: Verify permissions and notification settings
3. **Android icon issues**: Ensure proper notification icon format
4. **iOS certificates**: Verify APNs setup in Apple Developer Console

### Debug Steps
1. Check console logs for error messages
2. Verify Expo project ID in app.json
3. Test on physical devices
4. Use Expo diagnostics: `expo doctor`

For additional support, check the Expo documentation or reach out to the development team.
