import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Driver } from '../src/types';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import GlassBackground from '../src/components/GlassBackground';
import { shadows } from '../utils/styles';

interface DriverSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    position: number;
    drivers: Driver[];
    selectedDriverId?: number;
    onDriverSelect: (driver: Driver) => void;
    disabled?: boolean;
    submitting?: boolean;
    userPicks?: Map<number, number>;
}

export const DriverSelectionModal: React.FC<DriverSelectionModalProps> = ({
    visible,
    onClose,
    position,
    drivers,
    selectedDriverId,
    onDriverSelect,
    disabled = false,
    submitting = false,
    userPicks,
}) => {
    const { resolvedTheme } = useTheme();
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    const handleDriverPress = (driver: Driver) => {
        if (disabled || submitting) return;
        onDriverSelect(driver);
        onClose();
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'transparent',
        },
        header: {
            backgroundColor: currentColors.glassBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.glassBorder,
            paddingHorizontal: 16,
            paddingVertical: 16,
        },
        headerContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            flex: 1,
        },
        closeButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: currentColors.inputBackground,
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            justifyContent: 'center',
            alignItems: 'center',
        },
        driversContainer: {
            flex: 1,
        },
        driversContent: {
            padding: 16,
            paddingBottom: 100,
        },
        driversGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
        },
        driverCard: {
            backgroundColor: currentColors.glassBackground,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            width: '48%',
            borderWidth: 1,
            borderColor: currentColors.glassBorder,
            minHeight: 120,
            ...shadows.glass,
        },
        selectedDriverCard: {
            backgroundColor: currentColors.primary + '20',
            borderColor: currentColors.primary,
            borderWidth: 2,
            shadowColor: currentColors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
        },
        disabledDriverCard: {
            opacity: 0.5,
        },
        alreadyPickedDriverCard: {
            backgroundColor: currentColors.inputBackground,
            borderColor: currentColors.glassBorder,
            opacity: 0.7,
        },
        driverHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        driverNumber: {
            fontSize: 14,
            fontWeight: 'bold',
            color: currentColors.textSecondary,
        },
        driverCountry: {
            fontSize: 10,
            color: currentColors.textTertiary,
            textTransform: 'uppercase',
        },
        driverName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentColors.textPrimary,
            marginBottom: 4,
            textAlign: 'center',
        },
        driverTeam: {
            fontSize: 12,
            color: currentColors.textSecondary,
            textAlign: 'center',
            marginBottom: 8,
        },
        selectedIndicator: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: currentColors.success,
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: currentColors.textInverse,
        },
        selectedIndicatorText: {
            color: currentColors.textInverse,
            fontSize: 12,
            fontWeight: 'bold',
        },
        alreadyPickedIndicator: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: currentColors.secondary,
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        alreadyPickedIndicatorText: {
            color: currentColors.textInverse,
            fontSize: 10,
            fontWeight: 'bold',
        },
        footer: {
            backgroundColor: currentColors.glassBackground,
            borderTopWidth: 1,
            borderTopColor: currentColors.glassBorder,
            padding: 16,
            alignItems: 'center',
        },
        footerText: {
            fontSize: 14,
            color: currentColors.textSecondary,
            textAlign: 'center',
        },
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <GlassBackground>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.headerTitle}>Select Driver for P{position}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                                disabled={submitting}
                            >
                                <Ionicons name="close" size={18} color={currentColors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.driversContainer}
                        contentContainerStyle={styles.driversContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.driversGrid}>
                            {drivers.map((driver) => {
                                const isSelected = selectedDriverId === driver.id;
                                const isAlreadyPicked = userPicks ? Array.from(userPicks.entries()).some(([pos, driverId]) =>
                                    pos !== position && driverId === driver.id
                                ) : false;
                                const isDisabled = disabled || submitting || isAlreadyPicked;

                                return (
                                    <TouchableOpacity
                                        key={driver.id}
                                        style={[
                                            styles.driverCard,
                                            isSelected && styles.selectedDriverCard,
                                            isDisabled && styles.disabledDriverCard,
                                            isAlreadyPicked && styles.alreadyPickedDriverCard,
                                        ]}
                                        onPress={() => handleDriverPress(driver)}
                                        disabled={isDisabled}
                                        activeOpacity={isDisabled ? 1 : 0.7}
                                    >
                                        <View style={styles.driverHeader}>
                                            <Text style={styles.driverNumber}>#{driver.driverNumber}</Text>
                                            <Text style={styles.driverCountry}>{driver.country}</Text>
                                        </View>

                                        <Text style={styles.driverName} numberOfLines={2}>
                                            {driver.name}
                                        </Text>

                                        <Text style={styles.driverTeam} numberOfLines={1}>
                                            {driver.team}
                                        </Text>

                                        {isSelected && (
                                            <View style={styles.selectedIndicator}>
                                                <Text style={styles.selectedIndicatorText}>✓</Text>
                                            </View>
                                        )}

                                        {isAlreadyPicked && !isSelected && (
                                            <View style={styles.alreadyPickedIndicator}>
                                                <Text style={styles.alreadyPickedIndicatorText}>Already Picked</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Tap a driver to select them for P{position}
                        </Text>
                    </View>
                </SafeAreaView>
            </GlassBackground>
        </Modal>
    );
};

export default DriverSelectionModal;
