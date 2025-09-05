import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { UpdateInfo } from '../src/services/UpdateService';

interface UpdatePopupProps {
    visible: boolean;
    updateInfo: UpdateInfo | null;
    onUpdate: () => void;
    onDismiss: () => void;
    onSkip?: () => void;
    isLoading?: boolean;
}

export default function UpdatePopup({
    visible,
    updateInfo,
    onUpdate,
    onDismiss,
    onSkip,
    isLoading = false,
}: UpdatePopupProps) {
    const { resolvedTheme } = useTheme();
    const colors = resolvedTheme === 'dark' ? darkColors : lightColors;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible, scaleAnim]);

    if (!visible || !updateInfo) {
        return null;
    }

    const isRequired = updateInfo.isRequired;
    const canDismiss = !isRequired && onSkip;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={[styles.overlay, { backgroundColor: resolvedTheme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
                <BlurView
                    intensity={20}
                    tint={resolvedTheme === 'dark' ? 'dark' : 'light'}
                    style={styles.blurContainer}
                >
                    <Animated.View
                        style={[
                            styles.container,
                            {
                                backgroundColor: colors.backgroundSecondary,
                                transform: [{ scale: scaleAnim }]
                            }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                                <Ionicons
                                    name="cloud-download-outline"
                                    size={24}
                                    color={colors.textInverse}
                                />
                            </View>
                            <Text style={[styles.title, { color: colors.textPrimary }]}>
                                {isRequired ? 'Update Required' : 'Update Available'}
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                A new version of FinalPoint is available
                            </Text>
                        </View>

                        {/* Version Info */}
                        <View style={[styles.versionContainer, { backgroundColor: colors.backgroundPrimary }]}>
                            <View style={styles.versionRow}>
                                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                                    Current Version:
                                </Text>
                                <Text style={[styles.versionValue, { color: colors.textPrimary }]}>
                                    {updateInfo.currentVersion}
                                </Text>
                            </View>
                            <View style={styles.versionRow}>
                                <Text style={[styles.versionLabel, { color: colors.textSecondary }]}>
                                    Latest Version:
                                </Text>
                                <Text style={[styles.versionValue, { color: colors.primary }]}>
                                    {updateInfo.latestVersion}
                                </Text>
                            </View>
                        </View>

                        {/* Release Notes */}
                        {updateInfo.releaseNotes && (
                            <View style={[styles.releaseNotesContainer, { backgroundColor: colors.backgroundPrimary }]}>
                                <Text style={[styles.releaseNotesTitle, { color: colors.textPrimary }]}>
                                    What's New
                                </Text>
                                <ScrollView
                                    style={styles.releaseNotesScroll}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={[styles.releaseNotesText, { color: colors.textSecondary }]}>
                                        {updateInfo.releaseNotes}
                                    </Text>
                                </ScrollView>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            {canDismiss && (
                                <TouchableOpacity
                                    style={[styles.button, styles.skipButton, { borderColor: colors.borderLight }]}
                                    onPress={onSkip}
                                    disabled={isLoading}
                                >
                                    <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                                        Skip
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.updateButton,
                                    { backgroundColor: colors.primary },
                                    isLoading && styles.buttonDisabled
                                ]}
                                onPress={onUpdate}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={colors.textPrimary} size="small" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="cloud-download"
                                            size={16}
                                            color={colors.textInverse}
                                            style={styles.buttonIcon}
                                        />
                                        <Text style={[styles.buttonText, { color: colors.textInverse }]}>
                                            Update Now
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Required Update Notice */}
                        {isRequired && (
                            <Text style={[styles.requiredNotice, { color: colors.textSecondary }]}>
                                This update is required to continue using the app
                            </Text>
                        )}
                    </Animated.View>
                </BlurView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    versionContainer: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    versionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    versionLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    versionValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    releaseNotesContainer: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        maxHeight: 120,
    },
    releaseNotesTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    releaseNotesScroll: {
        maxHeight: 80,
    },
    releaseNotesText: {
        fontSize: 13,
        lineHeight: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    skipButton: {
        borderWidth: 1,
    },
    updateButton: {
        flex: 2,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 6,
    },
    requiredNotice: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
