import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useScreenSize } from '../hooks/useScreenSize';
import { spacing } from '../utils/styles';

interface ResponsiveContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
    maxWidth?: number;
    paddingHorizontal?: number;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
    children,
    style,
    maxWidth = 1280, // Default to max-w-7xl equivalent
    paddingHorizontal = spacing.md,
}) => {
    const screenSize = useScreenSize();

    const containerStyle: ViewStyle = {
        ...styles.container,
        ...(screenSize === 'tablet' && {
            maxWidth,
            alignSelf: 'center',
            width: '100%',
        }),
        ...style,
    };

    const contentStyle: ViewStyle = {
        ...styles.content,
        paddingHorizontal: screenSize === 'tablet' ? paddingHorizontal : spacing.md,
    };

    return (
        <View style={containerStyle}>
            <View style={contentStyle}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    content: {
        flex: 1,
    },
});

export default ResponsiveContainer;

