import { ChatMessage, ChatChannel, ChatUser } from '../types/chat';
import { apiService, leaguesAPI } from './apiService';

/**
 * DEPRECATED: This service is being replaced by SecureChatService
 * 
 * ⚠️ SECURITY WARNING: This service contained vulnerabilities:
 * - Direct Firestore access could be manipulated by users
 * - Single validation check could be bypassed
 * - Real-time listeners could access unauthorized data
 * 
 * Use SecureChatService instead for all chat operations.
 */

export class ChatService {
    /**
     * @deprecated - Use SecureChatService.sendMessage() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async sendMessage(
        leagueId: string,
        message: Omit<ChatMessage, 'id' | 'createdAt'>
    ): Promise<string> {
        console.warn('⚠️ DEPRECATED: ChatService.sendMessage() is vulnerable. Use SecureChatService.sendMessage() instead.');

        // Redirect to secure service
        const { SecureChatService } = await import('./secureChatService');
        const result = await SecureChatService.sendMessage(leagueId, message);

        return result.id;
    }

    /**
     * @deprecated - Use SecureChatService.getMessages() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async subscribeToLeagueMessages(
        leagueId: string,
        channelId: string | null = null,
        callback: (messages: ChatMessage[]) => void
    ): Promise<() => void> {
        console.warn('⚠️ DEPRECATED: ChatService.subscribeToLeagueMessages() is vulnerable. Use SecureChatService.getMessages() instead.');

        // For now, return a no-op function
        // Real-time subscriptions should be handled through secure backend WebSocket connections
        return () => { };
    }

    /**
     * @deprecated - Use SecureChatService.getLeagueChannels() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async getLeagueChannels(leagueId: string): Promise<ChatChannel[]> {
        console.warn('⚠️ DEPRECATED: ChatService.getLeagueChannels() is vulnerable. Use SecureChatService.getLeagueChannels() instead.');

        // Redirect to secure service
        const { SecureChatService } = await import('./secureChatService');
        return SecureChatService.getLeagueChannels(leagueId);
    }

    /**
     * @deprecated - Use SecureChatService.createDefaultChannel() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async createDefaultChannel(leagueId: string, leagueName: string): Promise<string> {
        console.warn('⚠️ DEPRECATED: ChatService.createDefaultChannel() is vulnerable. Use SecureChatService.createDefaultChannel() instead.');

        // Redirect to secure service
        const { SecureChatService } = await import('./secureChatService');
        return SecureChatService.createDefaultChannel(leagueId, leagueName);
    }

    /**
     * @deprecated - Use SecureChatService.updateUserStatus() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async updateUserStatus(userId: string, isOnline: boolean, userInfo?: { name?: string; email?: string }): Promise<void> {
        console.warn('⚠️ DEPRECATED: ChatService.updateUserStatus() is vulnerable. Use SecureChatService.updateUserStatus() instead.');

        // Redirect to secure service
        const { SecureChatService } = await import('./secureChatService');
        return SecureChatService.updateUserStatus(userId, isOnline, userInfo);
    }

    /**
     * @deprecated - Use SecureChatService.createChatUser() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async createChatUser(userData: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        leagues: string[];
    }): Promise<void> {
        console.warn('⚠️ DEPRECATED: ChatService.createChatUser() is vulnerable. Use SecureChatService.createChatUser() instead.');

        // Redirect to secure service
        const { SecureChatService } = await import('./secureChatService');
        return SecureChatService.createChatUser(userData);
    }

    /**
     * @deprecated - Use SecureChatService.getUserLeagues() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static async getUserLeagues(userId: string): Promise<string[]> {
        console.warn('⚠️ DEPRECATED: ChatService.getUserLeagues() is vulnerable. Use SecureChatService.getUserLeagues() instead.');

        // Redirect to secure service
        const { SecureChatService } = await import('./secureChatService');
        return SecureChatService.getUserLeagues(userId);
    }

    /**
     * @deprecated - Use SecureChatService.subscribeToOnlineUsers() instead
     * This method is vulnerable to manipulation and should not be used
     */
    static subscribeToOnlineUsers(
        _leagueId: string,
        _callback: (users: ChatUser[]) => void
    ): () => void {
        console.warn('⚠️ DEPRECATED: ChatService.subscribeToOnlineUsers() is vulnerable. Use SecureChatService.subscribeToOnlineUsers() instead.');

        // For now, return a no-op function
        // Real-time subscriptions should be handled through secure backend WebSocket connections
        return () => { };
    }

    /**
     * @deprecated - League membership should be managed through the leagues API, not chat service
     * These methods are removed for security reasons - league membership must be handled server-side
     */
}