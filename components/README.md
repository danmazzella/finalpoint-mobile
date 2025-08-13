# Status Bar Components

This directory contains components for handling status bar display and edge-to-edge Android displays.

## Components

### StatusBarBackground
A component that adds a colored background under the status bar area for Android edge-to-edge displays.

**Props:**
- `color?: string` - Custom background color (defaults to FinalPoint blue)
- `height?: number` - Custom height (defaults to calculated status bar height)

**Usage:**
```tsx
import StatusBarBackground from '../components/StatusBarBackground';

// Basic usage - uses FinalPoint blue
<StatusBarBackground />

// Custom color
<StatusBarBackground color="#ff0000" />

// Custom height
<StatusBarBackground height={32} />
```

### StatusBarWrapper
A wrapper component that handles status bar configuration and provides the StatusBarBackground when needed.

**Props:**
- `children: React.ReactNode` - Content to wrap
- `style?: 'light' | 'dark' | 'auto'` - Status bar text style (default: 'light')
- `backgroundColor?: string` - Custom background color
- `showBackground?: boolean` - Whether to show the status bar background (default: true)

**Usage:**
```tsx
import StatusBarWrapper from '../components/StatusBarWrapper';

// Basic usage
<StatusBarWrapper>
  <YourScreenContent />
</StatusBarWrapper>

// Custom configuration
<StatusBarWrapper 
  style="dark" 
  backgroundColor="#000000"
  showBackground={false}
>
  <YourScreenContent />
</StatusBarWrapper>
```

## Hooks

### useStatusBar
A custom hook that provides status bar information and edge-to-edge detection.

**Returns:**
- `statusBarHeight: number` - The height of the status bar
- `isEdgeToEdge: boolean` - Whether the app is in edge-to-edge mode
- `topInset: number` - The top safe area inset

**Usage:**
```tsx
import { useStatusBar } from '../hooks/useStatusBar';

const MyComponent = () => {
  const { statusBarHeight, isEdgeToEdge, topInset } = useStatusBar();
  
  // Use the values as needed
  return (
    <View style={{ paddingTop: isEdgeToEdge ? statusBarHeight : topInset }}>
      {/* Your content */}
    </View>
  );
};
```

## Edge-to-Edge Support

The app is configured with `"edgeToEdgeEnabled": true` in `app.json`, which means:

1. **Android**: The app extends under the status bar and navigation bar
2. **Status Bar**: White text on transparent background by default
3. **Background**: FinalPoint blue background is automatically added under the status bar
4. **Safe Areas**: Use `SafeAreaView` or `useSafeAreaInsets()` for proper content positioning

## Best Practices

1. **Use StatusBarWrapper** for screens that need custom status bar handling
2. **Use SafeAreaView** for content that should respect safe areas
3. **Check isEdgeToEdge** when calculating custom padding or positioning
4. **Test on different Android versions** as edge-to-edge behavior may vary

## Example Implementation

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatusBarWrapper from '../components/StatusBarWrapper';

const MyScreen = () => {
  return (
    <StatusBarWrapper style="light">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <Text>Your screen content</Text>
        </View>
      </SafeAreaView>
    </StatusBarWrapper>
  );
};

export default MyScreen;
```
