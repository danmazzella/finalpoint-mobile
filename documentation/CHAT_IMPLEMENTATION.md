# League Chat Implementation Guide

## Overview

This document describes the Firebase Firestore-based chat system implemented for FinalPoint. The chat system is designed around **league-based messaging**, where each league has its own chat room for members to communicate.

## Architecture

### Database Structure (Firestore)

```
chat_messages/
├── {messageId}/
│   ├── text: string
│   ├── user: { _id, name, avatar }
│   ├── leagueId: string (required)
│   ├── channelId: string (optional)
│   ├── createdAt: timestamp
│   └── system: boolean (optional)

chat_channels/
├── {channelId}/
│   ├── name: string
│   ├── description: string
│   ├── leagueId: string (required)
│   ├── type: 'general' | 'race-discussion' | 'picks' | 'admin'
│   ├── createdAt: timestamp
│   ├── createdBy: string
│   └── memberCount: number

chat_users/
├── {userId}/
│   ├── name: string
│   ├── email: string
│   ├── avatar: string (optional)
│   ├── isOnline: boolean
│   ├── lastSeen: timestamp
│   └── leagues: string[]

league_members/
├── {userId}_{leagueId}/
│   ├── userId: string
│   ├── leagueId: string
│   ├── joinedAt: timestamp
│   └── active: boolean
```

## Features

### ✅ Implemented
- **League-based chat**: Each league has its own chat room
- **Real-time messaging**: Messages appear instantly using Firestore listeners
- **User authentication**: Integrated with existing auth system
- **Online status**: Users show as online/offline
- **Message history**: Last 50 messages per league
- **Cross-platform**: Works on both mobile (React Native) and web (Next.js)
- **Responsive design**: Mobile-first design with web compatibility

### 🔄 Future Enhancements
- **Push notifications**: Chat message notifications
- **File sharing**: Image and document sharing
- **Message reactions**: Emoji reactions to messages
- **Typing indicators**: Show when users are typing
- **Message search**: Search through chat history
- **Channel support**: Multiple channels per league (general, race-discussion, etc.)

## Usage

### Mobile App (React Native)

```tsx
import { LeagueChat } from '../components/LeagueChat';

// In your league screen
<LeagueChat 
    leagueId="league-123" 
    leagueName="My F1 League"
/>
```

### Web App (Next.js)

```tsx
import { LeagueChat } from '../components/LeagueChat';

// In your league page
<LeagueChat 
    leagueId="league-123" 
    leagueName="My F1 League"
/>
```

### Navigation

**Mobile**: Navigate to `/chat/[leagueId]` to open league chat
**Web**: Navigate to `/chat/[leagueId]` to open league chat

## Integration with Existing Systems

### Authentication
- Uses existing user authentication system
- Automatically creates chat user profile on first login
- Syncs user data (name, email, avatar) with chat system

### League Management
- When users join a league, they're automatically added to the chat
- When users leave a league, they're removed from the chat
- League admins can manage chat settings

### Push Notifications
- Integrates with existing push notification system
- Sends notifications for new chat messages
- Respects user notification preferences

## Security Rules (Firestore)

```javascript
// Allow users to read messages only from leagues they're members of
match /chat_messages/{messageId} {
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/league_members/$(request.auth.uid + '_' + resource.data.leagueId));
  
  allow create: if request.auth != null && 
    request.auth.uid == resource.data.user._id &&
    exists(/databases/$(database)/documents/league_members/$(request.auth.uid + '_' + resource.data.leagueId));
}

// Allow users to read channels only from leagues they're members of
match /chat_channels/{channelId} {
  allow read: if request.auth != null && 
    exists(/databases/$(database)/documents/league_members/$(request.auth.uid + '_' + resource.data.leagueId));
}
```

## Performance Considerations

- **Message limits**: Only loads last 50 messages per league
- **Real-time listeners**: Automatically unsubscribe when components unmount
- **Offline support**: Firestore handles offline message queuing
- **Caching**: Firestore automatically caches data for offline access

## Cost Considerations

### Firebase Firestore Free Tier
- **Storage**: 1 GB
- **Reads**: 50,000 per day
- **Writes**: 20,000 per day
- **Deletes**: 20,000 per day

### Estimated Usage
- **Small league (10 users)**: ~100 messages/day = ~200 reads/day
- **Medium league (50 users)**: ~500 messages/day = ~1,000 reads/day
- **Large league (100 users)**: ~1,000 messages/day = ~2,000 reads/day

The free tier should easily handle multiple leagues with active chat usage.

## Troubleshooting

### Common Issues

1. **Messages not appearing**
   - Check if user is a member of the league
   - Verify Firestore security rules
   - Check browser console for errors

2. **Cannot send messages**
   - Verify user authentication
   - Check league membership
   - Ensure Firestore write permissions

3. **Real-time updates not working**
   - Check network connection
   - Verify Firestore listener setup
   - Check for JavaScript errors

### Debug Mode

Enable debug logging by setting:
```javascript
// In your Firebase config
firebase.firestore().settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
```

## Next Steps

1. **Test the implementation** with a small group of users
2. **Add push notifications** for new messages
3. **Implement file sharing** for images and documents
4. **Add message reactions** and typing indicators
5. **Create admin tools** for chat moderation
6. **Add message search** functionality

## Support

For issues or questions about the chat implementation, refer to:
- Firebase Firestore documentation
- React Native Gifted Chat documentation
- FinalPoint API documentation for league management
