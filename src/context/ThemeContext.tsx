import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../constants/Colors';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const systemColorScheme = useColorScheme();

    // Resolve the actual theme (system preference or user choice)
    const resolveTheme = (selectedTheme: Theme): 'light' | 'dark' => {
        if (selectedTheme === 'system') {
            return systemColorScheme || 'light';
        }
        return selectedTheme;
    };

    // Initialize theme on mount
    useEffect(() => {
        const initializeTheme = async () => {
            try {
                // Get saved theme from AsyncStorage
                const savedTheme = await AsyncStorage.getItem('theme');
                const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme)
                    ? savedTheme as Theme
                    : 'system';

                setThemeState(initialTheme);
                const resolved = resolveTheme(initialTheme);
                setResolvedTheme(resolved);
            } catch (error) {
                console.error('Error initializing theme:', error);
                // Fallback to system theme
                setThemeState('system');
                setResolvedTheme(systemColorScheme || 'light');
            }
        };

        initializeTheme();
    }, []);

    // Update resolved theme when theme or system color scheme changes
    useEffect(() => {
        const newResolvedTheme = resolveTheme(theme);
        setResolvedTheme(newResolvedTheme);
    }, [theme, systemColorScheme]);

    const setTheme = async (newTheme: Theme) => {
        try {
            setThemeState(newTheme);
            await AsyncStorage.setItem('theme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = theme === 'light' ? 'dark' : 'light';
            await setTheme(newTheme);
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Hook to get current theme colors
export function useThemeColors() {
    const { resolvedTheme } = useTheme();
    return resolvedTheme === 'dark' ? darkColors : lightColors;
}
