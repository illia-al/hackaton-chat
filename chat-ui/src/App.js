import React, { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
          console.log('Connected to WebSocket');
          client.subscribe(`/user/${username}/queue/messages`, (message) => {
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
  }, [isLoggedIn, username]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, confirmPassword }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        const error = await response.text();
        alert(error);
      }
    } catch (error) {
      alert('Registration failed');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const message = {
      senderUsername: username,
      receiverUsername: selectedContact,
      content: newMessage,
    };

    stompClient.publish({
      destination: '/app/chat.direct',
      body: JSON.stringify(message),
    });

    setNewMessage('');
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="auth-container">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="chat-container">
        <div className="contacts-list">
          <h3>Contacts</h3>
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
        <div className="chat-window">
          {selectedContact ? (
            <>
              <div className="messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${
                      message.sender.username === username ? 'sent' : 'received'
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

export default App;
