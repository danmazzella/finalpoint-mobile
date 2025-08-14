import { StyleSheet } from 'react-native';
import { useScreenSize } from '../hooks/useScreenSize';

// Responsive spacing utilities
export const responsiveSpacing = {
    xs: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 8 : 4,
    sm: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 16 : 8,
    md: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 24 : 16,
    lg: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 32 : 24,
    xl: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 48 : 32,
    xxl: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 64 : 48,
};

// Responsive font sizes
export const responsiveFontSizes = {
    xs: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 14 : 12,
    sm: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 16 : 14,
    base: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 18 : 16,
    lg: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 22 : 18,
    xl: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 26 : 20,
    '2xl': (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 32 : 24,
    '3xl': (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 38 : 30,
    '4xl': (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 44 : 36,
};

// Responsive container styles
export const responsiveContainer = {
    maxWidth: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 1280 : '100%',
    paddingHorizontal: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 24 : 16,
    marginHorizontal: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 'auto' : 0,
};

// Responsive grid utilities
export const responsiveGrid = {
    columns: (screenSize: 'phone' | 'tablet', phoneCols: number, tabletCols: number) =>
        screenSize === 'tablet' ? tabletCols : phoneCols,
    gap: (screenSize: 'phone' | 'tablet') => screenSize === 'tablet' ? 24 : 16,
};

// Hook for responsive styles
export const useResponsiveStyles = () => {
    const screenSize = useScreenSize();

    return {
        spacing: (size: keyof typeof responsiveSpacing) => responsiveSpacing[size](screenSize),
        fontSize: (size: keyof typeof responsiveFontSizes) => responsiveFontSizes[size](screenSize),
        container: responsiveContainer.maxWidth(screenSize),
        paddingHorizontal: responsiveContainer.paddingHorizontal(screenSize),
        marginHorizontal: responsiveContainer.marginHorizontal(screenSize),
        gridColumns: (phoneCols: number, tabletCols: number) => responsiveGrid.columns(screenSize, phoneCols, tabletCols),
        gridGap: responsiveGrid.gap(screenSize),
    };
};

// Utility function to create responsive styles
export const createResponsiveStyles = <T extends Record<string, any>>(
    phoneStyles: T,
    tabletStyles: Partial<T>
) => {
    return (screenSize: 'phone' | 'tablet') => ({
        ...phoneStyles,
        ...(screenSize === 'tablet' ? tabletStyles : {}),
    });
};

