/**
 * Formats the time remaining until a lock time in a human-readable format
 * @param lockTime - ISO string or Date object representing the lock time
 * @param options - Optional configuration for the output format
 * @returns Formatted time string (e.g., "2d 5h 30m", "Locked", "Now")
 */
export const formatTimeRemainingLocal = (
    lockTime: string | Date,
    options: {
        showSeconds?: boolean;
        compact?: boolean;
        lockedText?: string;
        nowText?: string;
    } = {}
) => {
    const {
        showSeconds = false,
        compact = false,
        lockedText = 'Locked',
        nowText = 'Now'
    } = options;

    const now = new Date();
    const lockDateTime = new Date(lockTime);

    if (now >= lockDateTime) {
        return lockedText;
    }

    const timeDiff = lockDateTime.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = showSeconds ? Math.floor((timeDiff % (1000 * 60)) / 1000) : 0;

    if (compact) {
        // Compact format (e.g., "2d 5h", "5h 30m", "30m")
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else if (showSeconds && seconds > 0) {
            return `${seconds}s`;
        } else {
            return nowText;
        }
    } else {
        // Full format (e.g., "2d 5h 30m")
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (showSeconds && seconds > 0) parts.push(`${seconds}s`);

        return parts.join(' ') || nowText;
    }
};

/**
 * Formats a date in a human-readable format
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {}
) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };

    return new Date(date).toLocaleDateString(undefined, defaultOptions);
};

/**
 * Formats a date and time in a human-readable format
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date and time string
 */
export const formatDateTime = (
    date: string | Date,
    options: Intl.DateTimeFormatOptions = {}
) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };

    return new Date(date).toLocaleString(undefined, defaultOptions);
};
