import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import UpdateService, { UpdateInfo } from '../services/UpdateService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../utils/logger';

interface UpdateContextType {
    updateInfo: UpdateInfo | null;
    isChecking: boolean;
    showUpdatePopup: boolean;
    checkForUpdates: () => Promise<void>;
    dismissUpdate: () => void;
    updateApp: () => Promise<void>;
    skipUpdate: () => void;
    forceUpdateCheck: () => Promise<void>; // For debugging
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

const STORAGE_KEYS = {
    SKIPPED_VERSION: 'skipped_version',
};

interface UpdateProviderProps {
    children: React.ReactNode;
}

export function UpdateProvider({ children }: UpdateProviderProps) {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showUpdatePopup, setShowUpdatePopup] = useState(false);
    const checkForUpdatesRef = useRef<() => Promise<void>>();

    // Debug: Log when UpdateProvider initializes
    useEffect(() => {
        logger.forceInfo('UpdateProvider initialized');
        console.log('UpdateProvider initialized'); // Force console log for debugging
        console.log('UpdateProvider state:', { updateInfo, isChecking, showUpdatePopup }); // Force console log
    }, []);

    // Removed throttling - we only check on app startup

    /**
     * Check if the current version was previously skipped
     */
    const wasVersionSkipped = useCallback(async (version: string): Promise<boolean> => {
        try {
            const skippedVersion = await AsyncStorage.getItem(STORAGE_KEYS.SKIPPED_VERSION);
            return skippedVersion === version;
        } catch (error) {
            logger.error('Error checking skipped version:', error);
            return false;
        }
    }, []);

    // Removed saveLastUpdateCheck - no longer needed

    /**
     * Save the skipped version
     */
    const saveSkippedVersion = useCallback(async (version: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SKIPPED_VERSION, version);
        } catch (error) {
            logger.error('Error saving skipped version:', error);
        }
    }, []);

    /**
     * Check for app updates
     */
    const checkForUpdates = useCallback(async (): Promise<void> => {
        console.log('checkForUpdates called, isChecking:', isChecking); // Force console log
        if (isChecking) {
            logger.forceDebug('Update check already in progress, skipping');
            console.log('Update check already in progress, skipping'); // Force console log
            return;
        }

        logger.forceInfo('Starting update check...');
        console.log('Starting update check...'); // Force console log
        setIsChecking(true);

        try {
            logger.info('Checking for app updates...');
            const result = await UpdateService.checkForUpdates();
            logger.info('Update check result:', result);

            if (result.success && result.updateInfo) {
                const { updateInfo: info } = result;
                logger.info('Update info received:', {
                    hasUpdate: info.hasUpdate,
                    currentVersion: info.currentVersion,
                    latestVersion: info.latestVersion,
                    isRequired: info.isRequired
                });

                // Only show popup if there's an update and it wasn't skipped
                if (info.hasUpdate) {
                    const wasSkipped = await wasVersionSkipped(info.latestVersion);
                    logger.info('Was version skipped:', wasSkipped);

                    if (!wasSkipped) {
                        logger.info('Showing update popup for version:', info.latestVersion);
                        setUpdateInfo(info);
                        setShowUpdatePopup(true);
                    } else {
                        logger.info(`Skipping update popup for version ${info.latestVersion} (previously skipped)`);
                    }
                } else {
                    logger.info('App is up to date');
                }
            } else {
                logger.error('Update check failed:', result.error);
            }
        } catch (error) {
            logger.error('Error during update check:', error);
        } finally {
            setIsChecking(false);
            logger.info('Update check completed');
        }
    }, [isChecking, wasVersionSkipped]);

    /**
     * Dismiss the update popup
     */
    const dismissUpdate = useCallback(() => {
        setShowUpdatePopup(false);
        setUpdateInfo(null);
    }, []);

    /**
     * Skip the current update
     */
    const skipUpdate = useCallback(async () => {
        if (updateInfo?.latestVersion) {
            await saveSkippedVersion(updateInfo.latestVersion);
        }
        dismissUpdate();
    }, [updateInfo, saveSkippedVersion, dismissUpdate]);

    /**
     * Update the app by opening the app store
     */
    const updateApp = useCallback(async (): Promise<void> => {
        try {
            await UpdateService.openAppStore(updateInfo?.updateUrl);
            dismissUpdate();
        } catch (error) {
            logger.error('Error opening app store:', error);
            // Don't dismiss the popup if there was an error opening the store
        }
    }, [dismissUpdate, updateInfo?.updateUrl]);

    /**
     * Force an update check (for debugging)
     */
    const forceUpdateCheck = useCallback(async (): Promise<void> => {
        logger.forceInfo('Force update check triggered');
        console.log('Force update check triggered'); // Force console log
        await checkForUpdates();
    }, [checkForUpdates]);

    /**
     * Update the ref whenever checkForUpdates changes
     */
    useEffect(() => {
        checkForUpdatesRef.current = checkForUpdates;
    }, [checkForUpdates]);

    /**
     * Check for updates on app startup only
     */
    useEffect(() => {
        logger.forceInfo('App started - checking for updates');
        console.log('App started - checking for updates'); // Force console log

        // Check for updates on initial load only
        checkForUpdatesRef.current?.();
    }, []); // Empty dependency array - this effect should only run once

    const value: UpdateContextType = {
        updateInfo,
        isChecking,
        showUpdatePopup,
        checkForUpdates,
        dismissUpdate,
        updateApp,
        skipUpdate,
        forceUpdateCheck,
    };

    return (
        <UpdateContext.Provider value={value}>
            {children}
        </UpdateContext.Provider>
    );
}

export function useUpdate() {
    const context = useContext(UpdateContext);
    if (context === undefined) {
        throw new Error('useUpdate must be used within an UpdateProvider');
    }
    return context;
}
