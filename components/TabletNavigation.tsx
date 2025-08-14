import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import Colors from '../constants/Colors';
import { spacing, borderRadius, shadows } from '../utils/styles';
import { useScreenSize } from '../hooks/useScreenSize';

const TabletNavigation = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const screenSize = useScreenSize();

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/(tabs)',
            icon: 'home'
        },
        {
            name: 'Leagues',
            href: '/(tabs)/leagues',
            icon: 'trophy'
        },
        {
            name: 'Picks',
            href: '/(tabs)/picks',
            icon: 'checkmark-circle'
        },
        {
            name: 'Profile',
            href: '/(tabs)/profile',
            icon: 'person'
        },
    ];

    // Add admin link for admin users
    const adminNavigationItem = {
        name: 'Admin',
        href: '/admin',
        icon: 'shield-checkmark'
    };

    const allNavigationItems = user?.role === 'admin'
        ? [...navigationItems, adminNavigationItem]
        : navigationItems;

    const isActive = (href: string) => {
        if (href === '/(tabs)') {
            return pathname === '/(tabs)' || pathname === '/(tabs)/';
        }
        return pathname.startsWith(href);
    };

    const handleLogout = () => {
        logout();
    };

    // Hide navigation on certain pages (similar to web app)
    const shouldHideNavigation = pathname.includes('/standings') ||
        pathname.includes('/results') ||
        pathname.includes('/activity') ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/privacy' ||
        pathname === '/terms' ||
        pathname === '/reset-password';

    if (shouldHideNavigation) {
        return null;
    }

    // For larger tablets (>= 1024px), show desktop navigation
    // For smaller tablets (768px - 1023px), show mobile navigation
    const isLargeTablet = screenSize === 'tablet' &&
        (require('react-native').Dimensions.get('window').width >= 1024 ||
            require('react-native').Dimensions.get('window').height >= 1024);

    return (
        <View style={styles.container}>
            {/* Desktop Navigation - shown on large tablets */}
            <View style={[
                styles.desktopNav,
                isLargeTablet && styles.desktopNavVisible
            ]}>
                <View style={styles.navContent}>
                    {/* Logo */}
                    <TouchableOpacity
                        style={styles.logoContainer}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Ionicons name="car-sport" size={32} color={Colors.light.buttonPrimary} />
                        <Text style={styles.logoText}>FinalPoint</Text>
                    </TouchableOpacity>

                    {/* Desktop Navigation Links */}
                    <View style={styles.navLinks}>
                        {allNavigationItems.map((item) => (
                            <TouchableOpacity
                                key={item.name}
                                style={[
                                    styles.navLink,
                                    isActive(item.href) && styles.activeNavLink
                                ]}
                                onPress={() => router.push(item.href)}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={20}
                                    color={isActive(item.href) ? Colors.light.buttonPrimary : Colors.light.textSecondary}
                                />
                                <Text style={[
                                    styles.navLinkText,
                                    isActive(item.href) && styles.activeNavLinkText
                                ]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* User Menu */}
                    <View style={styles.userMenu}>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color={Colors.light.textSecondary} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Mobile Navigation - shown on smaller tablets */}
            <View style={[
                styles.mobileNav,
                !isLargeTablet && styles.mobileNavVisible
            ]}>
                {/* Top Bar */}
                <View style={styles.mobileTopBar}>
                    {/* Logo */}
                    <TouchableOpacity
                        style={styles.mobileLogoContainer}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Ionicons name="car-sport" size={24} color={Colors.light.buttonPrimary} />
                        <Text style={styles.mobileLogoText}>FinalPoint</Text>
                    </TouchableOpacity>

                    {/* Hamburger Menu */}
                    <TouchableOpacity
                        style={styles.hamburgerButton}
                        onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Ionicons name="menu" size={24} color={Colors.light.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <View style={styles.mobileMenu}>
                        <View style={styles.mobileMenuContent}>
                            {allNavigationItems.map((item) => (
                                <TouchableOpacity
                                    key={item.name}
                                    style={[
                                        styles.mobileNavLink,
                                        isActive(item.href) && styles.activeMobileNavLink
                                    ]}
                                    onPress={() => {
                                        router.push(item.href);
                                        setIsMobileMenuOpen(false);
                                    }}
                                >
                                    <Ionicons
                                        name={item.icon as any}
                                        size={20}
                                        color={isActive(item.href) ? Colors.light.buttonPrimary : Colors.light.textSecondary}
                                    />
                                    <Text style={[
                                        styles.mobileNavLinkText,
                                        isActive(item.href) && styles.activeMobileNavLinkText
                                    ]}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <View style={styles.mobileMenuDivider} />

                            <TouchableOpacity
                                style={styles.mobileLogoutButton}
                                onPress={() => {
                                    handleLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <Ionicons name="log-out-outline" size={20} color={Colors.light.textSecondary} />
                                <Text style={styles.mobileLogoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.light.cardBackground,
        ...shadows.md,
    },
    desktopNav: {
        display: 'none', // Hidden by default
    },
    desktopNavVisible: {
        display: 'flex', // Show on large tablets
    },
    navContent: {
        maxWidth: 1280, // Equivalent to max-w-7xl
        marginHorizontal: 'auto',
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    navLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    activeNavLink: {
        backgroundColor: Colors.light.primaryLight,
    },
    navLinkText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    activeNavLinkText: {
        color: Colors.light.buttonPrimary,
    },
    userMenu: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    mobileNav: {
        display: 'none', // Hidden by default
    },
    mobileNavVisible: {
        display: 'flex', // Show on smaller tablets
    },
    mobileTopBar: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mobileLogoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    mobileLogoText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.textPrimary,
    },
    hamburgerButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    mobileMenu: {
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    mobileMenuContent: {
        gap: spacing.sm,
        paddingTop: spacing.md,
    },
    mobileNavLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    activeMobileNavLink: {
        backgroundColor: Colors.light.primaryLight,
    },
    mobileNavLinkText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
    activeMobileNavLinkText: {
        color: Colors.light.buttonPrimary,
    },
    mobileMenuDivider: {
        height: 1,
        backgroundColor: Colors.light.borderLight,
        marginVertical: spacing.md,
    },
    mobileLogoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    mobileLogoutText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.textSecondary,
    },
});

export default TabletNavigation;
