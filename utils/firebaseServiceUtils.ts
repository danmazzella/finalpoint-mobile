import {
    auth,
    db,
    storage,
    analytics,
    remoteConfig,
    performance,
    remoteConfigUtils,
    performanceUtils
} from '../config/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    DocumentData,
    QueryConstraint
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll
} from 'firebase/storage';
import {
    logEvent,
    setUserProperties,
    setUserId
} from 'firebase/analytics';

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

export const authUtils = {
    // Sign in with email and password
    signIn: async (email: string, password: string): Promise<UserCredential> => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ User signed in successfully');
            return result;
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw error;
        }
    },

    // Create new user account
    signUp: async (email: string, password: string): Promise<UserCredential> => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            console.log('✅ User account created successfully');
            return result;
        } catch (error) {
            console.error('❌ Sign up failed:', error);
            throw error;
        }
    },

    // Sign out current user
    signOut: async (): Promise<void> => {
        try {
            await signOut(auth);
            console.log('✅ User signed out successfully');
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: (): User | null => {
        return auth.currentUser;
    },

    // Listen to auth state changes
    onAuthStateChange: (callback: (user: User | null) => void) => {
        return onAuthStateChanged(auth, callback);
    },

    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        return !!auth.currentUser;
    }
};

// ============================================================================
// FIRESTORE UTILITIES
// ============================================================================

