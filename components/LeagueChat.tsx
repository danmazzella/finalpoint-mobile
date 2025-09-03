import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';
import { SecureChatService } from '../src/services/secureChatService';
import { ChatMessage } from '../src/types/chat';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { lightColors, darkColors } from '../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '../src/services/apiService';

interface LeagueChatProps {
    leagueId: string;
    leagueName: string;
    channelId?: string;
}

export const LeagueChat: React.FC<LeagueChatProps> = ({
    leagueId,
    leagueName,
    channelId = null
}) => {
    const { user } = useAuth();
    const { resolvedTheme } = useTheme();
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [showOnlineUsers, setShowOnlineUsers] = useState(false);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<ScrollView>(null);

    // Get screen width for proper bubble sizing
    const screenWidth = Dimensions.get('window').width;
    const bubbleMaxWidth = screenWidth * 0.85; // 85% of screen width



    // Get current theme colors
    const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;

    // Safe date formatting function
    const formatTime = (date: Date | string | any) => {
        // Convert to Date object if it's a string or Firestore timestamp
        let dateObj: Date;

        if (date && typeof date === 'object' && 'toDate' in date) {
            // Firestore timestamp
            dateObj = date.toDate();
        } else if (typeof date === 'string') {
            dateObj = new Date(date);
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            dateObj = new Date();
        }

        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
            return 'Invalid date';
        }

        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Create dynamic styles with screen width
    const dynamicStyles = StyleSheet.create({
        bubble: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 18,
            maxWidth: bubbleMaxWidth,
            marginVertical: 1,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
    });

    // Convert ChatMessage to IMessage format for GiftedChat
    const convertToIMessage = (chatMessage: ChatMessage): IMessage => {
        // Ensure createdAt is a proper Date object using safe conversion
        let createdAt: Date;

        if (chatMessage.createdAt && typeof chatMessage.createdAt === 'object' && 'toDate' in chatMessage.createdAt) {
            // Firestore Timestamp
            createdAt = (chatMessage.createdAt as any).toDate();
        } else if (typeof chatMessage.createdAt === 'string') {
            // String timestamp
            createdAt = new Date(chatMessage.createdAt);
        } else if (chatMessage.createdAt instanceof Date) {
            createdAt = chatMessage.createdAt;
        } else {
            // Fallback to current time
            createdAt = new Date();
        }

        // Validate the date
        if (isNaN(createdAt.getTime())) {
            createdAt = new Date();
        }

        return {
            _id: chatMessage.id,
            text: chatMessage.text,
            createdAt: createdAt,
            user: {
                _id: chatMessage.user._id,
                name: chatMessage.user.name || 'Unknown User',
                avatar: chatMessage.user.avatar,
            },
            image: chatMessage.image,
            system: chatMessage.system,
            // Add custom data for message status (using type assertion)
            ...(chatMessage.status && { status: chatMessage.status }),
            ...(chatMessage.tempId && { tempId: chatMessage.tempId }),
        } as IMessage & { status?: string; tempId?: string };
    };

    // Load messages when component mounts
    useEffect(() => {
        if (!user || !leagueId) return;

        let unsubscribe: (() => void) | undefined;
        let isInitialLoad = true;

        const setupSubscription = async () => {
            try {
                unsubscribe = await SecureChatService.subscribeToLeagueMessages(
                    leagueId,
                    channelId || undefined,
                    (chatMessages: ChatMessage[]) => {
                        if (isInitialLoad) {
                            // Initial load - replace all messages
                            const iMessages = chatMessages.map(convertToIMessage);
                            // Sort messages in chronological order (oldest first) so newest appear at bottom
                            const sortedMessages = iMessages.sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                            );
                            setMessages(sortedMessages);
                            setLoading(false);
                            isInitialLoad = false;
                        } else {
                            // New message received - append to existing messages
                            setMessages(prevMessages => {
                                // Check if this message already exists to avoid duplicates
                                const newMessage = chatMessages[0];
                                if (!newMessage) return prevMessages;

                                // Check for duplicate by ID
                                const messageExistsById = prevMessages.some(msg => msg._id === newMessage.id);
                                if (messageExistsById) {
                                    return prevMessages;
                                }

                                // Check for duplicate by content and user (for messages we just sent)
                                // This handles the case where server message doesn't have tempId
                                const messageExistsByContent = prevMessages.some(msg =>
                                    msg.text === newMessage.text &&
                                    msg.user._id === newMessage.user._id &&
                                    Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 5000 // Within 5 seconds
                                );

                                if (messageExistsByContent) {
                                    // Replace the temporary message with the real one from server
                                    const newIMessage = convertToIMessage({
                                        ...newMessage,
                                        status: 'sent' // Mark as sent when received from server
                                    });
                                    return prevMessages.map(msg =>
                                        msg.text === newMessage.text &&
                                            msg.user._id === newMessage.user._id &&
                                            Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 5000
                                            ? newIMessage : msg
                                    );
                                }

                                // Convert new messages to IMessage format
                                const newIMessages = chatMessages.map(convertToIMessage);

                                // Add new messages at the end so they appear at the bottom
                                return [...prevMessages, ...newIMessages];
                            });
                        }
                    }
                );

                // Mark messages as read when chat is viewed
                try {
                    await chatAPI.markMessagesAsRead(parseInt(leagueId));
                } catch (error) {
                    console.error('Failed to mark messages as read:', error);
                }
            } catch (error) {
                console.error('Failed to set up chat subscription:', error);
                setLoading(false);
            }
        };

        setupSubscription();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [leagueId, channelId, user]);

    // Update user online status and subscribe to online users
    useEffect(() => {
        if (!user || !leagueId) return;

        // Set user online when component mounts
        SecureChatService.updateUserStatus(user.id.toString(), true, {
            name: user.name || user.email,
            email: user.email
        });

        // Add current user to online list immediately (temporary solution)
        setOnlineUsers([{
            id: user.id.toString(),
            name: user.name || user.email || 'You',
            isOnline: true
        }]);

        // Subscribe to online users
        const setupOnlineUsers = async () => {
            try {
                const unsubscribeOnlineUsers = await SecureChatService.subscribeToOnlineUsers(
                    leagueId,
                    (users) => {
                        setOnlineUsers(prevUsers => {
                            // Handle different types of updates
                            if (Array.isArray(users)) {
                                // If we get an array, it's a full list update
                                // Merge with current user if not already included
                                const currentUser = {
                                    id: user.id.toString(),
                                    name: user.name || user.email || 'You',
                                    isOnline: true
                                };
                                const hasCurrentUser = users.some(u => u.id === currentUser.id);
                                return hasCurrentUser ? users : [currentUser, ...users];
                            } else {
                                // If we get a single user, it's either a join or leave event
                                const newUser = users;
                                if (newUser.isOnline) {
                                    // User joined - add if not exists
                                    const exists = prevUsers.some(u => u.id === newUser.id);
                                    if (!exists) {
                                        return [...prevUsers, newUser];
                                    }
                                } else {
                                    // User left - remove from list (but keep current user)
                                    return prevUsers.filter(u => u.id !== newUser.id);
                                }
                                return prevUsers;
                            }
                        });
                    }
                );
                return unsubscribeOnlineUsers;
            } catch (error) {
                console.error('Error setting up online users subscription:', error);
                return () => { };
            }
        };

        let unsubscribeOnlineUsers: (() => void) | undefined;
        setupOnlineUsers().then(unsubscribe => {
            unsubscribeOnlineUsers = unsubscribe;
        });

        // Set user offline when component unmounts
        return () => {
            SecureChatService.updateUserStatus(user.id.toString(), false);
            if (unsubscribeOnlineUsers) {
                unsubscribeOnlineUsers();
            }
        };
    }, [user, leagueId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                messagesEndRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    // Send a new message
    // Function to refresh online users list
    const refreshOnlineUsers = useCallback(async () => {
        try {
            // Use the proper getOnlineUsers endpoint
            const onlineUsers = await SecureChatService.getOnlineUsers(leagueId);

            // Ensure current user is included in the online users list
            const currentUser = {
                id: user?.id.toString() || '',
                name: user?.name || user?.email || 'You',
                email: user?.email || '',
                isOnline: true,
                lastSeen: new Date(),
                leagues: [leagueId]
            };

            const hasCurrentUser = onlineUsers.some((u: any) => u.id === currentUser.id);
            const updatedUsers = hasCurrentUser ? onlineUsers : [currentUser, ...onlineUsers];

            setOnlineUsers(updatedUsers);
        } catch (error) {
            console.error('Error refreshing online users:', error);
            // Don't show error to user as this is a background operation
        }
    }, [leagueId, user]);

    const sendMessage = useCallback(async () => {
        if (!user || !inputText.trim()) return;

        const messageText = inputText.trim();
        setInputText(''); // Clear input immediately

        try {
            const sentMessage = await SecureChatService.sendMessage(leagueId, {
                text: messageText,
                user: {
                    _id: user.id.toString(),
                    name: user.name || user.email,
                    avatar: user.avatar,
                },
                leagueId,
                channelId: channelId || undefined,
            });

            // Only add to local state if using REST API (not WebSocket)
            // WebSocket messages will come back through the subscription
            if (sentMessage.status === 'sent') {
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const convertedMessage = convertToIMessage(sentMessage);
                    newMessages.push(convertedMessage);
                    return newMessages;
                });
            } else if (sentMessage.status === 'sending') {
                // For WebSocket, add the temporary message
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const convertedMessage = convertToIMessage(sentMessage);
                    newMessages.push(convertedMessage);
                    return newMessages;
                });
            }

            // Refresh online users list after sending message to ensure up-to-date status
            await refreshOnlineUsers();
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
            setInputText(messageText); // Restore text on error
        }
    }, [user, leagueId, channelId, inputText, refreshOnlineUsers]);

    // Render a single message
    const renderMessage = (message: IMessage) => {
        const isOwnMessage = message.user._id === user?.id.toString();

        return (
            <View key={message._id} style={[
                themeStyles.messageContainer,
                isOwnMessage ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
            ]}>
                {/* Show sender name and avatar for incoming messages */}
                {!isOwnMessage && (
                    <View style={themeStyles.senderInfoContainer}>
                        <View style={themeStyles.avatarContainer}>
                            <View style={themeStyles.avatar}>
                                <Text style={themeStyles.avatarText}>
                                    {message.user.name ? message.user.name.charAt(0).toUpperCase() : '?'}
                                </Text>
                            </View>
                        </View>
                        <Text style={themeStyles.usernameText}>
                            {message.user.name || 'Unknown User'}
                        </Text>
                    </View>
                )}

                <View style={[
                    dynamicStyles.bubble,
                    isOwnMessage ? themeStyles.ownBubble : themeStyles.otherBubble
                ]}>
                    <Text style={[
                        themeStyles.bubbleText,
                        isOwnMessage ? themeStyles.ownBubbleText : themeStyles.otherBubbleText
                    ]}>
                        {message.text}
                    </Text>
                </View>

                {/* Message status and time row */}
                <View style={[
                    themeStyles.messageFooter,
                    isOwnMessage ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                ]}>
                    <Text style={[
                        themeStyles.timeText,
                        isOwnMessage ? themeStyles.ownTimeText : themeStyles.otherTimeText
                    ]}>
                        {formatTime(message.createdAt)}
                    </Text>

                    {/* Status indicator for own messages */}
                    {isOwnMessage && (message as any).status && (
                        <View style={themeStyles.statusContainer}>
                            {(message as any).status === 'sending' && (
                                <Ionicons name="time-outline" size={12} color={currentColors.textSecondary} />
                            )}
                            {(message as any).status === 'sent' && (
                                <Ionicons name="checkmark" size={12} color={currentColors.textSecondary} />
                            )}
                            {(message as any).status === 'failed' && (
                                <TouchableOpacity onPress={() => {
                                    // TODO: Implement retry functionality
                                    console.log('Retry message:', message._id);
                                }}>
                                    <Ionicons name="alert-circle" size={12} color="#ff4444" />
                                </TouchableOpacity>
                            )}
                            {(message as any).status === 'queued' && (
                                <Ionicons name="cloud-upload-outline" size={12} color={currentColors.textSecondary} />
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // Create theme-aware styles
    const themeStyles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        chatContainer: {
            flex: 1,
            backgroundColor: currentColors.backgroundPrimary,
        },
        messagesList: {
            flex: 1,
            paddingHorizontal: 8,
        },
        messagesContent: {
            paddingVertical: 16,
            flexGrow: 1,
        },
        inputArea: {
            backgroundColor: currentColors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: currentColors.borderLight,
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: currentColors.backgroundPrimary,
        },
        loadingText: {
            color: currentColors.textPrimary,
        },
        onlineUsersHeader: {
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            paddingHorizontal: 16,
            paddingVertical: 8,
        },
        onlineUsersText: {
            marginLeft: 8,
            marginRight: 4,
            fontSize: 14,
            color: currentColors.buttonPrimary,
            fontWeight: '500',
        },
        onlineUsersContainer: {
            backgroundColor: currentColors.cardBackground,
            borderBottomWidth: 1,
            borderBottomColor: currentColors.borderLight,
            paddingVertical: 12,
        },
        noOnlineUsers: {
            textAlign: 'center',
            color: currentColors.textSecondary,
            fontSize: 14,
            fontStyle: 'italic',
            paddingVertical: 20,
        },
        onlineUserAvatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: currentColors.buttonPrimary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 6,
            position: 'relative',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
        },
        onlineUserInitial: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
        },
        onlineUserName: {
            fontSize: 12,
            color: currentColors.textPrimary,
            textAlign: 'center',
            maxWidth: 60,
        },
        systemMessage: {
            alignItems: 'center',
            marginVertical: 10,
            paddingHorizontal: 20,
        },
        systemMessageText: {
            fontSize: 12,
            color: currentColors.textSecondary,
            fontStyle: 'italic',
        },
        textInput: {
            flex: 1,
            fontSize: 16,
            backgroundColor: currentColors.backgroundSecondary,
            color: currentColors.textPrimary,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            borderRadius: 20,
            minHeight: 40,
            maxHeight: 100,
            textAlignVertical: 'top',
        },
        bubble: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 18,
            maxWidth: bubbleMaxWidth,
            minWidth: 80,
            marginVertical: 4,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        ownBubble: {
            backgroundColor: currentColors.buttonPrimary,
            borderBottomRightRadius: 4,
        },
        otherBubble: {
            backgroundColor: currentColors.cardBackground,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
            borderBottomLeftRadius: 4,
        },
        bubbleText: {
            fontSize: 16,
            lineHeight: 22,
            flexShrink: 1,
        },
        ownBubbleText: {
            color: 'white',
        },
        otherBubbleText: {
            color: currentColors.textPrimary,
        },
        timeContainer: {
            marginTop: 4,
            paddingHorizontal: 12,
            paddingVertical: 2,
        },
        timeText: {
            fontSize: 12,
            fontWeight: '500',
        },
        ownTimeText: {
            color: currentColors.textSecondary,
            textAlign: 'right',
        },
        otherTimeText: {
            color: currentColors.textTertiary,
            textAlign: 'left',
        },
        messageContainer: {
            marginVertical: 4,
            paddingHorizontal: 8,
            alignSelf: 'flex-start',
            maxWidth: '100%',
            minWidth: 0,
        },
        senderInfoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
            marginLeft: 4,
        },
        usernameText: {
            fontSize: 12,
            fontWeight: '600',
            color: currentColors.textSecondary,
            marginBottom: 4,
            marginLeft: 8,
        },
        avatarContainer: {
            marginRight: 8,
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: currentColors.buttonPrimary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        avatarText: {
            color: 'white',
            fontSize: 14,
            fontWeight: '600',
        },
        messageFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 2,
        },
        statusContainer: {
            marginLeft: 4,
            justifyContent: 'center',
            alignItems: 'center',
        },
        dayContainer: {
            alignItems: 'center',
            marginVertical: 10,
        },
        dayText: {
            fontSize: 12,
            color: currentColors.textSecondary,
            backgroundColor: currentColors.backgroundSecondary,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
        },
        inputToolbar: {
            backgroundColor: currentColors.cardBackground,
            borderTopWidth: 1,
            borderTopColor: currentColors.borderLight,
            paddingHorizontal: 8,
            paddingVertical: 8,
            minHeight: 60,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'transparent',
            gap: 12,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
        },
        sendButtonEnabled: {
            backgroundColor: currentColors.buttonPrimary,
        },
        sendButtonDisabled: {
            backgroundColor: currentColors.backgroundSecondary,
            borderWidth: 1,
            borderColor: currentColors.borderLight,
        },
        sendButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
        },
    });

    if (loading) {
        return (
            <View style={themeStyles.loadingContainer}>
                <Text style={themeStyles.loadingText}>Loading chat...</Text>
            </View>
        );
    }

    return (
        <View style={themeStyles.container}>
            {/* Online Users Header */}
            <View style={themeStyles.onlineUsersHeader}>
                <TouchableOpacity
                    style={styles.onlineUsersButton}
                    onPress={() => setShowOnlineUsers(!showOnlineUsers)}
                >
                    <Ionicons name="people" size={20} color={currentColors.buttonPrimary} />
                    <Text style={themeStyles.onlineUsersText}>
                        {onlineUsers.length} online
                    </Text>
                    <Ionicons
                        name={showOnlineUsers ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={currentColors.buttonPrimary}
                    />
                </TouchableOpacity>
            </View>

            {/* Online Users List */}
            {showOnlineUsers && (
                <View style={themeStyles.onlineUsersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.onlineUsersScroll}>
                        {onlineUsers.length === 0 ? (
                            <Text style={themeStyles.noOnlineUsers}>No one online</Text>
                        ) : (
                            onlineUsers.map((onlineUser) => (
                                <View key={onlineUser.id} style={styles.onlineUserItem}>
                                    <View style={themeStyles.onlineUserAvatar}>
                                        <Text style={themeStyles.onlineUserInitial}>
                                            {onlineUser.name?.charAt(0)?.toUpperCase() || '?'}
                                        </Text>
                                        <View style={styles.onlineIndicator} />
                                    </View>
                                    <Text style={themeStyles.onlineUserName} numberOfLines={1}>
                                        {onlineUser.name || 'Unknown User'}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Chat Messages */}
            <KeyboardAvoidingView
                style={themeStyles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <ScrollView
                    ref={messagesEndRef}
                    style={themeStyles.messagesList}
                    contentContainerStyle={themeStyles.messagesContent}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map(renderMessage)}
                </ScrollView>

                {/* Input Area */}
                <View style={themeStyles.inputArea}>
                    <View style={themeStyles.inputContainer}>
                        <TextInput
                            style={themeStyles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder={`Message ${leagueName}...`}
                            placeholderTextColor={currentColors.textSecondary}
                            multiline
                            maxLength={1000}
                            onSubmitEditing={() => {
                                if (inputText.trim()) {
                                    sendMessage();
                                }
                            }}
                            blurOnSubmit={false}
                            returnKeyType="send"
                            enablesReturnKeyAutomatically={true}
                        // onKeyPress={({ nativeEvent }) => {
                        //     if (nativeEvent.key === 'Enter') {
                        //         if (inputText.trim()) {
                        //             sendMessage();
                        //         }
                        //     }
                        // }}
                        />
                        <TouchableOpacity
                            style={[
                                themeStyles.sendButton,
                                inputText.trim().length > 0 ? themeStyles.sendButtonEnabled : themeStyles.sendButtonDisabled
                            ]}
                            onPress={inputText.trim().length > 0 ? sendMessage : undefined}
                            disabled={inputText.trim().length === 0}
                        >
                            <Ionicons
                                name="send"
                                size={20}
                                color={inputText.trim().length > 0 ? "white" : currentColors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    onlineUsersHeader: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    onlineUsersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    onlineUsersText: {
        marginLeft: 8,
        marginRight: 4,
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    onlineUsersContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 12,
    },
    onlineUsersScroll: {
        paddingHorizontal: 16,
    },
    noOnlineUsers: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    onlineUserItem: {
        alignItems: 'center',
        marginRight: 16,
        minWidth: 60,
    },
    onlineUserAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        position: 'relative',
    },
    onlineUserInitial: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: 'white',
    },
    onlineUserName: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        maxWidth: 60,
    },
    systemMessage: {
        alignItems: 'center',
        marginVertical: 10,
        paddingHorizontal: 20,
    },
    systemMessageText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginHorizontal: 10,
        fontSize: 16,
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        maxWidth: '95%',
        marginVertical: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    ownBubble: {
        backgroundColor: '#007AFF',
    },
    otherBubble: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    bubbleText: {
        fontSize: 16,
    },
    ownBubbleText: {
        color: 'white',
    },
    otherBubbleText: {
        color: 'black',
    },
    timeContainer: {
        marginTop: 4,
        paddingHorizontal: 4,
    },
    timeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    ownTimeText: {
        color: '#666',
        textAlign: 'right',
    },
    otherTimeText: {
        color: '#999',
        textAlign: 'left',
    },
    messageContainer: {
        marginVertical: 2,
    },
    senderInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        marginLeft: 4,
    },
    usernameText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
        marginLeft: 4,
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
