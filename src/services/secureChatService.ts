import { ChatMessage, ChatChannel, ChatUser } from '../types/chat';
import { apiService, leaguesAPI, chatAPI } from './apiService';
import { secureWebSocketService } from './secureWebSocketService';

/**
 * Secure Chat Service - Uses backend API for all operations
 * This service ensures all chat operations go through proper backend validation
 * instead of direct Firestore access which could be bypassed
 */
export class SecureChatService {
    /**
     * Send a message to a league chat (via secure WebSocket or backend API)
     * Returns the message with status information
     */
    static async sendMessage(
        leagueId: string,
        message: Omit<ChatMessage, 'id' | 'createdAt'>
    ): Promise<ChatMessage> {
        try {
            // Create a temporary message with sending status
            const tempMessage: ChatMessage = {
                ...message,
                id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'sending'
            };

            // Use WebSocket for real-time messaging if available
            if (secureWebSocketService.isConnected()) {
                secureWebSocketService.sendMessage(leagueId, message.text, message.channelId);
                return {
                    ...tempMessage,
                    status: 'sending' // Keep as sending until WebSocket confirms
                };
            } else {
                // Fallback to REST API if WebSocket is not available
                const response = await apiService.post('/chat/send', {
                    leagueId: parseInt(leagueId),
                    text: message.text,
                    channelId: message.channelId
                });

                if (!response.data.success) {
                    throw new Error(response.data.message || 'Failed to send message');
                }

                return {
                    ...tempMessage,
                    id: response.data.messageId,
                    status: 'sent'
                };
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Return message with failed status
            return {
                ...message,
                id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date(),
                tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'failed'
            };
        }
    }

    /**
     * Get messages for a league chat (via secure backend API)
     */
    static async getMessages(
        leagueId: string,
        channelId?: string,
        limit: number = 50
    ): Promise<ChatMessage[]> {
        try {
            const response = await apiService.get('/chat/messages', {
                params: {
                    leagueId: parseInt(leagueId),
                    channelId,
                    limit
                }
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get messages');
            }

            return response.data.messages.map((msg: any) => ({
                ...msg,
                createdAt: new Date(msg.createdAt)
            }));
        } catch (error) {
            console.error('Error getting messages via secure API:', error);
            throw error;
        }
    }

    /**
     * Get messages since a specific timestamp (for synchronization after reconnection)
     */
    static async getMessagesSince(
        leagueId: string,
        sinceTimestamp: Date,
        channelId?: string
    ): Promise<ChatMessage[]> {
        try {
            const response = await apiService.get('/chat/messages', {
                params: {
                    leagueId: parseInt(leagueId),
                    channelId,
                    since: sinceTimestamp.toISOString(),
                    limit: 100 // Get more messages for synchronization
                }
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get messages since timestamp');
            }

            return response.data.messages.map((msg: any) => ({
                ...msg,
                createdAt: new Date(msg.createdAt)
            }));
        } catch (error) {
            console.error('Error getting messages since timestamp:', error);
            throw error;
        }
    }

    /**
     * Validate if user has access to a league's chat
     */
    static async validateLeagueAccess(leagueId: string): Promise<boolean> {
        try {
            const response = await apiService.get(`/chat/validate/${leagueId}`);
            return response.data.success && response.data.hasAccess;
        } catch (error) {
            console.error('Error validating league access:', error);
            return false;
        }
    }

    /**
     * Get user's leagues for chat access (using existing leagues API)
     */
    static async getUserLeagues(_userId: string): Promise<string[]> {
        try {
            // Use the existing leagues API to get user's leagues
            const response = await leaguesAPI.getLeagues();
            const leagues = response.data.data || [];

            // Map league IDs to strings
            const userLeagues = leagues.map((league: { id: number }) => league.id.toString());

            return userLeagues;
        } catch (error) {
            console.error('Error getting user leagues from API:', error);
            throw error;
        }
    }

    /**
     * Mark messages as read for a league
     */
    static async markMessagesAsRead(leagueId: string): Promise<void> {
        try {
            const response = await apiService.post(`/chat/mark-read/${leagueId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to mark messages as read');
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    /**
     * Get unread message count for a specific league
     */
    static async getUnreadCount(leagueId: string): Promise<number> {
        try {
            const response = await apiService.get(`/chat/unread-count/${leagueId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get unread count');
            }
            return response.data.unreadCount || 0;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Get unread message counts for all leagues
     */
    static async getAllUnreadCounts(): Promise<{ leagueId: number, leagueName: string, unreadCount: number }[]> {
        try {
            const response = await apiService.get('/chat/unread-counts');
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get unread counts');
            }
            return response.data.unreadCounts || [];
        } catch (error) {
            console.error('Error getting all unread counts:', error);
            return [];
        }
    }

    /**
     * Get chat notification preferences for a specific league
     */
    static async getNotificationPreferences(leagueId: string): Promise<boolean> {
        try {
            const response = await apiService.get(`/chat/notification-preferences/${leagueId}`);
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get notification preferences');
            }
            return response.data.notificationsEnabled || false;
        } catch (error) {
            console.error('Error getting notification preferences:', error);
            return false;
        }
    }

    /**
     * Update chat notification preferences for a specific league
     */
    static async updateNotificationPreferences(leagueId: string, notificationsEnabled: boolean): Promise<void> {
        try {
            const response = await apiService.put(`/chat/notification-preferences/${leagueId}`, {
                notificationsEnabled
            });
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update notification preferences');
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    /**
     * Get all chat notification preferences for user
     */
    static async getAllNotificationPreferences(): Promise<{ leagueId: number, notificationsEnabled: boolean }[]> {
        try {
            const response = await apiService.get('/chat/notification-preferences');
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to get notification preferences');
            }
            return response.data.preferences || [];
        } catch (error) {
            console.error('Error getting all notification preferences:', error);
            return [];
        }
    }

    /**
     * Get league channels (via secure backend API)
     * Note: This would need to be implemented in the backend
     */
    static async getLeagueChannels(_leagueId: string): Promise<ChatChannel[]> {
        try {
            // TODO: Implement backend endpoint for getting league channels
            // For now, return empty array until backend endpoint is created
            console.warn('getLeagueChannels not yet implemented in backend API');
            return [];
        } catch (error) {
            console.error('Error getting league channels:', error);
            throw error;
        }
    }

    /**
     * Create a default channel for a league (via secure backend API)
     * Note: This would need to be implemented in the backend
     */
    static async createDefaultChannel(_leagueId: string, _leagueName: string): Promise<string> {
        try {
            // TODO: Implement backend endpoint for creating default channels
            // For now, throw error until backend endpoint is created
            throw new Error('createDefaultChannel not yet implemented in backend API');
        } catch (error) {
            console.error('Error creating default channel:', error);
            throw error;
        }
    }

    /**
     * Update user's online status (via secure WebSocket or REST API)
     */
    static async updateUserStatus(userId: string, isOnline: boolean, userInfo?: { name?: string; email?: string }): Promise<void> {
        try {
            if (secureWebSocketService.isConnected()) {
                // Send user status update via WebSocket
                secureWebSocketService.send({
                    type: 'user_status_update',
                    userId: userId,
                    isOnline: isOnline,
                    userInfo: userInfo
                });
            } else {
                // Fallback to REST API if WebSocket is not available
                await chatAPI.updateStatus(isOnline);
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            // Don't throw error to prevent breaking the chat functionality
        }
    }

    /**
     * Create or update chat user profile (via secure backend API)
     * Note: This would need to be implemented in the backend
     */
    static async createChatUser(_userData: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        leagues: string[];
    }): Promise<void> {
        try {
            // TODO: Implement backend endpoint for creating chat users
            // For now, do nothing until backend endpoint is created
            console.warn('createChatUser not yet implemented in backend API');
        } catch (error) {
            console.error('Error creating chat user:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time messages for a league (via secure backend API)
     */
    static async subscribeToLeagueMessages(
        leagueId: string,
        channelId?: string,
        callback?: (messages: ChatMessage[]) => void
    ): Promise<() => void> {
        try {
            // First, load existing messages from the database
            let existingMessages: ChatMessage[] = [];
            try {
                existingMessages = await SecureChatService.getMessages(leagueId, channelId);
            } catch (error) {
                console.error('Error loading existing messages:', error);
                throw error;
            }

            // Call the callback with existing messages to populate the chat
            if (callback && existingMessages.length > 0) {
                callback(existingMessages);
            } else if (callback) {
                callback([]);
            }

            // Set up WebSocket callbacks for new messages
            secureWebSocketService.setCallbacks({
                onMessage: (message: ChatMessage) => {
                    // Append new message to existing messages instead of replacing them
                    if (callback) {
                        // We need to get the current messages and append the new one
                        // Since we can't access the current state here, we'll use a different approach
                        // The component should handle appending new messages to its state
                        callback([message]);
                    }
                },
                onError: (error: string) => {
                    console.error('WebSocket error in message subscription:', error);
                }
            });

            // Join the league's chat room
            secureWebSocketService.joinLeague(leagueId);

            // Return unsubscribe function
            return () => {
                secureWebSocketService.leaveLeague(leagueId);
            };
        } catch (error) {
            console.error('Error setting up message subscription:', error);
            return () => { };
        }
    }

    /**
     * Get initial list of online users for a league
     */
    static async getOnlineUsers(leagueId: string): Promise<ChatUser[]> {
        try {
            const response = await chatAPI.getOnlineUsers(parseInt(leagueId));

            if (response.data && response.data.success && Array.isArray(response.data.onlineUsers)) {
                return response.data.onlineUsers.map((user: any) => ({
                    id: user.id.toString(),
                    name: user.name || user.email || 'Unknown User',
                    email: user.email || '',
                    avatar: user.avatar,
                    isOnline: user.isOnline,
                    lastSeen: new Date(user.lastSeen),
                    leagues: [leagueId]
                }));
            }

            return [];
        } catch (error) {
            console.error('Error getting online users:', error);
            return [];
        }
    }

    /**
     * Subscribe to online users for a league (via secure WebSocket)
     */
    static async subscribeToOnlineUsers(
        leagueId: string,
        callback: (users: ChatUser | ChatUser[]) => void
    ): Promise<() => void> {
        try {
            // First, get the initial list of online users
            const initialUsers = await SecureChatService.getOnlineUsers(leagueId);
            if (initialUsers.length > 0) {
                callback(initialUsers);
            }

            // Set up WebSocket callbacks for user events
            secureWebSocketService.setCallbacks({
                onUserJoined: (user: ChatUser | ChatUser[]) => {
                    // Handle user joined event - can be single user or array of users
                    callback(user);
                },
                onUserLeft: (userId: string) => {
                    // Handle user left event - send user object with isOnline: false for removal
                    callback({ id: userId, name: '', email: '', isOnline: false, lastSeen: new Date(), leagues: [] } as ChatUser);
                },
                onError: (error: string) => {
                    console.error('WebSocket error in user subscription:', error);
                }
            });

            // Join the league's chat room
            secureWebSocketService.joinLeague(leagueId);

            // Return unsubscribe function
            return () => {
                secureWebSocketService.leaveLeague(leagueId);
            };
        } catch (error) {
            console.error('Error setting up online users subscription:', error);
            return () => { };
        }
    }

    /**
     * Initialize WebSocket connection
     */
    static async initializeWebSocket(): Promise<void> {
        try {
            await secureWebSocketService.connect();
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            throw error;
        }
    }

    /**
     * Disconnect WebSocket connection
     */
    static disconnectWebSocket(): void {
        secureWebSocketService.disconnect();
    }

    /**
     * Check if WebSocket is connected
     */
    static isWebSocketConnected(): boolean {
        return secureWebSocketService.isConnected();
    }

    /**
     * Update authentication token for WebSocket
     */
    static updateWebSocketToken(token: string): void {
        secureWebSocketService.updateToken(token);
    }
}
