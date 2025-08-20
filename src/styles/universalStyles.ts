import { StyleSheet } from 'react-native';

// Universal theme-aware style factory
export const createThemeStyles = (currentColors: any) => StyleSheet.create({
    // Common layout styles
    container: {
        flex: 1,
        backgroundColor: currentColors.backgroundPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },

    // Common card/section styles
    card: {
        backgroundColor: currentColors.cardBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: currentColors.borderLight,
        padding: 16,
        marginVertical: 8,
    },
    section: {
        backgroundColor: currentColors.cardBackground,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: currentColors.borderLight,
        marginTop: 16,
    },

    // Common text styles
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: currentColors.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: currentColors.textPrimary,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: currentColors.textPrimary,
        padding: 16,
        paddingBottom: 8,
    },
    bodyText: {
        fontSize: 16,
        color: currentColors.textPrimary,
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        color: currentColors.textSecondary,
        lineHeight: 20,
    },
    smallText: {
        fontSize: 12,
        color: currentColors.textTertiary,
    },

    // Common button styles
    button: {
        backgroundColor: currentColors.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    buttonSecondary: {
        backgroundColor: currentColors.secondary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    buttonText: {
        color: currentColors.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextSecondary: {
        color: currentColors.textInverse,
        fontSize: 16,
        fontWeight: '600',
    },

    // Common input styles
    input: {
        backgroundColor: currentColors.cardBackground,
        borderWidth: 1,
        borderColor: currentColors.borderMedium,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: currentColors.textPrimary,
        minHeight: 44,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: currentColors.textPrimary,
        marginBottom: 4,
    },

    // Common list item styles
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: currentColors.borderLight,
        backgroundColor: currentColors.cardBackground,
    },
    listItemText: {
        fontSize: 16,
        color: currentColors.textPrimary,
        flex: 1,
    },

    // Common header styles
    header: {
        backgroundColor: currentColors.cardBackground,
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: currentColors.borderLight,
    },

    // Common footer styles
    footer: {
        alignItems: 'center',
        padding: 16,
        marginTop: 16,
    },
    footerText: {
        fontSize: 14,
        color: currentColors.textSecondary,
        marginBottom: 4,
    },

    // Common spacing utilities
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    spaceBetween: {
        justifyContent: 'space-between',
    },

    // Common status styles
    success: {
        backgroundColor: currentColors.successLight,
        borderColor: currentColors.success,
    },
    warning: {
        backgroundColor: currentColors.warningLight,
        borderColor: currentColors.warning,
    },
    error: {
        backgroundColor: currentColors.errorLight,
        borderColor: currentColors.error,
    },
});

// Universal spacing and sizing constants
export const universalSpacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Universal border radius constants
export const universalBorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

// Universal shadow styles
export const universalShadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
};
