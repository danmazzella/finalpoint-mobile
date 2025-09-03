// Chat types for FinalPoint app - League-based chat system
export interface ChatMessage {
    id: string;
    text: string;
    createdAt: Date;
    user: {
        _id: string;
        name: string;
        avatar?: string;
    };
    leagueId: string; // Required - each message belongs to a specific league
    channelId?: string; // Optional - for different chat channels within a league (general, race-discussion, etc.)
    image?: string; // For image messages
    system?: boolean; // For system messages (like "User joined the league")
    status?: 'sending' | 'sent' | 'failed' | 'queued'; // Message delivery status
    tempId?: string; // Temporary ID for messages being sent (before server assigns real ID)
}

export interface ChatChannel {
    id: string;
    name: string;
    description?: string;
    leagueId: string; // Required - each channel belongs to a specific league
    type: 'general' | 'race-discussion' | 'picks' | 'admin';
    createdAt: Date;
    createdBy: string;
    memberCount: number;
    lastMessage?: {
        text: string;
        createdAt: Date;
        user: string;
    };
}

export interface ChatUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: Date;
    leagues: string[]; // Array of league IDs user belongs to
}

export interface ChatNotification {
    id: string;
    userId: string;
    channelId: string;
    messageId: string;
    read: boolean;
    createdAt: Date;
}
