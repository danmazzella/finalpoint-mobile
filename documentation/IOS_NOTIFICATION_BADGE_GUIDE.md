# iOS Notification Badge Management Guide

## 🎯 **Overview**

This guide explains how iOS notification badges work in the FinalPoint mobile app and how to properly manage them to ensure they clear when expected.

## 🔴 **How iOS Notification Badges Work**

### **Badge Count Behavior**
- **Increment**: iOS automatically increments the badge count when a push notification arrives
- **Display**: The red badge appears on the app icon showing the total number of unread notifications
- **Manual Control**: Apps can manually set, increment, decrement, or clear badge counts
- **Persistence**: Badge counts persist until manually cleared by the app

### **Common Badge Issues**
- Badges not clearing when notifications are dismissed
- Badges not clearing when notifications are tapped
- Badges accumulating over time
- Badges not clearing when app is opened

## 🛠️ **Badge Management Functions**

### **Available Functions**
```typescript
// Get current badge count
await getBadgeCountAsync(): Promise<number>

// Set specific badge count
await setBadgeCountAsync(count: number): Promise<void>

// Clear badge (set to 0)
await clearBadgeAsync(): Promise<void>

// Decrement badge by 1
await decrementBadgeAsync(): Promise<void>

// Get and clear badge in one operation
await getAndClearBadgeAsync(): Promise<number>

// Reset badge to 0
await resetBadgeAsync(): Promise<void>

// Smart badge clearing (only when no active notifications)
await smartClearBadgeAsync(): Promise<boolean>

// Force clear badge (useful for manually dismissed notifications)
await forceClearBadgeAsync(): Promise<void>

// Debug utility for troubleshooting
await debugBadgeAsync(): Promise<void>
```

## 📱 **When Badges Are Cleared**

### **Automatic Badge Clearing**
1. **App Becomes Active**: When user opens the app or brings it to foreground
2. **Notification Received While App Running**: When notification arrives while app is in foreground
3. **Notification Response**: When user taps on a notification
4. **Smart Clearing**: Automatically clears badges when no active notifications exist
5. **Periodic Clearing**: Checks and clears orphaned badges every 5 seconds

### **Manual Badge Clearing**
- **App Launch**: Badge is cleared when app starts
- **App State Change**: Badge is cleared when app comes to foreground
- **User Actions**: Badge can be manually cleared in response to user interactions
- **Settings Screen**: Manual "Clear Badge" button in notification settings (iOS only)

## 🔧 **Implementation Details**

### **Comprehensive Badge Management Solution**

The app now implements a multi-layered approach to badge management that handles all scenarios:

#### **1. Immediate Badge Clearing**
- **Foreground Notifications**: Badge clears immediately when notification arrives while app is running
- **Notification Taps**: Badge clears when user responds to notification
- **App Launch**: Badge clears when app starts

#### **2. Smart Badge Clearing**
- **Background Notifications**: Badge clears when app becomes active
- **Dismissed Notifications**: Badge clears automatically when no active notifications exist
- **App State Changes**: Badge clearing triggered by app lifecycle events only

#### **3. Manual Badge Management**
- **Settings Screen**: "Clear Badge" button for manual badge clearing
- **Debug Functions**: Utilities for troubleshooting badge issues

### **Efficient Badge Management Strategy**

The app uses an **event-driven approach** that only clears badges when necessary:

- ✅ **App becomes active** → Badge clears immediately
- ✅ **Notification received** → Badge clears immediately  
- ✅ **Notification tapped** → Badge clears immediately
- ✅ **App state changes** → Badge clearing triggered only when needed
- ❌ **No wasteful intervals** → No background processing every few seconds

### **App Layout Badge Management**
```typescript
// Clear badge when notification received while app is running
const handleNotificationReceived = async (notification: any) => {
  // ... handle notification
  await clearBadgeAsync();
};

// Clear badge when user responds to notification
const handleNotificationResponse = async (response: any) => {
  // ... handle response
  await clearBadgeAsync();
};

// Clear badge when app becomes active
useEffect(() => {
  const clearBadgeOnAppActive = async () => {
    await getAndClearBadgeAsync();
  };
  
  // Clear on mount
  clearBadgeOnAppActive();
  
  // Clear when app comes to foreground
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      clearBadgeOnAppActive();
    }
  });
  
  return () => subscription?.remove();
}, []);
```

## 🧪 **Testing Badge Management**

### **Test Scenarios**
1. **Background Notification**
   - Send notification while app is in background
   - Verify badge appears on app icon
   - Open app and verify badge clears

2. **Foreground Notification**
   - Send notification while app is running
   - Verify badge clears immediately

3. **Notification Tap**
   - Send notification while app is in background
   - Tap notification to open app
   - Verify badge clears

4. **App State Changes**
   - Send notification while app is in background
   - Bring app to foreground without tapping notification
   - Verify badge clears

### **Debug Commands**
```typescript
// Check current badge count
const badgeCount = await getBadgeCountAsync();
console.log('Current badge count:', badgeCount);

// Manually clear badge
await clearBadgeAsync();
console.log('Badge cleared');

// Set specific badge count for testing
await setBadgeCountAsync(5);
console.log('Badge set to 5');
```

## 🚨 **Troubleshooting**

### **Badge Not Clearing**
- **Check Permissions**: Ensure notification permissions are granted
- **Verify Functions**: Confirm badge management functions are being called
- **Check Platform**: Badge functions only work on iOS
- **Review Logs**: Look for error messages in console

### **Badge Count Incorrect**
- **Reset Badge**: Use `resetBadgeAsync()` to force badge to 0
- **Check Server**: Verify server isn't sending duplicate notifications
- **Review Logic**: Ensure badge clearing logic is called in all scenarios

### **Performance Issues**
- **Async Operations**: All badge operations are asynchronous
- **Error Handling**: Wrap badge operations in try-catch blocks
- **Platform Checks**: Only run badge operations on iOS

## 📋 **Best Practices**

### **When to Clear Badges**
- ✅ App becomes active (user opens app)
- ✅ Notification received while app is running
- ✅ User responds to notification
- ✅ User manually dismisses notifications
- ✅ App-specific user actions (e.g., viewing notifications)

### **When NOT to Clear Badges**
- ❌ While app is in background
- ❌ Before user has seen the notification
- ❌ Without user interaction (unless appropriate)

### **Error Handling**
```typescript
try {
  await clearBadgeAsync();
} catch (error) {
  console.error('Error clearing badge:', error);
  // Don't crash the app if badge clearing fails
}
```

## 🔗 **Related Documentation**
- [Android Notifications Troubleshooting](./ANDROID_NOTIFICATIONS_TROUBLESHOOTING.md)
- [Notification Setup Guide](./NOTIFICATION_SETUP.md)
- [Push Notification Testing](./MOCK_RACE_TESTING.md)

## 📞 **Support**

If you continue to experience badge issues after implementing these solutions:
1. Check the console logs for error messages
2. Verify notification permissions are granted
3. Test with a clean app install
4. Review server-side notification sending logic
