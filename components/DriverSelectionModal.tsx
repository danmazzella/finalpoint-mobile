import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Driver } from '../src/types';
import Colors from '../constants/Colors';
import { spacing } from '../utils/styles';

interface DriverSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    position: number;
    drivers: Driver[];
    selectedDriverId?: number;
    onDriverSelect: (driver: Driver) => void;
    disabled?: boolean;
    submitting?: boolean;
    userPicks?: Map<number, number>; // position -> driverId mapping
}

const { height: screenHeight } = Dimensions.get('window');

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
    const handleDriverPress = (driver: Driver) => {
        if (disabled || submitting) return;
        onDriverSelect(driver);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Select Driver for P{position}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            disabled={submitting}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Drivers Grid */}
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

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Tap on a driver to select them for P{position}
                    </Text>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: Colors.light.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    driversContainer: {
        flex: 1,
    },
    driversContent: {
        padding: spacing.md,
        paddingBottom: 100, // Extra padding for footer
    },
    driversGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    driverCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        width: '48%', // Two columns with spacing
        borderWidth: 1,
        borderColor: '#e9ecef',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 120,
    },
    selectedDriverCard: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        borderWidth: 2,
    },
    disabledDriverCard: {
        opacity: 0.5,
    },
    alreadyPickedDriverCard: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
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
        color: '#666',
    },
    driverCountry: {
        fontSize: 10,
        color: '#999',
        textTransform: 'uppercase',
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    driverTeam: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#4caf50',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    selectedIndicatorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    alreadyPickedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#6b7280',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    alreadyPickedIndicatorText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: Colors.light.cardBackground,
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
        padding: spacing.md,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default DriverSelectionModal;
