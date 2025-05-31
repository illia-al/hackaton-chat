import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ContactsList from './ContactsList';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall } from '../config/api';
import './Chat.css';

function Chat({ user, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [allMessages, setAllMessages] = useState({}); // Store messages per contact
    const selectedContactRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Use global notification system
    const { showNotification } = useNotifications();

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Keep ref in sync with state
    useEffect(() => {
        selectedContactRef.current = selectedContact;
    }, [selectedContact]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (user) {
            // Load existing contacts
            loadContacts();

            const client = new Client({
                webSocketFactory: () => new SockJS(API_ENDPOINTS.SOCKJS),
                onConnect: () => {
                    console.log('Connected to WebSocket');
                    
                    // Main subscription for user messages
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
                    
                    // Subscribe to error queue
                    client.subscribe(`/user/${user.username}/queue/errors`, (error) => {
                        console.error('WebSocket error:', error.body);
                        showNotification(`Error: ${error.body}`, 'error');
                    });
                },
                onDisconnect: () => {
                    console.log('Disconnected from WebSocket');
                },
                onStompError: (frame) => {
                    console.error('STOMP error:', frame);
                },
            });

            client.activate();
            setStompClient(client);

            return () => {
                client.deactivate();
            };
        }
    }, [user, showNotification]);

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

    const handleContactSelect = (contactUsername) => {
        setSelectedContact(contactUsername);
        
        // Load conversation if not already loaded
        if (!allMessages[contactUsername]) {
            loadConversation(contactUsername);
        } else {
            setMessages(allMessages[contactUsername]);
        }
    };

    // Handle contact removal - need to clear selection if removed contact was selected
    const handleContactRemoval = (removedContactUsername) => {
        if (selectedContact === removedContactUsername) {
            setSelectedContact(null);
            setMessages([]);
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedContact) return;

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

        setNewMessage('');
    };
    
    // Helper function to get user initials for avatar (for chat header)
    const getUserInitials = (username) => {
        return username.substring(0, 2).toUpperCase();
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
                    
                    <ContactsList
                        user={user}
                        contacts={contacts}
                        setContacts={setContacts}
                        selectedContact={selectedContact}
                        onContactSelect={handleContactSelect}
                        onContactRemoval={handleContactRemoval}
                        allMessages={allMessages}
                    />
                </div>
                
                <div className="chat-window">
                    {selectedContact ? (
                        <>
                            <div className="chat-header">
                                <div className="chat-header-avatar">
                                    {getUserInitials(selectedContact)}
                                </div>
                                <div className="chat-header-info">
                                    <h3>{selectedContact}</h3>
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
                            Select a contact to start chatting
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Chat; 