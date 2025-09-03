# Feature Flags Implementation

This document describes the feature flag system implemented using Firebase Remote Config for the FinalPoint mobile app.

## Overview

The feature flag system allows you to control which users can access specific features without requiring app updates. This is particularly useful for:

- Gradual feature rollouts
- A/B testing
- Emergency feature disabling
- User-specific feature access

## Architecture

### Components

1. **FeatureFlagService** (`src/services/featureFlagService.ts`)
   - Singleton service that manages Firebase Remote Config
   - Handles fetching and caching of feature flag values
   - Provides methods to check feature availability

2. **FeatureFlagContext** (`src/context/FeatureFlagContext.tsx`)
   - React context that provides feature flag state to components
   - Automatically refreshes flags periodically
   - Provides hooks for easy access

3. **Firebase Configuration** (`config/firebase.ts`)
   - Initializes Firebase Remote Config
   - Sets up default values and cache settings

## Current Feature Flags

### Chat Feature (`chat_feature_enabled`)

Controls access to the league chat functionality.

**Default Value:** `false`

**User Whitelist:** `chat_feature_user_whitelist` (comma-separated user IDs or emails)

**Usage:**
```tsx
import { useChatFeature } from '../src/context/FeatureFlagContext';

function MyComponent() {
  const { isChatFeatureEnabled, isLoading } = useChatFeature();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isChatFeatureEnabled) {
    return <FeatureNotAvailable />;
  }
  
  return <ChatComponent />;
}
```

## Firebase Remote Config Setup

### 1. Configure Remote Config in Firebase Console

1. Go to Firebase Console → Remote Config
2. Add the following parameters:

```
chat_feature_enabled
- Type: Boolean
- Default Value: false
- Description: Controls access to league chat functionality

chat_feature_user_whitelist
- Type: String
- Default Value: (empty)
- Description: Comma-separated list of user IDs or emails who can access chat
```

### 2. Set Up Conditions (Optional)

You can create conditions to target specific user groups:

- **User ID in list**: Target specific users by their ID
- **App version**: Target specific app versions
- **Platform**: Target iOS or Android specifically

### 3. Publish Configuration

After setting up parameters and conditions, publish the configuration to make it live.

## Usage Examples

### Basic Feature Check

```tsx
import { useFeatureFlags } from '../src/context/FeatureFlagContext';

function MyComponent() {
  const { isChatFeatureEnabled } = useFeatureFlags();
  
  return (
    <View>
      {isChatFeatureEnabled && <ChatButton />}
    </View>
  );
}
```

### Conditional API Calls

```tsx
import { useChatFeature } from '../src/context/FeatureFlagContext';

function LeagueScreen() {
  const { isChatFeatureEnabled } = useChatFeature();
  
  useEffect(() => {
    const loadData = async () => {
      const promises = [loadLeagues()];
      
      if (isChatFeatureEnabled) {
        promises.push(loadChatData());
      }
      
      await Promise.all(promises);
    };
    
    loadData();
  }, [isChatFeatureEnabled]);
}
```

### Navigation Gating

```tsx
import { useChatFeature } from '../src/context/FeatureFlagContext';

function LeagueDetailScreen() {
  const { isChatFeatureEnabled } = useChatFeature();
  
  const handleChatPress = () => {
    if (!isChatFeatureEnabled) {
      Alert.alert('Feature Not Available', 'Chat is currently not available.');
      return;
    }
    
    router.push('/chat/123');
  };
}
```

## Testing Feature Flags

### Development Testing

1. **Enable for Development**: Set `chat_feature_enabled` to `true` in Firebase Console
2. **Test User Whitelist**: Add your user ID/email to `chat_feature_user_whitelist`
3. **Force Refresh**: The app will fetch fresh values in development mode

### Production Testing

1. **Gradual Rollout**: Start with a small user whitelist
2. **Monitor**: Check app analytics and user feedback
3. **Scale**: Gradually expand the whitelist or enable globally

## Best Practices

### 1. Default Values
Always set safe default values (usually `false` for new features) to ensure the app works even if Remote Config is unavailable.

### 2. Graceful Degradation
Design your UI to work well with features disabled. Don't leave empty spaces or broken layouts.

### 3. User Communication
Inform users when features are unavailable rather than hiding them completely.

### 4. Performance
- Feature flags are cached and refreshed periodically
- Avoid checking flags in tight loops
- Use the context hooks for reactive updates

### 5. Security
- Feature flags are client-side and can be bypassed
- Never use them for security-critical features
- Always validate permissions on the server side

## Troubleshooting

### Feature Flag Not Working

1. **Check Firebase Console**: Ensure the parameter is published
2. **Verify User ID**: Make sure the user ID in the whitelist matches exactly
3. **Clear Cache**: Force close and reopen the app
4. **Check Network**: Ensure the device has internet connectivity

### Debug Information

The app logs feature flag information to the console:

```
🎛️ Feature flags loaded: {
  chatEnabled: true,
  userId: "user123",
  allFlags: { ... }
}
```

### Force Refresh

In development, feature flags are fetched fresh on each app start. In production, they're cached for 1 hour.

## Adding New Feature Flags

1. **Add to Firebase Config**: Create new parameters in Firebase Console
2. **Update Default Values**: Add defaults in `config/firebase.ts`
3. **Create Service Methods**: Add methods to `FeatureFlagService`
4. **Update Context**: Add new flags to the context if needed
5. **Use in Components**: Implement the feature checks in your components

Example:

```typescript
// In FeatureFlagService
public isNewFeatureEnabled(userId?: string): boolean {
  return this.isFeatureEnabled('new_feature_enabled', false);
}

// In components
const { isNewFeatureEnabled } = useFeatureFlags();
```

## Monitoring and Analytics

Consider tracking feature flag usage in your analytics:

```typescript
// Track when features are accessed
if (isChatFeatureEnabled) {
  analytics.track('chat_feature_accessed', {
    userId: user.id,
    leagueId: league.id
  });
}
```

This helps you understand feature adoption and usage patterns.
