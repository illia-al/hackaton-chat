import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function Chat({ user, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [stompClient, setStompClient] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = 'success') => {
        const id = Date.now();
        const newNotification = {
            id,
            message,
            type // 'success', 'error', 'info'
        };
        
        setNotifications(prev => [...prev, newNotification]);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(notif => notif.id !== id));
        }, 3000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    useEffect(() => {
        if (user) {
            // Load existing contacts
            loadContacts();

            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                onConnect: () => {
                    console.log('Connected to WebSocket');
                    client.subscribe(`/user/${user.username}/queue/messages`, (message) => {
                        const newMessage = JSON.parse(message.body);
                        setMessages(prev => [...prev, newMessage]);
                    });
                },
            });

            client.activate();
            setStompClient(client);

            return () => {
                client.deactivate();
            };
        }
    }, [user]);

    const loadContacts = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/contacts/${user.username}`);
            if (response.ok) {
                const contactsData = await response.json();
                setContacts(contactsData.map(contact => contact.username));
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    };

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`http://localhost:8080/api/contacts/search?query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const users = await response.json();
                // Filter out current user and existing contacts
                const filteredUsers = users.filter(u => 
                    u.username !== user.username && 
                    !contacts.includes(u.username)
                );
                setSearchResults(filteredUsers);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const addContact = async (contactUsername) => {
        try {
            const response = await fetch(`http://localhost:8080/api/contacts/${user.username}/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactUsername }),
            });

            if (response.ok) {
                setContacts(prev => [...prev, contactUsername]);
                // Reset search results and query after successful add
                setSearchResults([]);
                setSearchQuery('');
                showNotification(`${contactUsername} added to contacts!`, 'success');
            } else {
                const errorMessage = await response.text();
                showNotification(`Error: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            showNotification('Error adding contact', 'error');
        }
    };

    const removeContact = async (contactUsername) => {
        if (!window.confirm(`Are you sure you want to remove ${contactUsername} from your contacts?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/contacts/${user.username}/remove`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactUsername }),
            });

            if (response.ok) {
                setContacts(prev => prev.filter(c => c !== contactUsername));
                if (selectedContact === contactUsername) {
                    setSelectedContact(null);
                }
                showNotification(`${contactUsername} removed from contacts`, 'success');
            } else {
                const errorMessage = await response.text();
                showNotification(`Error: ${errorMessage}`, 'error');
            }
        } catch (error) {
            console.error('Error removing contact:', error);
            showNotification('Error removing contact', 'error');
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchUsers(searchQuery);
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery, contacts]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedContact) return;

        const message = {
            senderUsername: user.username,
            receiverUsername: selectedContact,
            content: newMessage,
        };

        stompClient.publish({
            destination: '/app/chat.direct',
            body: JSON.stringify(message),
        });

        setNewMessage('');
    };

    return (
        <div className="App">
            <div className="chat-container">
                <div className="contacts-list">
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '1rem', 
                        padding: '1rem', 
                        borderBottom: '1px solid #ddd' 
                    }}>
                        <h3>Contacts</h3>
                        <button
                            onClick={onLogout}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                    
                    <div style={{ padding: '0 1rem' }}>
                        <div style={{ 
                            marginBottom: '1rem', 
                            padding: '0.75rem', 
                            backgroundColor: '#e8f0fe', 
                            borderRadius: '4px' 
                        }}>
                            <p style={{ fontSize: '0.875rem', color: '#1a73e8', margin: 0 }}>Welcome, {user.username}!</p>
                        </div>

                        {/* Add Contact Section - Always Visible */}
                        <div style={{ marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
                                Add Contact
                            </h4>
                            <div style={{
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                padding: '1rem',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                />
                                
                                {isSearching && (
                                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                                        Searching...
                                    </div>
                                )}

                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.5rem',
                                                border: '1px solid #eee',
                                                borderRadius: '4px',
                                                marginBottom: '0.25rem',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.875rem' }}>{result.username}</span>
                                            <button
                                                onClick={() => addContact(result.username)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#10b981',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {searchQuery && !isSearching && searchResults.length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
                                        No users found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contacts List */}
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#333' }}>
                                Your Contacts ({contacts.length})
                            </h4>
                            {contacts.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    color: '#666', 
                                    fontSize: '0.875rem',
                                    padding: '1rem',
                                    fontStyle: 'italic'
                                }}>
                                    No contacts yet. Add some contacts to start chatting!
                                </div>
                            ) : (
                                contacts.map((contact) => (
                                    <div
                                        key={contact}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            border: selectedContact === contact ? '2px solid #1a73e8' : '1px solid #eee',
                                            borderRadius: '4px',
                                            marginBottom: '0.25rem',
                                            backgroundColor: selectedContact === contact ? '#f0f7ff' : 'white',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => setSelectedContact(contact)}
                                    >
                                        <span style={{ fontSize: '0.875rem', fontWeight: selectedContact === contact ? 'bold' : 'normal' }}>
                                            {contact}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeContact(contact);
                                            }}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: '#dc2626',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem'
                                            }}
                                            title={`Remove ${contact}`}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="chat-window">
                    {selectedContact ? (
                        <>
                            <div className="messages">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`message ${
                                            message.sender.username === user.username ? 'sent' : 'received'
                                        }`}
                                    >
                                        <div className="message-content">{message.content}</div>
                                        <div className="message-time">
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="message-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button onClick={handleSendMessage}>Send</button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            Select a contact to start chatting
                        </div>
                    )}
                </div>
            </div>

            {/* Notification System */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '350px'
            }}>
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            backgroundColor: notification.type === 'success' ? '#10b981' : 
                                           notification.type === 'error' ? '#ef4444' : '#3b82f6',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            position: 'relative',
                            cursor: 'pointer',
                            animation: 'slideInFromRight 0.3s ease-out',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                        onClick={() => removeNotification(notification.id)}
                        title="Click to dismiss"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>
                                {notification.type === 'success' ? '✓' : 
                                 notification.type === 'error' ? '✕' : 'ℹ'}
                            </span>
                            <span>{notification.message}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

export default Chat; 