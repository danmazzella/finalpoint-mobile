import { useEffect, useState } from 'react';
import { SecureChatService } from '../src/services/secureChatService';
import { useAuth } from '../src/context/AuthContext';

export const useChat = () => {
    const { user } = useAuth();
    const [userLeagues, setUserLeagues] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setUserLeagues([]);
            setLoading(false);
            return;
        }

        const loadUserLeagues = async () => {
            try {
                const leagues = await SecureChatService.getUserLeagues(user.id.toString());
                setUserLeagues(leagues);
            } catch (error) {
                console.error('Error loading user leagues:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserLeagues();
    }, [user]);

    const joinLeague = async (leagueId: string) => {
        if (!user) return false;

        try {
            // Note: League joining should be handled through the leagues API, not chat service
            // This is just for updating the local state after successful league join
            setUserLeagues(prev => [...prev, leagueId]);
            return true;
        } catch (error) {
            console.error('Error joining league:', error);
            return false;
        }
    };

    const leaveLeague = async (leagueId: string) => {
        if (!user) return false;

        try {
            // Note: League leaving should be handled through the leagues API, not chat service
            // This is just for updating the local state after successful league leave
            setUserLeagues(prev => prev.filter(id => id !== leagueId));
            return true;
        } catch (error) {
            console.error('Error leaving league:', error);
            return false;
        }
    };

    const hasLeagueAccess = (leagueId: string) => {
        return userLeagues.includes(leagueId);
    };

    return {
        userLeagues,
        loading,
        joinLeague,
        leaveLeague,
        hasLeagueAccess,
    };
};
