# Gesture Handling Setup for iOS

## Overview
This document explains the setup for enabling swipe from edge to go back functionality in the iOS app.

## Changes Made

### 1. Main Layout Configuration (`app/_layout.tsx`)
- Enabled `gestureEnabled: true` in the main Stack navigator
- Added `gestureDirection: 'horizontal'` for proper swipe direction
- Added `fullScreenGestureEnabled: true` for iOS-specific gesture handling
- Applied gesture settings to all individual screens

### 2. Gesture Handler Import
- Added `import 'react-native-gesture-handler';` at the top of the main layout
- This ensures gesture handler is properly initialized

### 3. Babel Configuration (`babel.config.js`)
- Added `'react-native-reanimated/plugin'` to ensure proper gesture handling

## Screen Configuration
All screens now have the following gesture options:
```typescript
options={{
  headerShown: false,
  presentation: 'card',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
}}
```

## Testing the Gesture Functionality

### Prerequisites
1. Build and run the app on an iOS device or simulator
2. Navigate to any screen that's not the root tab screen

### How to Test
1. **Navigate to a detail screen** (e.g., league details, profile, etc.)
2. **Swipe from the left edge** of the screen towards the right
3. **The screen should animate back** to the previous screen

### Expected Behavior
- Swipe from left edge should trigger the back navigation
- The gesture should feel smooth and responsive
- The animation should match the native iOS behavior

## Troubleshooting

### If gestures don't work:
1. **Clean and rebuild** the project:
   ```bash
   npx expo run:ios --clear
   ```

2. **Check gesture handler installation**:
   ```bash
   npm install react-native-gesture-handler
   ```

3. **Verify babel config** has the reanimated plugin

4. **Ensure proper imports** in the main layout file

### Common Issues
- **Gesture handler not imported first**: Make sure `react-native-gesture-handler` is imported before other navigation imports
- **Babel plugin missing**: The reanimated plugin is required for proper gesture handling
- **iOS simulator issues**: Some iOS simulator versions may have gesture handling limitations

## Platform-Specific Notes

### iOS
- Gestures work best on physical devices
- Simulator may have limited gesture support
- Full-screen gesture handling is enabled

### Android
- Gesture handling is also enabled but may behave differently
- Android has its own back gesture system

## Dependencies
- `react-native-gesture-handler`: Core gesture handling
- `react-native-reanimated`: Animation support for gestures
- `@react-navigation/native`: Navigation framework
- `expo-router`: File-based routing system

## Future Enhancements
- Custom gesture animations
- Gesture-based navigation between tabs
- Advanced gesture interactions for specific screens
