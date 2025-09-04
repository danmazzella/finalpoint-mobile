import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAnalytics } from '../utils/analytics';

export default function ScreenTracker() {
    const pathname = usePathname();
    const analytics = useAnalytics();

    useEffect(() => {
        if (!pathname) {
            console.log('📱 ScreenTracker: No pathname available');
            return;
        }

        // Map pathname to screen name (matching web app page names)
        const getScreenName = (path: string) => {
            if (path === '/' || path === '/(tabs)') return 'Home';
            if (path === '/(tabs)/dashboard') return 'Dashboard';
            if (path === '/(tabs)/leagues') return 'Leagues';
            if (path === '/(tabs)/profile') return 'Profile';
            if (path.startsWith('/leagues/')) return 'League Details';
            if (path.startsWith('/auth')) return 'Authentication';
            // Mobile-specific screens (not in web app)
            if (path.startsWith('/position-results')) return 'Position Results';
            if (path.startsWith('/race-results')) return 'Race Results';
            if (path.startsWith('/activity')) return 'Activity';
            if (path.startsWith('/admin')) return 'Admin';
            if (path.startsWith('/notifications')) return 'Notifications';
            return 'Page';
        };

        const screenName = getScreenName(pathname);

        // Track the screen view
        analytics.screenView(screenName, pathname);
    }, [pathname, analytics]);

    return null;
}
