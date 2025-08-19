import { useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

interface PositionNavigationParams {
    leagueId: number;
    weekNumber: number;
    leagueName: string;
}

export const usePositionNavigation = ({ leagueId, weekNumber, leagueName }: PositionNavigationParams) => {
    const router = useRouter();
    const isNavigating = useRef(false);
    const lastPosition = useRef<number | null>(null);

    const navigateToPosition = useCallback((newPosition: number, direction: 'forward' | 'backward') => {
        // Prevent multiple rapid navigations
        if (isNavigating.current) return;

        // Don't navigate if it's the same position
        if (lastPosition.current === newPosition) return;

        isNavigating.current = true;
        lastPosition.current = newPosition;

        // Use replace to avoid building up navigation stack
        const currentParams = {
            leagueId: leagueId.toString(),
            weekNumber: weekNumber.toString(),
            position: newPosition.toString(),
            leagueName: leagueName,
        };

        if (Platform.OS === 'ios') {
            // For iOS, use setParams for smooth transitions without loading screens
            router.setParams({
                position: newPosition.toString(),
            });
        } else {
            // For Android, use replace to avoid navigation stack buildup
            router.replace({
                pathname: '/position-results',
                params: currentParams,
            });
        }

        // Reset navigation flag after animation completes
        setTimeout(() => {
            isNavigating.current = false;
        }, Platform.OS === 'android' ? 400 : 100);
    }, [router, leagueId, weekNumber, leagueName]);

    const navigateToPrevious = useCallback((currentPosition: number, availablePositions: number[]) => {
        const currentIndex = availablePositions.findIndex(pos => pos === currentPosition);
        if (currentIndex > 0) {
            const newPosition = availablePositions[currentIndex - 1];
            navigateToPosition(newPosition, 'backward');
        }
    }, [navigateToPosition]);

    const navigateToNext = useCallback((currentPosition: number, availablePositions: number[]) => {
        const currentIndex = availablePositions.findIndex(pos => pos === currentPosition);
        if (currentIndex < availablePositions.length - 1) {
            const newPosition = availablePositions[currentIndex + 1];
            navigateToPosition(newPosition, 'forward');
        }
    }, [navigateToPosition]);

    const canNavigate = useCallback(() => {
        return !isNavigating.current;
    }, []);

    return {
        navigateToPosition,
        navigateToPrevious,
        navigateToNext,
        canNavigate,
        isNavigating: isNavigating.current,
    };
};
