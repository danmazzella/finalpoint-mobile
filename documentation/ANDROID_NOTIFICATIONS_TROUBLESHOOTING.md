# Android Notifications Troubleshooting Guide

## 🚨 **Current Issue: Android Notifications Not Working from Server**

**Symptoms:**
- ✅ Local test notifications work
- ✅ iOS notifications from server work  
- ❌ Android notifications from server don't work

## 🔍 **Root Cause Analysis**

The issue is **missing Firebase Cloud Messaging (FCM) configuration** for Android. Android requires FCM to receive push notifications from external servers, while iOS can use Expo's push service directly.

## 🔧 **Solution Steps**

### **Step 1: Enable FCM in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`finalpoint-d228b`)
3. Go to **Project Settings** (gear icon)
4. Go to **Cloud Messaging** tab
5. **Enable Firebase Cloud Messaging API**
6. **Enable Cloud Messaging API** if prompted

### **Step 2: Download Updated google-services.json**

1. In Firebase Console, go to **Project Settings**
2. In the **General** tab, scroll down to **Your apps**
3. Find your Android app (`com.finalpoint.mobile`)
4. Click **Download google-services.json**
5. Replace your current `google-services.json` with the new one

**Important:** The new file should contain FCM configuration sections.

### **Step 3: Verify FCM Configuration**

The new `google-services.json` should contain:

```json
{
  "project_info": { ... },
  "client": [
    {
      "client_info": { ... },
      "oauth_client": [ ... ],
      "api_key": [ ... ],
      "services": {
        "appinvite_service": { ... },
        "fcm": {
          "fcm_sender_id": "123456789"
        }
      }
    }
  ]
}
```

### **Step 4: Update Server Environment Variables**

Add to your server's `.env` file:

```env
# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token_here

# Firebase (if using direct FCM)
FIREBASE_SERVER_KEY=your_firebase_server_key_here
```

### **Step 5: Test Android Notifications**

1. **Rebuild your Android app** with the new `google-services.json`
2. **Test local notifications** (should still work)
3. **Test server notifications** (should now work)

## 🧪 **Testing and Debugging**

### **Use the Debug Panel**

The app now includes a notification test panel (visible in development):

1. **Check Permissions** - Verify notification permissions
2. **Test Full Flow** - Test complete notification setup
3. **Send Test Notification** - Send local test notification

### **Check Console Logs**

Look for these logs:

```
🔍 Notification Permission Debug Info: { permissionsStatus: 'granted', ... }
✅ Notification listeners set up successfully
🔔 Setting up notification listeners...
```

### **Check Server Logs**

Look for Android-specific error messages:

```
🔑 FCM credentials issue for Android token
💡 Check Firebase configuration and google-services.json
```

## 🔍 **Common Issues and Solutions**

### **Issue: "InvalidCredentials" Error**

**Cause:** FCM not properly configured
**Solution:** Follow Steps 1-2 above

### **Issue: "DeviceNotRegistered" Error**

**Cause:** Token is invalid or expired
**Solution:** App will automatically re-register

### **Issue: "MessageTooBig" Error**

**Cause:** Notification payload too large
**Solution:** Reduce notification data size

### **Issue: Permissions Show "Not Allowed"**

**Cause:** Android system-level permission issue
**Solution:** 
1. Go to **Settings > Apps > FinalPoint > Notifications**
2. Enable notifications
3. Check all permission toggles

## 📱 **Android-Specific Requirements**

### **Notification Channels (Android 8.0+)**

The app automatically creates these channels:
- `default` - General notifications
- `high-priority` - Important notifications  
- `low-priority` - Less important notifications

### **Firebase Configuration**

- **google-services.json** must be in the correct location
- **FCM API** must be enabled in Firebase Console
- **Package name** must match exactly: `com.finalpoint.mobile`

### **Build Configuration**

- **Target SDK:** 36 (Android 14)
- **Minimum SDK:** 21 (Android 5.0)
- **Edge-to-edge:** Enabled
- **Notifications:** Properly configured in app.json

## 🚀 **Next Steps After Fix**

1. **Test notifications** from the server
2. **Monitor delivery rates** in Firebase Console
3. **Check notification history** in your app
4. **Remove debug panel** from production builds

## 📚 **Additional Resources**

- [Firebase Cloud Messaging Setup](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

## ✅ **Verification Checklist**

- [ ] FCM API enabled in Firebase Console
- [ ] Updated `google-services.json` downloaded
- [ ] Server environment variables set
- [ ] Android app rebuilt with new config
- [ ] Local notifications working
- [ ] Server notifications working on Android
- [ ] No FCM credential errors in server logs
