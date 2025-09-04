# Console Logging Configuration

This document describes the console logging middleware system for the FinalPoint Mobile App.

## Overview

The console logging middleware provides controlled console output based on environment variables, allowing you to:
- Enable/disable console logging in different environments
- Set different log levels
- Force console logging in production for debugging
- Maintain clean production builds by default

## Environment Variables

### `EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING`
- **Type**: `boolean` (string: "true" or "false")
- **Default**: `true` in development, `false` in production
- **Description**: Explicitly enable or disable console logging

### `EXPO_PUBLIC_FORCE_CONSOLE_LOGGING`
- **Type**: `boolean` (string: "true" or "false")
- **Default**: `false`
- **Description**: Force console logging even in production (overrides all other settings)

### `EXPO_PUBLIC_LOG_LEVEL`
- **Type**: `string`
- **Options**: `debug`, `info`, `warn`, `error`
- **Default**: `info`
- **Description**: Set the minimum log level to display

## Usage

### Basic Usage
```typescript
import logger from '../utils/logger';

// These will respect the environment configuration
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.log('General log message');
```

### Force Logging (Always Shows)
```typescript
import logger from '../utils/logger';

// These will ALWAYS show regardless of environment settings
logger.forceDebug('This debug message will ALWAYS show');
logger.forceInfo('This info message will ALWAYS show');
logger.forceWarn('This warning will ALWAYS show');
logger.forceError('This error will ALWAYS show');
logger.forceLog('This general message will ALWAYS show');
```

### Conditional Logging
```typescript
import logger from '../utils/logger';

if (logger.isEnabled()) {
  // Only execute expensive logging operations if logging is enabled
  const data = expensiveDataCollection();
  logger.debug('Collected data:', data);
}
```

### Runtime Configuration
```typescript
import logger from '../utils/logger';

// Check current configuration
const config = logger.getConfig();
console.log('Current config:', config);

// Update configuration at runtime (useful for debugging)
logger.updateConfig({ level: 'debug' });
```

## Environment Examples

### Development
```bash
EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### Production
```bash
EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING=false
EXPO_PUBLIC_LOG_LEVEL=error
```

### Production Debugging
```bash
EXPO_PUBLIC_FORCE_CONSOLE_LOGGING=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

## Integration with Build Scripts

The mobile app uses build scripts that can set environment variables. You can add these variables to your build configurations:

### In build-env.sh
```bash
# Add to your build script
export EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING=false
export EXPO_PUBLIC_LOG_LEVEL=error
```

### In eas.json
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING": "false",
        "EXPO_PUBLIC_LOG_LEVEL": "error"
      }
    },
    "development": {
      "env": {
        "EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING": "true",
        "EXPO_PUBLIC_LOG_LEVEL": "debug"
      }
    }
  }
}
```

## Migration from console.log

Replace direct console calls with the logger:

```typescript
// Before
console.log('User logged in:', user);
console.error('API error:', error);

// After
import logger from '../utils/logger';
logger.info('User logged in:', user);
logger.error('API error:', error);
```

## When to Use Force Logging

Use force logging methods for critical messages that should always be visible:

```typescript
// Critical errors that should always show
logger.forceError('CRITICAL ERROR - Database connection failed:', error);

// Important warnings that should always show
logger.forceWarn('CRITICAL WARNING - Security event detected:', event);

// Important info that should always show (like app startup)
logger.forceInfo('🚀 App started successfully');

// Security-related logs that should always be visible
logger.forceWarn('🔒 SECURITY EVENT - Unauthorized access attempt:', details);
```

**Use force logging sparingly** - only for truly critical messages that you need to see even in production.

## Benefits

1. **Clean Production Builds**: Console logs are disabled by default in production
2. **Flexible Debugging**: Can enable logging in production when needed
3. **Log Level Control**: Filter logs by importance level
4. **Performance**: Avoids expensive string operations when logging is disabled
5. **Consistent Formatting**: All logs include timestamps and level indicators
6. **Build Integration**: Works seamlessly with EAS build system
