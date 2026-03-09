import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    FlatList,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { communityPicksAPI, seasonsAPI } from '../src/services/apiService';
import { lightColors, darkColors } from '../src/constants/Colors';

interface CommunityWeek {
    weekNumber: number;
    raceName: string;
    raceDate: string | null;
    isScored: boolean;
    hasSprint: boolean;
}

interface DriverPickStat {
    driverId: number;
    driverName: string;
    driverTeam: string;
    pickCount: number;
    percentage: number;
    isCorrect: boolean;
}

interface PositionStat {
    position: number;
    totalPicks: number;
    isScored: boolean;
    actualResult: { driverId: number; driverName: string; driverTeam: string } | null;
    drivers: DriverPickStat[];
}

interface CommunityStats {
    weekNumber: number;
    raceName: string;
    eventType: 'race' | 'sprint';
    isScored: boolean;
    positions: PositionStat[];
}

interface DropdownOption {
    label: string;
    value: number;
}

interface DropdownProps {
    label: string;
    value: number | null;
    options: DropdownOption[];
    onSelect: (value: number) => void;
    loading?: boolean;
    placeholder?: string;
    colors: typeof lightColors;
}

const Dropdown = ({ label, value, options, onSelect, loading, placeholder, colors }: DropdownProps) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);

    return (
        <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 }}>
                {label}
            </Text>
            <TouchableOpacity
                onPress={() => !loading && setOpen(true)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: colors.backgroundSecondary,
                }}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <>
                        <Text style={{ fontSize: 14, color: selected ? colors.textPrimary : colors.textTertiary, flex: 1 }} numberOfLines={1}>
                            {selected?.label ?? placeholder ?? 'Select…'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                    </>
                )}
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setOpen(false)}>
                    <View style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: colors.cardBackground,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        maxHeight: '60%',
                        paddingBottom: 32,
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.borderLight,
                        }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{label}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <Ionicons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={item => String(item.value)}
                            renderItem={({ item }) => {
                                const isSelected = item.value === value;
                                return (
                                    <TouchableOpacity
                                        onPress={() => { onSelect(item.value); setOpen(false); }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingHorizontal: 16,
                                            paddingVertical: 14,
                                            borderBottomWidth: 1,
                                            borderBottomColor: colors.borderLight,
                                            backgroundColor: isSelected ? (colors.primary + '15') : 'transparent',
                                        }}
                                    >
                                        <Text style={{ fontSize: 14, color: isSelected ? colors.primary : colors.textPrimary, fontWeight: isSelected ? '600' : '400', flex: 1 }}>
                                            {item.label}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const CommunityPicksScreen = () => {
    const { resolvedTheme } = useTheme();
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: currentColors.backgroundPrimary },
        scrollView: { flex: 1 },
        scrollContent: { paddingBottom: 100 },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        backButton: { padding: 8, marginRight: 8 },
        headerTitle: { fontSize: 20, fontWeight: '700', color: currentColors.textPrimary, flex: 1 },
        controls: {
            backgroundColor: currentColors.cardBackground,
            marginHorizontal: 12,
            marginTop: 12,
            marginBottom: 8,
            borderRadius: 12,
            padding: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        eventToggle: {
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            borderRadius: 8,
            overflow: 'hidden',
            alignSelf: 'flex-start',
            marginTop: 4,
        },
        eventButton: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: currentColors.cardBackground },
        eventButtonActive: { backgroundColor: currentColors.primary },
        eventButtonText: { fontSize: 14, fontWeight: '500', color: currentColors.textSecondary },
        eventButtonTextActive: { color: currentColors.textInverse },
        scoredBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 12,
            marginBottom: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: '#f0fdf4',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#bbf7d0',
            gap: 8,
        },
        scoredBannerText: { fontSize: 13, fontWeight: '500', color: '#15803d', flex: 1 },
        positionCard: {
            backgroundColor: currentColors.cardBackground,
            marginHorizontal: 12,
            marginBottom: 10,
            borderRadius: 12,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        positionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: currentColors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
        },
        positionLabel: { fontSize: 15, fontWeight: '700', color: currentColors.textPrimary },
        positionSubLabel: { fontSize: 13, color: currentColors.textSecondary, marginLeft: 8 },
        positionBody: { padding: 12, gap: 8 },
        driverRow: { borderRadius: 8, padding: 10, backgroundColor: currentColors.backgroundSecondary },
        driverRowCorrect: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
        driverRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
        driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
        driverName: { fontSize: 14, fontWeight: '600', color: currentColors.textPrimary },
        driverNameCorrect: { color: '#15803d' },
        driverTeam: { fontSize: 12, color: currentColors.textSecondary },
        percentageText: { fontSize: 14, fontWeight: '700', color: currentColors.textPrimary, marginLeft: 8 },
        percentageTextCorrect: { color: '#15803d' },
        barTrack: { height: 8, backgroundColor: currentColors.borderLight, borderRadius: 4, overflow: 'hidden' },
        barFill: { height: 8, borderRadius: 4, backgroundColor: currentColors.primary },
        barFillCorrect: { backgroundColor: '#22c55e' },
        correctSummary: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: currentColors.borderLight },
        correctSummaryText: { fontSize: 12, color: currentColors.textSecondary },
        emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 24 },
        emptyStateText: { fontSize: 16, color: currentColors.textSecondary, textAlign: 'center', marginTop: 12 },
        centeredLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    });

    const [seasons, setSeasons] = useState<{ year: number; displayLabel: string }[]>([]);
    const [seasonFilter, setSeasonFilter] = useState<number | null>(null);
    const [weeks, setWeeks] = useState<CommunityWeek[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [eventType, setEventType] = useState<'race' | 'sprint'>('race');
    const [stats, setStats] = useState<CommunityStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [weeksLoading, setWeeksLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const loadSeason = async () => {
            try {
                const res = await seasonsAPI.getSeasons();
                if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    setSeasons(res.data.data);
                    const latest = Math.max(...res.data.data.map((s: { year: number }) => s.year));
                    setSeasonFilter(latest);
                }
            } catch { /* ignore */ }
        };
        loadSeason();
    }, []);

    const loadWeeks = useCallback(async () => {
        try {
            setWeeksLoading(true);
            setSelectedWeek(null);
            const res = await communityPicksAPI.getAvailableWeeks(seasonFilter ?? undefined);
            if (res.data?.success) {
                const weekData: CommunityWeek[] = res.data.data;
                setWeeks(weekData);
                if (weekData.length > 0) {
                    const lastScored = weekData.find(w => w.isScored);
                    const defaultWeek = lastScored ?? weekData[weekData.length - 1];
                    setSelectedWeek(defaultWeek.weekNumber);
                }
            }
        } catch { /* ignore */ }
        finally { setWeeksLoading(false); }
    }, [seasonFilter]);

    useEffect(() => { loadWeeks(); }, [loadWeeks]);

    useEffect(() => {
        if (selectedWeek == null) return;
        const load = async () => {
            try {
                setLoading(true);
                const res = await communityPicksAPI.getStats(selectedWeek, eventType, seasonFilter ?? undefined);
                if (res.data?.success) setStats(res.data.data);
            } catch { setStats(null); }
            finally { setLoading(false); }
        };
        load();
    }, [selectedWeek, eventType, seasonFilter]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadWeeks();
        setRefreshing(false);
    };

    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);

    const seasonOptions: DropdownOption[] = seasons.map(s => ({
        label: s.displayLabel || String(s.year),
        value: s.year,
    }));

    const raceOptions: DropdownOption[] = weeks.map(w => ({
        label: `Week ${w.weekNumber}${w.raceName ? ` — ${w.raceName}` : ''}${w.isScored ? ' ✓' : ''}`,
        value: w.weekNumber,
    }));

    const ordinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={currentColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Picks</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.controls}>
                    {seasons.length > 1 && (
                        <Dropdown
                            label="Season"
                            value={seasonFilter}
                            options={seasonOptions}
                            onSelect={(year) => { setSeasonFilter(year); setEventType('race'); }}
                            colors={currentColors}
                        />
                    )}

                    <Dropdown
                        label="Race"
                        value={selectedWeek}
                        options={raceOptions}
                        onSelect={(week) => { setSelectedWeek(week); setEventType('race'); }}
                        loading={weeksLoading}
                        placeholder="Select a race…"
                        colors={currentColors}
                    />

                    {selectedWeekData?.hasSprint && (
                        <View style={styles.eventToggle}>
                            <TouchableOpacity
                                style={[styles.eventButton, eventType === 'race' && styles.eventButtonActive]}
                                onPress={() => setEventType('race')}
                            >
                                <Text style={[styles.eventButtonText, eventType === 'race' && styles.eventButtonTextActive]}>Race</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.eventButton, eventType === 'sprint' && styles.eventButtonActive]}
                                onPress={() => setEventType('sprint')}
                            >
                                <Text style={[styles.eventButtonText, eventType === 'sprint' && styles.eventButtonTextActive]}>Sprint</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {stats?.isScored && (
                    <View style={styles.scoredBanner}>
                        <Ionicons name="checkmark-circle" size={18} color="#15803d" />
                        <Text style={styles.scoredBannerText}>Results are in — correct picks are highlighted</Text>
                    </View>
                )}

                {loading ? (
                    <View style={styles.centeredLoader}>
                        <ActivityIndicator size="large" color={currentColors.primary} />
                    </View>
                ) : stats == null || stats.positions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="bar-chart-outline" size={48} color={currentColors.textTertiary} />
                        <Text style={styles.emptyStateText}>No pick data available for this week.</Text>
                    </View>
                ) : (
                    stats.positions.map((pos) => {
                        const correctDriver = pos.drivers.find(d => d.isCorrect);
                        return (
                            <View key={pos.position} style={styles.positionCard}>
                                <View style={styles.positionHeader}>
                                    <Text style={styles.positionLabel}>P{pos.position}</Text>
                                    <Text style={styles.positionSubLabel}>{ordinal(pos.position)} place</Text>
                                </View>

                                <View style={styles.positionBody}>
                                    {pos.drivers.map((driver) => (
                                        <View key={driver.driverId} style={[styles.driverRow, driver.isCorrect && styles.driverRowCorrect]}>
                                            <View style={styles.driverRowTop}>
                                                <View style={styles.driverInfo}>
                                                    {driver.isCorrect && (
                                                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.driverName, driver.isCorrect && styles.driverNameCorrect]} numberOfLines={1}>
                                                            {driver.driverName}
                                                        </Text>
                                                        <Text style={styles.driverTeam} numberOfLines={1}>{driver.driverTeam}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.percentageText, driver.isCorrect && styles.percentageTextCorrect]}>
                                                    {driver.percentage}%
                                                </Text>
                                            </View>
                                            <View style={styles.barTrack}>
                                                <View style={[styles.barFill, driver.isCorrect && styles.barFillCorrect, { width: `${Math.max(driver.percentage, 1)}%` }]} />
                                            </View>
                                        </View>
                                    ))}

                                    {stats.isScored && (
                                        <View style={styles.correctSummary}>
                                            {correctDriver ? (
                                                <Text style={styles.correctSummaryText}>
                                                    {correctDriver.percentage}% of players picked {correctDriver.driverName} correctly for P{pos.position}
                                                </Text>
                                            ) : pos.actualResult ? (
                                                <Text style={styles.correctSummaryText}>
                                                    Correct: {pos.actualResult.driverName} — 0% of players got this right
                                                </Text>
                                            ) : null}
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default CommunityPicksScreen;
