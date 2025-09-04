// Console logging middleware for FinalPoint Mobile App
// Provides controlled console logging based on environment variables

import { isDevelopment } from '../config/environment';

interface LoggerConfig {
    enabled: boolean;
    forceEnabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
}

class Logger {
    private config: LoggerConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    private loadConfig(): LoggerConfig {
        // Check for force enable flag (overrides all other settings)
        const forceEnabled = process.env.EXPO_PUBLIC_FORCE_CONSOLE_LOGGING === 'true';

        // Check for explicit enable/disable
        const explicitEnabled = process.env.EXPO_PUBLIC_ENABLE_CONSOLE_LOGGING;

        // Default behavior: enabled in development, disabled in production
        const defaultEnabled = isDevelopment();

        // Determine if logging should be enabled
        const enabled = forceEnabled || (explicitEnabled ? explicitEnabled === 'true' : defaultEnabled);

        // Get log level
        const level = (process.env.EXPO_PUBLIC_LOG_LEVEL as LoggerConfig['level']) || 'info';

        return {
            enabled,
            forceEnabled,
            level
        };
    }

    private shouldLog(level: string): boolean {
        if (this.config.forceEnabled) return true;
        if (!this.config.enabled) return false;

        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const requestedLevelIndex = levels.indexOf(level);

        return requestedLevelIndex >= currentLevelIndex;
    }

    private formatMessage(level: string, ...args: any[]): any[] {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        return [prefix, ...args];
    }

    debug(...args: any[]): void {
        if (this.shouldLog('debug')) {
            console.debug(...this.formatMessage('debug', ...args));
        }
    }

    info(...args: any[]): void {
        if (this.shouldLog('info')) {
            console.info(...this.formatMessage('info', ...args));
        }
    }

    warn(...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(...this.formatMessage('warn', ...args));
        }
    }

    error(...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error(...this.formatMessage('error', ...args));
        }
    }

    log(...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log(...this.formatMessage('info', ...args));
        }
    }

    // Force logging methods - these will always log regardless of configuration
    forceDebug(...args: any[]): void {
        console.debug(...this.formatMessage('debug', ...args));
    }

    forceInfo(...args: any[]): void {
        console.info(...this.formatMessage('info', ...args));
    }

    forceWarn(...args: any[]): void {
        console.warn(...this.formatMessage('warn', ...args));
    }

    forceError(...args: any[]): void {
        console.error(...this.formatMessage('error', ...args));
    }

    forceLog(...args: any[]): void {
        console.log(...this.formatMessage('info', ...args));
    }

    // Method to check if logging is enabled (useful for conditional logic)
    isEnabled(): boolean {
        return this.config.enabled || this.config.forceEnabled;
    }

    // Method to get current configuration (useful for debugging)
    getConfig(): LoggerConfig {
        return { ...this.config };
    }

    // Method to update configuration at runtime (useful for debugging)
    updateConfig(newConfig: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// Create singleton instance
const logger = new Logger();

// Export the logger instance and the class for advanced usage
export default logger;
export { Logger };

// Export convenience methods
export const {
    debug, info, warn, error, log,
    forceDebug, forceInfo, forceWarn, forceError, forceLog,
    isEnabled, getConfig, updateConfig
} = logger;
