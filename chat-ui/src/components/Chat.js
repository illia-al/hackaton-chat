import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { marked } from 'marked';
import ContactsList from './ContactsList';
import GroupChatsList from './GroupChatsList';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall, apiCallMultipart } from '../config/api';
import './Chat.css';

function Chat({ user, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [allMessages, setAllMessages] = useState({}); // Store messages per contact/group
    const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'groups'
    const [groupSubscriptions, setGroupSubscriptions] = useState(new Map()); // Track group subscriptions
    const [isPreviewMode, setIsPreviewMode] = useState(false); // Preview formatted text
    const selectedContactRef = useRef(null);
    const selectedGroupRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const messageInputRef = useRef(null);

    // Use global notification system
    const { showNotification } = useNotifications();

    // Configure marked for safe HTML rendering
    marked.setOptions({
        breaks: true,
        sanitize: false,
        headerIds: false,
        mangle: false
    });

    // Text formatting functions
    const applyFormatting = (formatType) => {
        const textarea = messageInputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = newMessage.substring(start, end);
        
        let formattedText;
        let newCursorPos;
        
        if (formatType === 'bold') {
            if (selectedText) {
                formattedText = `**${selectedText}**`;
                newCursorPos = start + formattedText.length;
            } else {
                formattedText = '****';
                newCursorPos = start + 2; // Position cursor between the asterisks
            }
        } else if (formatType === 'italic') {
            if (selectedText) {
                formattedText = `*${selectedText}*`;
                newCursorPos = start + formattedText.length;
            } else {
                formattedText = '**';
                newCursorPos = start + 1; // Position cursor between the asterisks
            }
        }

        const newText = newMessage.substring(0, start) + formattedText + newMessage.substring(end);
        setNewMessage(newText);

        // Set cursor position after state update
        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const togglePreview = () => {
        setIsPreviewMode(!isPreviewMode);
    };

    // Function to parse markdown and render as HTML
    const parseMarkdown = (text) => {
        if (!text) return '';
        
        // Simple markdown parsing for bold and italic
        let parsed = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic
        
        return parsed;
    };

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

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showNotification('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
                return;
            }

            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                showNotification('Image size must be less than 10MB', 'error');
                return;
            }

            setSelectedImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Clear selected image
    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
                        console.log('Notification received:', notificationData);
                        
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

    const handleSendMessage = async () => {
        // Check if we have either text or image
        if (!newMessage.trim() && !selectedImage) return;

        try {
            if (selectedContact) {
                // Send direct message using HTTP API (supports images)
                const formData = new FormData();
                formData.append('senderUsername', user.username);
                formData.append('receiverUsername', selectedContact);
                
                if (newMessage.trim()) {
                    formData.append('content', newMessage);
                }
                
                if (selectedImage) {
                    formData.append('image', selectedImage);
                }

                const response = await apiCallMultipart(API_ENDPOINTS.SEND_DIRECT_MESSAGE, formData);

                if (response.ok) {
                    const sentMessage = await response.json();
                    
                    // Add message to local state immediately
                    setAllMessages(prev => ({
                        ...prev,
                        [selectedContact]: [...(prev[selectedContact] || []), sentMessage]
                    }));
                    setMessages(prev => [...prev, sentMessage]);
                    
                    showNotification('Message sent successfully!', 'success');
                } else {
                    const errorText = await response.text();
                    showNotification(`Failed to send message: ${errorText}`, 'error');
                }
                
            } else if (selectedGroup && selectedGroupInfo) {
                // Send group message using HTTP API (supports images)
                const groupId = selectedGroup.replace('group_', '');
                const formData = new FormData();
                formData.append('senderUsername', user.username);
                
                if (newMessage.trim()) {
                    formData.append('content', newMessage);
                }
                
                if (selectedImage) {
                    formData.append('image', selectedImage);
                }

                const response = await apiCallMultipart(API_ENDPOINTS.SEND_GROUP_MESSAGE(groupId), formData);

                if (response.ok) {
                    // Don't add message to local state immediately for group messages
                    // The WebSocket subscription will handle it for all group members including sender
                    showNotification('Message sent successfully!', 'success');
                } else {
                    const errorText = await response.text();
                    showNotification(`Failed to send message: ${errorText}`, 'error');
                }
            }

            // Clear input and image
            setNewMessage('');
            clearImage();
            
        } catch (error) {
            console.error('Error sending message:', error);
            showNotification('Failed to send message. Please try again.', 'error');
        }
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

    // Render message content (text and/or image)
    const renderMessageContent = (message) => {
        return (
            <div className="message-content-wrapper">
                {message.image && (
                    <div className="message-image">
                        <img 
                            src={API_ENDPOINTS.GET_IMAGE(message.image.id)} 
                            alt={message.image.fileName}
                            style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '8px' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
                {message.content && (
                    <div 
                        className="message-text"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                    />
                )}
            </div>
        );
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
                                            {renderMessageContent(message)}
                                            <div className="message-time">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Invisible element to scroll to */}
                                <div ref={messagesEndRef} />
                            </div>
                            
                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="image-preview">
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Preview" />
                                        <button 
                                            className="image-preview-close"
                                            onClick={clearImage}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="message-input">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                                
                                {/* Formatting toolbar */}
                                <div className="formatting-toolbar">
                                    <button 
                                        className="format-button"
                                        onClick={() => applyFormatting('bold')}
                                        title="Bold (**text**)"
                                    >
                                        <strong>B</strong>
                                    </button>
                                    <button 
                                        className="format-button"
                                        onClick={() => applyFormatting('italic')}
                                        title="Italic (*text*)"
                                    >
                                        <em>I</em>
                                    </button>
                                    <button 
                                        className="format-button"
                                        onClick={togglePreview}
                                        title="Preview formatted text"
                                    >
                                        👁️
                                    </button>
                                    <button 
                                        className="image-button"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Add image"
                                    >
                                        📷
                                    </button>
                                </div>

                                {/* Preview mode */}
                                {isPreviewMode && newMessage.trim() && (
                                    <div className="message-preview">
                                        <div className="preview-label">Preview:</div>
                                        <div 
                                            className="preview-content"
                                            dangerouslySetInnerHTML={{ __html: parseMarkdown(newMessage) }}
                                        />
                                    </div>
                                )}

                                {/* Message input */}
                                <div className="input-row">
                                    <textarea
                                        ref={messageInputRef}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message... Use **bold** and *italic* formatting"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        rows="1"
                                        style={{ 
                                            resize: 'none',
                                            overflow: 'hidden',
                                            minHeight: '40px',
                                            maxHeight: '120px'
                                        }}
                                        onInput={(e) => {
                                            // Auto-resize textarea
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                    />
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() && !selectedImage}
                                        className="send-button"
                                    >
                                        Send
                                    </button>
                                </div>
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