export const firestoreUtils = {
    // Create or update a document
    setDocument: async <T extends DocumentData>(
        collectionPath: string,
        docId: string,
        data: T
    ): Promise<void> => {
        try {
            const docRef = doc(db, collectionPath, docId);
            await setDoc(docRef, data, { merge: true });
            console.log(`✅ Document ${docId} set successfully in ${collectionPath}`);
        } catch (error) {
            console.error(`❌ Failed to set document ${docId}:`, error);
            throw error;
        }
    },

    // Get a document
    getDocument: async <T>(
        collectionPath: string,
        docId: string
    ): Promise<T | null> => {
        try {
            const docRef = doc(db, collectionPath, docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as T;
            } else {
                console.log(`ℹ️ Document ${docId} not found in ${collectionPath}`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Failed to get document ${docId}:`, error);
            throw error;
        }
    },

    // Update a document
    updateDocument: async <T extends DocumentData>(
        collectionPath: string,
        docId: string,
        data: Partial<T>
    ): Promise<void> => {
        try {
            const docRef = doc(db, collectionPath, docId);
            await updateDoc(docRef, data);
            console.log(`✅ Document ${docId} updated successfully in ${collectionPath}`);
        } catch (error) {
            console.error(`❌ Failed to update document ${docId}:`, error);
            throw error;
        }
    },

    // Delete a document
    deleteDocument: async (
        collectionPath: string,
        docId: string
    ): Promise<void> => {
        try {
            const docRef = doc(db, collectionPath, docId);
            await deleteDoc(docRef);
            console.log(`✅ Document ${docId} deleted successfully from ${collectionPath}`);
        } catch (error) {
            console.error(`❌ Failed to delete document ${docId}:`, error);
            throw error;
        }
    },

    // Query documents
    queryDocuments: async <T>(
        collectionPath: string,
        constraints: QueryConstraint[] = []
    ): Promise<T[]> => {
        try {
            const q = query(collection(db, collectionPath), ...constraints);
            const querySnapshot = await getDocs(q);

            const documents: T[] = [];
            querySnapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() } as T);
            });

            console.log(`✅ Query returned ${documents.length} documents from ${collectionPath}`);
            return documents;
        } catch (error) {
            console.error(`❌ Query failed for collection ${collectionPath}:`, error);
            throw error;
        }
    },

    // Get documents with common query patterns
    getDocumentsByField: async <T>(
        collectionPath: string,
        field: string,
        value: any
    ): Promise<T[]> => {
        return firestoreUtils.queryDocuments<T>(collectionPath, [where(field, '==', value)]);
    },

    getDocumentsOrdered: async <T>(
        collectionPath: string,
        orderByField: string,
        orderDirection: 'asc' | 'desc' = 'desc',
        limitCount?: number
    ): Promise<T[]> => {
        const constraints: QueryConstraint[] = [orderBy(orderByField, orderDirection)];
        if (limitCount) {
            constraints.push(limit(limitCount));
        }
        return firestoreUtils.queryDocuments<T>(collectionPath, constraints);
    }
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export const storageUtils = {
    // Upload a file
    uploadFile: async (
        path: string,
        file: File | Blob,
        metadata?: any
    ): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file, metadata);
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log(`✅ File uploaded successfully to ${path}`);
            return downloadURL;
        } catch (error) {
            console.error(`❌ File upload failed for ${path}:`, error);
            throw error;
        }
    },

    // Get download URL for a file
    getDownloadURL: async (path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const url = await getDownloadURL(storageRef);
            console.log(`✅ Download URL obtained for ${path}`);
            return url;
        } catch (error) {
            console.error(`❌ Failed to get download URL for ${path}:`, error);
            throw error;
        }
    },

    // Delete a file
    deleteFile: async (path: string): Promise<void> => {
        try {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
            console.log(`✅ File deleted successfully from ${path}`);
        } catch (error) {
            console.error(`❌ Failed to delete file ${path}:`, error);
            throw error;
        }
    },

    // List all files in a directory
    listFiles: async (path: string): Promise<string[]> => {
        try {
            const storageRef = ref(storage, path);
            const result = await listAll(storageRef);
            const filePaths = result.items.map(item => item.fullPath);
            console.log(`✅ Listed ${filePaths.length} files in ${path}`);
            return filePaths;
        } catch (error) {
            console.error(`❌ Failed to list files in ${path}:`, error);
            throw error;
        }
    }
};

// ============================================================================
// ANALYTICS UTILITIES
// ============================================================================

export const analyticsUtils = {
    // Log a custom event
    logEvent: (eventName: string, parameters?: Record<string, any>): void => {
        if (!analytics) {
            console.warn('⚠️ Analytics not available');
            return;
        }

        try {
            logEvent(analytics, eventName, parameters);
            console.log(`✅ Analytics event logged: ${eventName}`);
        } catch (error) {
            console.warn('⚠️ Analytics event logging failed:', error);
        }
    },

    // Set user properties
    setUserProperties: (properties: Record<string, any>): void => {
        if (!analytics) {
            console.warn('⚠️ Analytics not available');
            return;
        }

        try {
            setUserProperties(analytics, properties);
            console.log('✅ User properties set successfully');
        } catch (error) {
            console.warn('⚠️ Failed to set user properties:', error);
        }
    },

    // Set user ID
    setUserId: (userId: string): void => {
        if (!analytics) {
            console.warn('⚠️ Analytics not available');
            return;
        }

        try {
            setUserId(analytics, userId);
            console.log('✅ User ID set successfully');
        } catch (error) {
            console.warn('⚠️ Failed to set user ID:', error);
        }
    },

    // Common analytics events
    screenView: (screenName: string, screenClass?: string): void => {
        analyticsUtils.logEvent('screen_view', {
            screen_name: screenName,
            screen_class: screenClass || screenName
        });
    },

    login: (method: string): void => {
        analyticsUtils.logEvent('login', { method });
    },

    signUp: (method: string): void => {
        analyticsUtils.logEvent('sign_up', { method });
    },

    buttonPress: (buttonName: string, screen?: string): void => {
        analyticsUtils.logEvent('button_press', {
            button_name: buttonName,
            screen: screen || 'unknown'
        });
    },

    search: (searchTerm: string): void => {
        analyticsUtils.logEvent('search', {
            search_term: searchTerm
        });
    }
};

// ============================================================================
// REMOTE CONFIG UTILITIES
// ============================================================================

export const remoteConfigUtilsEnhanced = {
    ...remoteConfigUtils,

    // Get all feature flags
    getAllFeatureFlags: () => {
        return {
            enableNewUI: remoteConfigUtils.getFeatureFlag('enable_new_ui', false),
            enableBetaFeatures: remoteConfigUtils.getFeatureFlag('enable_beta_features', false),
            maintenanceMode: remoteConfigUtils.getFeatureFlag('maintenance_mode', false)
        };
    },

    // Get all app settings
    getAllAppSettings: () => {
        return {
            maxLeagueMembers: parseInt(remoteConfigUtils.getAppSetting('max_league_members', '50')),
            raceReminderDays: JSON.parse(remoteConfigUtils.getAppSetting('race_reminder_days', '[5,3,1]')),
            scoreUpdateDelay: parseInt(remoteConfigUtils.getAppSetting('score_update_delay', '300'))
        };
    },

    // Check if app is in maintenance mode
    isMaintenanceMode: (): boolean => {
        return remoteConfigUtils.getFeatureFlag('maintenance_mode', false);
    },

    // Check if new UI is enabled
    isNewUIEnabled: (): boolean => {
        return remoteConfigUtils.getFeatureFlag('enable_new_ui', false);
    }
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

export const performanceUtilsEnhanced = {
    ...performanceUtils,

    // Measure function execution time
    measureFunction: async <T>(
        functionName: string,
        fn: () => Promise<T> | T
    ): Promise<T> => {
        const trace = performanceUtils.startTrace(`function_${functionName}`);
        if (!trace) {
            return await fn();
        }

        try {
            trace.start();
            const result = await fn();
            return result;
        } finally {
            trace.stop();
        }
    },

    // Measure API call performance
    measureApiCall: async <T>(
        endpoint: string,
        apiCall: () => Promise<T>
    ): Promise<T> => {
        const trace = performanceUtils.startTrace(`api_call_${endpoint}`);
        if (!trace) {
            return await apiCall();
        }

        try {
            trace.putAttribute('endpoint', endpoint);
            trace.start();
            const result = await apiCall();
            trace.putAttribute('status', 'success');
            return result;
        } catch (error) {
            trace.putAttribute('status', 'error');
            trace.putAttribute('error_message', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        } finally {
            trace.stop();
        }
    }
};

// ============================================================================
// COMPOSITE UTILITIES
// ============================================================================

export const firebaseServiceUtils = {
    auth: authUtils,
    firestore: firestoreUtils,
    storage: storageUtils,
    analytics: analyticsUtils,
    remoteConfig: remoteConfigUtilsEnhanced,
    performance: performanceUtilsEnhanced,

    // Initialize all services
    initialize: async () => {
        try {
            // Fetch remote config
            await remoteConfigUtils.fetchAndActivate();

            // Set up analytics user ID if authenticated
            const currentUser = authUtils.getCurrentUser();
            if (currentUser) {
                analyticsUtils.setUserId(currentUser.uid);
            }

            console.log('✅ All Firebase services initialized successfully');
        } catch (error) {
            console.warn('⚠️ Firebase services initialization had issues:', error);
        }
    },

    // Cleanup resources
    cleanup: () => {
        // Add any cleanup logic here if needed
        console.log('ℹ️ Firebase services cleanup completed');
    }
};

export default firebaseServiceUtils;
