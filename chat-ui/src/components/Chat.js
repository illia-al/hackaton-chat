import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ContactsList from './ContactsList';
import GroupChatsList from './GroupChatsList';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall } from '../config/api';
import './Chat.css';

function Chat({ user, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [allMessages, setAllMessages] = useState({}); // Store messages per contact/group
    const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'groups'
    const [groupSubscriptions, setGroupSubscriptions] = useState(new Map()); // Track group subscriptions
    const selectedContactRef = useRef(null);
    const selectedGroupRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Use global notification system
    const { showNotification } = useNotifications();

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Keep refs in sync with state
    useEffect(() => {
        selectedContactRef.current = selectedContact;
        selectedGroupRef.current = selectedGroup;
    }, [selectedContact, selectedGroup]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load user groups
    const loadGroups = async () => {
        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.USER_GROUPS(user.username));
            if (response.ok) {
                const groupsData = await response.json();
                setGroups(groupsData);
                return groupsData;
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        }
        return [];
    };

    // Subscribe to group topics
    const subscribeToGroups = (client, userGroups) => {
        const newSubscriptions = new Map();
        
        userGroups.forEach(group => {
            const subscription = client.subscribe(`/topic/group.${group.id}`, (message) => {
                const newMessage = JSON.parse(message.body);
                const groupKey = `group_${group.id}`;
                
                setAllMessages(prev => ({
                    ...prev,
                    [groupKey]: [...(prev[groupKey] || []), newMessage]
                }));
                
                // Update current messages if this group is selected
                if (selectedGroupRef.current === groupKey) {
                    setMessages(prev => [...prev, newMessage]);
                }
            });
            newSubscriptions.set(group.id, subscription);
        });
        
        setGroupSubscriptions(newSubscriptions);
    };

    // Unsubscribe from all group topics
    const unsubscribeFromGroups = () => {
        groupSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        setGroupSubscriptions(new Map());
    };

    useEffect(() => {
        if (user) {
            // Load existing contacts and groups
            loadContacts();

            const client = new Client({
                webSocketFactory: () => new SockJS(API_ENDPOINTS.SOCKJS),
                onConnect: async () => {
                    console.log('Connected to WebSocket');
                    
                    // Main subscription for user direct messages
                    client.subscribe(`/queue/messages-${user.username}`, (message) => {
                        const newMessage = JSON.parse(message.body);
                        
                        // Add message to appropriate conversation
                        const contactUsername = newMessage.sender.username === user.username 
                            ? newMessage.receiver.username 
                            : newMessage.sender.username;
                        
                        setAllMessages(prev => ({
                            ...prev,
                            [contactUsername]: [...(prev[contactUsername] || []), newMessage]
                        }));
                        
                        // Update current messages if this contact is selected
                        if (selectedContactRef.current === contactUsername) {
                            setMessages(prev => [...prev, newMessage]);
                        }
                    });
                    
                    // Subscribe to notifications
                    client.subscribe(`/queue/notifications-${user.username}`, (notification) => {
                        const notificationData = JSON.parse(notification.body);
                        
                        if (notificationData.type === 'GROUP_CREATED') {
                            // Update groups list when a new group is created or user is added to a group
                            const newGroup = {
                                id: notificationData.groupId,
                                name: notificationData.groupName,
                                ownerUsername: notificationData.ownerUsername
                            };
                            
                            setGroups(prev => {
                                // Check if group already exists to avoid duplicates
                                const exists = prev.some(group => group.id === newGroup.id);
                                if (!exists) {
                                    // Subscribe to the new group's messages
                                    const subscription = client.subscribe(`/topic/group.${newGroup.id}`, (message) => {
                                        const newMessage = JSON.parse(message.body);
                                        const groupKey = `group_${newGroup.id}`;
                                        
                                        setAllMessages(prev => ({
                                            ...prev,
                                            [groupKey]: [...(prev[groupKey] || []), newMessage]
                                        }));
                                        
                                        // Update current messages if this group is selected
                                        if (selectedGroupRef.current === groupKey) {
                                            setMessages(prev => [...prev, newMessage]);
                                        }
                                    });
                                    
                                    // Update group subscriptions
                                    setGroupSubscriptions(prevSubs => {
                                        const newSubs = new Map(prevSubs);
                                        newSubs.set(newGroup.id, subscription);
                                        return newSubs;
                                    });
                                    
                                    // Show appropriate notification
                                    if (notificationData.ownerUsername === user.username) {
                                        showNotification(`Group "${newGroup.name}" created successfully!`, 'success');
                                    } else {
                                        showNotification(`You were added to group: ${newGroup.name}`, 'success');
                                    }
                                    
                                    return [...prev, newGroup];
                                }
                                return prev;
                            });
                        } else if (notificationData.type === 'GROUP_REMOVED') {
                            // Update groups list when user is removed from a group
                            const removedGroupId = notificationData.groupId;
                            const groupKey = `group_${removedGroupId}`;
                            
                            setGroups(prev => {
                                const updatedGroups = prev.filter(group => group.id !== removedGroupId);
                                
                                // Unsubscribe from the group's WebSocket topic
                                const subscription = groupSubscriptions.get(removedGroupId);
                                if (subscription) {
                                    subscription.unsubscribe();
                                    setGroupSubscriptions(prevSubs => {
                                        const newSubs = new Map(prevSubs);
                                        newSubs.delete(removedGroupId);
                                        return newSubs;
                                    });
                                }
                                
                                // Clear selection if removed group was selected
                                if (selectedGroup === groupKey) {
                                    setSelectedGroup(null);
                                    setSelectedGroupInfo(null);
                                    setMessages([]);
                                }
                                
                                showNotification(`You were removed from group: ${notificationData.groupName}`, 'info');
                                return updatedGroups;
                            });
                        } else if (notificationData.type === 'CONTACT_ADDED') {
                            // Update contacts list when a new contact is added
                            const newContactUsername = notificationData.contactUsername;
                            
                            setContacts(prev => {
                                // Check if contact already exists to avoid duplicates
                                if (!prev.includes(newContactUsername)) {
                                    showNotification(`${newContactUsername} added you as a contact!`, 'success');
                                    return [...prev, newContactUsername];
                                }
                                return prev;
                            });
                        } else if (notificationData.type === 'CONTACT_REMOVED') {
                            // Update contacts list when a contact is removed
                            const removedContactUsername = notificationData.contactUsername;
                            
                            setContacts(prev => {
                                const updatedContacts = prev.filter(contact => contact !== removedContactUsername);
                                
                                // Clear selection if removed contact was selected
                                if (selectedContact === removedContactUsername) {
                                    setSelectedContact(null);
                                    setMessages([]);
                                }
                                
                                showNotification(`${removedContactUsername} removed you from their contacts`, 'info');
                                return updatedContacts;
                            });
                        }
                    });
                    
                    // Subscribe to error queue
                    client.subscribe(`/user/${user.username}/queue/errors`, (error) => {
                        console.error('WebSocket error:', error.body);
                        showNotification(`Error: ${error.body}`, 'error');
                    });

                    // Load and subscribe to groups
                    const userGroups = await loadGroups();
                    if (userGroups.length > 0) {
                        subscribeToGroups(client, userGroups);
                    }
                },
                onDisconnect: () => {
                    console.log('Disconnected from WebSocket');
                    unsubscribeFromGroups();
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                },
            });

            client.activate();
            setStompClient(client);

            return () => {
                unsubscribeFromGroups();
                client.deactivate();
            };
        }
    }, [user, showNotification]);

    // Update group subscriptions when groups change
    useEffect(() => {
        if (stompClient && stompClient.connected && groups.length > 0) {
            // Unsubscribe from old subscriptions
            unsubscribeFromGroups();
            // Subscribe to current groups
            subscribeToGroups(stompClient, groups);
        }
    }, [groups, stompClient]);

    const loadContacts = async () => {
        try {
            const response = await apiCall(API_ENDPOINTS.CONTACTS(user.username));
            if (response.ok) {
                const contactsData = await response.json();
                setContacts(contactsData.map(contact => contact.username));
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    const loadConversation = async (contactUsername) => {
        try {
            const response = await apiCall(API_ENDPOINTS.CHAT_MESSAGES(user.username, contactUsername));
            if (response.ok) {
                const conversationMessages = await response.json();
                setAllMessages(prev => ({
                    ...prev,
                    [contactUsername]: conversationMessages
                }));
                setMessages(conversationMessages);
            } else {
                console.error('Failed to load conversation');
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            setMessages([]);
        }
    };

    const loadGroupConversation = async (groupId) => {
        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.MESSAGES(groupId));
            if (response.ok) {
                const groupMessages = await response.json();
                const groupKey = `group_${groupId}`;
                setAllMessages(prev => ({
                    ...prev,
                    [groupKey]: groupMessages
                }));
                setMessages(groupMessages);
            } else {
                console.error('Failed to load group conversation');
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading group conversation:', error);
            setMessages([]);
        }
    };

    const handleContactSelect = (contactUsername) => {
        setSelectedContact(contactUsername);
        setSelectedGroup(null);
        setSelectedGroupInfo(null);
        
        // Load conversation if not already loaded
        if (!allMessages[contactUsername]) {
            loadConversation(contactUsername);
        } else {
            setMessages(allMessages[contactUsername]);
        }
    };

    const handleGroupSelect = (groupKey, groupInfo) => {
        setSelectedGroup(groupKey);
        setSelectedGroupInfo(groupInfo);
        setSelectedContact(null);
        
        const groupId = groupKey.replace('group_', '');
        
        // Load group conversation if not already loaded
        if (!allMessages[groupKey]) {
            loadGroupConversation(groupId);
        } else {
            setMessages(allMessages[groupKey]);
        }
    };

    // Handle contact removal - need to clear selection if removed contact was selected
    const handleContactRemoval = (removedContactUsername) => {
        if (selectedContact === removedContactUsername) {
            setSelectedContact(null);
            setMessages([]);
        }
    };

    // Handle group removal - need to clear selection if removed group was selected
    const handleGroupRemoval = (removedGroupKey) => {
        if (selectedGroup === removedGroupKey) {
            setSelectedGroup(null);
            setSelectedGroupInfo(null);
            setMessages([]);
        }
        // Refresh groups to update subscriptions
        loadGroups().then(updatedGroups => {
            setGroups(updatedGroups);
        });
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        if (selectedContact) {
            // Send direct message
            const message = {
                senderUsername: user.username,
                receiverUsername: selectedContact,
                content: newMessage,
            };

            if (stompClient && stompClient.connected) {
                stompClient.publish({
                    destination: '/app/chat.direct',
                    body: JSON.stringify(message),
                });
            } else {
                console.error('WebSocket not connected!');
                showNotification('Connection error. Please refresh the page.', 'error');
            }
        } else if (selectedGroup && selectedGroupInfo) {
            // Send group message
            const groupId = selectedGroup.replace('group_', '');
            const message = {
                senderUsername: user.username,
                groupId: parseInt(groupId),
                content: newMessage,
            };

            if (stompClient && stompClient.connected) {
                stompClient.publish({
                    destination: '/app/chat.group',
                    body: JSON.stringify(message),
                });
            } else {
                console.error('WebSocket not connected!');
                showNotification('Connection error. Please refresh the page.', 'error');
            }
        }

        setNewMessage('');
    };
    
    // Helper function to get user initials for avatar (for chat header)
    const getUserInitials = (username) => {
        return username.substring(0, 2).toUpperCase();
    };

    const getGroupInitials = (groupName) => {
        return groupName.substring(0, 2).toUpperCase();
    };

    const getCurrentChatName = () => {
        if (selectedContact) return selectedContact;
        if (selectedGroupInfo) return selectedGroupInfo.name;
        return '';
    };

    const getCurrentChatInitials = () => {
        if (selectedContact) return getUserInitials(selectedContact);
        if (selectedGroupInfo) return getGroupInitials(selectedGroupInfo.name);
        return '';
    };

    return (
        <div className="App">
            <div className="chat-container">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <div className="welcome-message">
                            <p>Welcome, {user.username}!</p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="logout-button"
                        >
                            Logout
                        </button>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        <button 
                            className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('contacts')}
                        >
                            Direct Messages
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            Group Chats
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'contacts' ? (
                            <ContactsList
                                user={user}
                                contacts={contacts}
                                setContacts={setContacts}
                                selectedContact={selectedContact}
                                onContactSelect={handleContactSelect}
                                onContactRemoval={handleContactRemoval}
                                allMessages={allMessages}
                            />
                        ) : (
                            <GroupChatsList
                                user={user}
                                selectedGroup={selectedGroup}
                                onGroupSelect={handleGroupSelect}
                                onGroupRemoval={handleGroupRemoval}
                                allMessages={allMessages}
                                groups={groups}
                                setGroups={setGroups}
                            />
                        )}
                    </div>
                </div>
                
                <div className="chat-window">
                    {(selectedContact || selectedGroup) ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-avatar">
                                    {getCurrentChatInitials()}
                                </div>
                                <div className="chat-header-info">
                                    <h3>{getCurrentChatName()}</h3>
                                    {selectedGroupInfo && (
                                        <span className="group-indicator">Group Chat</span>
                                    )}
                                </div>
                            </div>
                            <div className="messages">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`message ${
                                            message.sender.username === user.username ? 'sent' : 'received'
                                        }`}
                                    >
                                        <div className="message-bubble">
                                            {selectedGroup && message.sender.username !== user.username && (
                                                <div className="message-sender">
                                                    {message.sender.username}
                                                </div>
                                            )}
                                            <div className="message-content">{message.content}</div>
                                            <div className="message-time">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Invisible element to scroll to */}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="message-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            {activeTab === 'contacts' 
                                ? 'Select a contact to start chatting' 
                                : 'Select a group to start chatting'
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat; 