// User types
export interface User {
    id: number;
    email: string;
    name: string;
    avatar?: string;
    role?: 'user' | 'admin';
    chatFeatureEnabled?: boolean;
    positionChangesEnabled?: boolean;
}

export interface SignupData {
    email: string;
    password: string;
    name: string;
}

export interface LoginData {
    email: string;
    password: string;
}

// League types
export interface League {
    id: number;
    name: string;
    ownerId: number;
    seasonYear: number;
    joinCode?: string;
    memberCount?: number;
    isMember?: boolean;
    userRole?: 'Owner' | 'Member';
    requiredPositions?: number[];
    isPublic?: boolean;
    seasonActivity?: number;
    lastTwoRaceWeeksActivity?: number;
    seasonPicks?: number;
    lastTwoRaceWeeksPicks?: number;
    totalPicks?: number;
    totalActivity?: number;
    activityScore?: number;
    positionStatus?: PositionStatus;
}

// Position status types for efficient pick status
export interface PositionStatus {
    weekNumber: number;
    positions: PositionPickStatus[];
}

export interface PositionPickStatus {
    position: number;
    hasPick: boolean;
}

// Driver types
export interface Driver {
    id: number;
    name: string;
    team: string;
    driverNumber: number;
    country: string;
    isActive?: boolean;
}

// Pick types
export interface Pick {
    id: number;
    leagueId: number;
    weekNumber: number;
    driverId: number;
    driverName: string;
    isLocked: boolean;
    points: number;
}

// New types for V2 multiple position support
export interface PickV2 {
    position: number;
    driverId: number;
}

export interface UserPickV2 {
    id: number;
    leagueId: number;
    userId: number;
    weekNumber: number;
    position: number;
    driverId: number;
    driverName: string;
    driverTeam: string;
    isLocked: boolean;
    isScored: boolean;
    points: number;
}

export interface RaceResultV2 {
    userId: number;
    userName: string;
    userAvatar?: string;
    picks: {
        position: number;
        driverId: number | null;
        driverName: string | null;
        driverTeam: string | null;
        actualDriverId: number;
        actualDriverName: string;
        actualDriverTeam: string;
        positionDifference: number | null;
        isCorrect: boolean;
        points: number;
    }[];
    totalPoints: number;
    totalCorrect: number;
    hasMadeAllPicks: boolean;
}

// New interfaces for V2 result views
export interface PositionResultV2 {
    leagueId: number;
    weekNumber: number;
    position: number;
    picks: {
        userId: number;
        userName: string;
        driverId: number;
        driverName: string;
        driverTeam: string;
        position: number;
        isCorrect: boolean | null;
        points: number | null;
        actualDriverId: number | null;
        actualDriverName: string | null;
        actualDriverTeam: string | null;
        actualFinishPosition: number | null;
    }[];
    actualResult: {
        driverId: number;
        driverName: string;
        driverTeam: string;
    } | null;
    totalParticipants: number;
    correctPicks: number;
}

export interface MemberPicksV2 {
    leagueId: number;
    weekNumber: number;
    userId: number;
    userName: string;
    picks: {
        position: number;
        driverId: number;
        driverName: string;
        driverTeam: string;
        isCorrect: boolean | null;
        points: number | null;
        actualDriverId: number | null;
        actualDriverName: string | null;
        actualDriverTeam: string | null;
        actualFinishPosition: number | null;
    }[];
    totalPoints: number;
    correctPicks: number;
    totalPicks: number;
    accuracy: string;
}

// Notification types
export interface NotificationPreferences {
    emailReminders: boolean;
    emailScoreUpdates: boolean;
    pushReminders: boolean;
    pushScoreUpdates: boolean;
    emailReminder5Days: boolean;
    emailReminder3Days: boolean;
    emailReminder1Day: boolean;
    emailReminder1Hour: boolean;
    pushReminder5Days: boolean;
    pushReminder3Days: boolean;
    pushReminder1Day: boolean;
    pushReminder1Hour: boolean;
    emailOther: boolean;
    pushOther: boolean;
    pushChatMessages: boolean;
}

