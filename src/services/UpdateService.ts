import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { openAppStore, openPlayStore } from '../utils/storeUtils';
import { getApiBaseUrl } from './apiService';
import logger from '../../utils/logger';

export interface UpdateInfo {
    hasUpdate: boolean;
    latestVersion: string;
    currentVersion: string;
    updateUrl?: string;
    isRequired: boolean;
    releaseNotes?: string;
}

export interface UpdateCheckResult {
    success: boolean;
    updateInfo?: UpdateInfo;
    error?: string;
}

class UpdateService {
    private readonly API_BASE_URL = getApiBaseUrl();

    /**
     * Check for app updates by comparing current version with latest available version
     */
    async checkForUpdates(): Promise<UpdateCheckResult> {
        try {
            const currentVersion = this.getCurrentVersion();
            const platform = Platform.OS;

            logger.info(`Checking for updates - Current: ${currentVersion}, Platform: ${platform}`);

            const response = await fetch(`${this.API_BASE_URL}/app/check-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentVersion,
                    platform,
                    buildNumber: this.getBuildNumber(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const updateInfo: UpdateInfo = {
                hasUpdate: data.hasUpdate || false,
                latestVersion: data.latestVersion || currentVersion,
                currentVersion,
                updateUrl: data.updateUrl,
                isRequired: data.isRequired || false,
                releaseNotes: data.releaseNotes,
            };

            logger.info(`Update check result:`, updateInfo);

            return {
                success: true,
                updateInfo,
            };
        } catch (error) {
            logger.error('Error checking for updates:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Get the current app version
     */
    private getCurrentVersion(): string {
        // For testing in Expo Go, use a mock version
        if (__DEV__ && !Constants.expoConfig?.version) {
            return '1.0.0'; // Mock version for testing
        }
        return Constants.expoConfig?.version || '1.0.0';
    }

    /**
     * Get the current build number
     */
    private getBuildNumber(): string | number {
        // For testing in Expo Go, use mock build numbers
        if (__DEV__ && !Constants.expoConfig?.version) {
            if (Platform.OS === 'ios') {
                return '1'; // Mock iOS build number
            } else {
                return 1; // Mock Android version code
            }
        }

        if (Platform.OS === 'ios') {
            return Constants.expoConfig?.ios?.buildNumber || '1';
        } else {
            return Constants.expoConfig?.android?.versionCode || 1;
        }
    }

    /**
     * Open the appropriate app store for updates
     */
    async openAppStore(updateUrl?: string): Promise<void> {
        try {
            // If we have a specific update URL from the API, use that
            if (updateUrl) {
                const { Linking } = require('react-native');
                await Linking.openURL(updateUrl);
                return;
            }

            // Fallback to generic store functions
            if (Platform.OS === 'ios') {
                await openAppStore();
            } else {
                await openPlayStore();
            }
        } catch (error) {
            logger.error('Error opening app store:', error);
            throw error;
        }
    }

    /**
     * Check if the current version is older than the latest version
     */
    isVersionOlder(currentVersion: string, latestVersion: string): boolean {
        const current = this.parseVersion(currentVersion);
        const latest = this.parseVersion(latestVersion);

        for (let i = 0; i < Math.max(current.length, latest.length); i++) {
            const currentPart = current[i] || 0;
            const latestPart = latest[i] || 0;

            if (currentPart < latestPart) return true;
            if (currentPart > latestPart) return false;
        }

        return false;
    }

    /**
     * Parse version string into comparable array
     */
    private parseVersion(version: string): number[] {
        return version.split('.').map(part => {
            const num = parseInt(part, 10);
            return isNaN(num) ? 0 : num;
        });
    }
}

export default new UpdateService();
