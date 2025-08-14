import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type ScreenSize = 'phone' | 'tablet';

export const useScreenSize = (): ScreenSize => {
    const [screenSize, setScreenSize] = useState<ScreenSize>('phone');

    useEffect(() => {
        const updateScreenSize = () => {
            const { width, height } = Dimensions.get('window');
            // Use 768px as the breakpoint (standard tablet breakpoint)
            const isTablet = width >= 768 || height >= 768;
            setScreenSize(isTablet ? 'tablet' : 'phone');
        };

        // Set initial size
        updateScreenSize();

        // Listen for dimension changes (rotation, etc.)
        const subscription = Dimensions.addEventListener('change', updateScreenSize);

        return () => {
            subscription?.remove();
        };
    }, []);

    return screenSize;
};

