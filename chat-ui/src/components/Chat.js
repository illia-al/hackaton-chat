import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function Chat({ user, onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        if (user) {
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
                            <p style={{ fontSize: '0.875rem', color: '#1a73e8' }}>Welcome, {user.username}!</p>
                        </div>
                        {contacts.map((contact) => (
                            <div
                                key={contact}
                                className={`contact ${selectedContact === contact ? 'selected' : ''}`}
                                onClick={() => setSelectedContact(contact)}
                            >
                                {contact}
                            </div>
                        ))}
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
        </div>
    );
}

export default Chat; 