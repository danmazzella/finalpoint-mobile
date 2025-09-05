import { Platform, Linking } from 'react-native';
import * as Application from 'expo-application';
import logger from '../../utils/logger';

/**
 * Open the iOS App Store for the app
 */
export async function openAppStore(): Promise<void> {
    if (Platform.OS !== 'ios') {
        throw new Error('openAppStore can only be called on iOS');
    }

    const bundleId = Application.applicationId;

    // For testing in Expo Go, use a generic search
    if (__DEV__ && bundleId?.includes('host.exp.exponent')) {
        logger.info('Test mode: Opening App Store search for FinalPoint');
        const searchUrl = `https://apps.apple.com/search?term=FinalPoint`;
        await Linking.openURL(searchUrl);
        return;
    }

    const appStoreUrl = `https://apps.apple.com/app/id${bundleId}`;

    try {
        const supported = await Linking.canOpenURL(appStoreUrl);
        if (supported) {
            await Linking.openURL(appStoreUrl);
        } else {
            // Fallback to generic App Store search
            const searchUrl = `https://apps.apple.com/search?term=FinalPoint`;
            await Linking.openURL(searchUrl);
        }
    } catch (error) {
        logger.error('Error opening App Store:', error);
        throw error;
    }
}

/**
 * Open the Google Play Store for the app
 */
export async function openPlayStore(): Promise<void> {
    if (Platform.OS !== 'android') {
        throw new Error('openPlayStore can only be called on Android');
    }

    const packageName = Application.applicationId;

    // For testing in Expo Go, use a generic search
    if (__DEV__ && packageName?.includes('host.exp.exponent')) {
        logger.info('Test mode: Opening Play Store search for FinalPoint');
        const searchUrl = `https://play.google.com/store/search?q=FinalPoint`;
        await Linking.openURL(searchUrl);
        return;
    }

    // Try to open the Play Store app first
    const playStoreUrl = `market://details?id=${packageName}`;
    const playStoreWebUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

    try {
        const canOpenPlayStore = await Linking.canOpenURL(playStoreUrl);
        if (canOpenPlayStore) {
            await Linking.openURL(playStoreUrl);
        } else {
            // Fallback to web browser
            await Linking.openURL(playStoreWebUrl);
        }
    } catch (error) {
        logger.error('Error opening Play Store:', error);
        // Final fallback to web browser
        try {
            await Linking.openURL(playStoreWebUrl);
        } catch (webError) {
            logger.error('Error opening Play Store in browser:', webError);
            throw webError;
        }
    }
}