// Activity types
export interface Activity {
    id: number;
    leagueId: number;
    userId: number | null;
    userName: string | null;
    userAvatar?: string;
    activityType: string;
    weekNumber: number | null;
    driverId: number | null;
    driverName: string | null;
    driverTeam: string | null;
    previousDriverId: number | null;
    previousDriverName: string | null;
    previousDriverTeam: string | null;
    position: number | null;
    raceName: string | null;
    leagueName: string | null;
    createdAt: string;
    // New fields for formatted messages from backend
    primaryMessage?: string;
    secondaryMessage?: string;
    // New field for flexible activity data
    activityData?: string;
}

// User stats types
export interface UserStats {
    totalPicks: number;
    correctPicks: number;
    totalPoints: number;
    averagePoints: number;
    accuracy: number;
    avgDistance: number;
    perfectPicksRate: number;
}

export interface GlobalStats {
    totalUsers: number;
    totalLeagues: number;
    totalPicks: number;
    correctPicks: number;
    accuracy: number;
    averagePoints: number;
    averageDistanceFromTarget: number;
    lifetimeAccuracy: number;
    lifetimeAvgDistance: number;
    weekAccuracy: number;
    weekAvgDistance: number;
}

// Admin types
export interface AdminUser {
    id: number;
    email: string;
    name: string;
    role: 'user' | 'admin';
    createdAt: string;
    lastLogin?: string;
}

export interface AdminStats {
    users: {
        totalUsers: number;
        adminUsers: number;
        regularUsers: number;
    };
    leagues: {
        totalLeagues: number;
        activeLeagues: number;
        archivedLeagues: number;
        averageMembersPerLeague: number;
    };
    picks: {
        totalPicks: number;
        scoredPicks: number;
        lockedPicks: number;
        totalPoints: number;
        averagePoints: number;
        correctPicks: number;
        accuracy: number;
    };
}

// F1 Race types
export interface F1Race {
    id: number;
    raceName: string;
    raceDate: string;
    weekNumber: number;
    seasonYear: number;
    isLocked: boolean;
    isScored: boolean;
    status?: string;
    // New pick locking fields
    picksLocked?: boolean;
    timeUntilLock?: string;
    timeUntilQualifying?: string;
    lockMessage?: string;
    lockTime?: string; // Added for new countdown logic
    qualifyingDate?: string;
    circuitName?: string;
    country?: string;
    showCountdown?: boolean;
}

// League member types
export interface LeagueMember {
    id: number;
    userId: number;
    userName: string;
    userAvatar?: string;
    userRole: 'Owner' | 'Member';
    joinedAt: string;
    totalPoints: number;
    correctPicks: number;
    accuracy: number;
}

// League standings types
export interface LeagueStanding {
    id: string;
    name: string;
    avatar?: string | null;
    totalPoints: number;
    correctPicks: number;
    totalPicks: number;
    accuracy: number | null;
    averagePoints: number;
    averageDistanceFromCorrect?: number;
    avgDistance?: number;
    racesParticipated?: number;
    averagePointsPerRace?: number;
    newAccuracy?: number; // New points-based accuracy field
    correctPicksByPosition?: {
        userId: number;
        userName: string;
        positions: {
            [position: number]: {
                position: number;
                totalPicks: number;
                correctPicks: number;
            };
        };
    } | null;
}

// League stats types
export interface LeagueStats {
    totalMembers: number;
    totalPicks: number;
    correctPicks: number;
    accuracy: number;
    avgDistance?: number;
    averagePoints: number;
    totalPoints: number;
    mostActiveMember: {
        userId: number;
        userName: string;
        picksCount: number;
    };
    topPerformer: {
        userId: number;
        userName: string;
        totalPoints: number;
    };
}


