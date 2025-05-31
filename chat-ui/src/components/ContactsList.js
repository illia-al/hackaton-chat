import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall } from '../config/api';
import './ContactsList.css';

function ContactsList({ 
    user,
    contacts,
    setContacts,
    selectedContact,
    onContactSelect,
    onContactRemoval,
    allMessages
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const { showNotification } = useNotifications();

    // Helper function to get user initials for avatar
    const getUserInitials = (username) => {
        return username.substring(0, 2).toUpperCase();
    };

    // Helper function to get contact preview message
    const getContactPreview = (contactUsername) => {
        const contactMessages = allMessages[contactUsername];
        if (contactMessages && contactMessages.length > 0) {
            const lastMessage = contactMessages[contactMessages.length - 1];
            
            // Handle messages with content
            if (lastMessage.content && lastMessage.content.trim()) {
                return lastMessage.content.length > 30 
                    ? lastMessage.content.substring(0, 30) + '...'
                    : lastMessage.content;
            }
            
            // Handle image-only messages
            if (lastMessage.image) {
                return '📷 Image';
            }
            
            // Fallback for empty messages
            return 'Message';
        }
        return 'No messages yet';
    };

    // Search users functionality
    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await apiCall(API_ENDPOINTS.CONTACTS_SEARCH(query));
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
            showNotification('Error searching users', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    // Add contact functionality
    const addContact = async (contactUsername) => {
        try {
            const response = await apiCall(API_ENDPOINTS.CONTACTS_ADD(user.username), {
                method: 'POST',
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

    // Remove contact functionality
    const removeContact = async (contactUsername) => {
        if (!window.confirm(`Are you sure you want to remove ${contactUsername} from your contacts?`)) {
            return;
        }

        try {
            const response = await apiCall(API_ENDPOINTS.CONTACTS_REMOVE(user.username), {
                method: 'DELETE',
                body: JSON.stringify({ contactUsername }),
            });

            if (response.ok) {
                setContacts(prev => prev.filter(c => c !== contactUsername));
                // Notify parent component about contact removal
                onContactRemoval(contactUsername);
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

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchUsers(searchQuery);
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [searchQuery, contacts]);

    return (
        <div className="contacts-list">           
            <div className="contacts-content">
                {/* Add Contact Section */}
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                
                {isSearching && (
                    <div className="searching-message">
                        Searching...
                    </div>
                )}

                <div className="search-results">
                    {searchResults.map((result) => (
                        <div
                            key={result.id}
                            className="search-result-item"
                        >
                            <span className="result-username">{result.username}</span>
                            <button
                                onClick={() => addContact(result.username)}
                                className="add-button"
                            >
                                Add
                            </button>
                        </div>
                    ))}
                </div>

                {searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="no-results">
                        No users found
                    </div>
                )}

                {/* Contacts List */}
                <div className="contacts-section">
                    <h4 className="section-title" style={{ padding: '1rem', margin: 0 }}>
                        Your Contacts ({contacts.length})
                    </h4>
                    {contacts.length === 0 ? (
                        <div className="no-contacts">
                            No contacts yet. Add some contacts to start chatting!
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <div
                                key={contact}
                                className={`contact-item ${selectedContact === contact ? 'selected' : ''}`}
                                onClick={() => onContactSelect(contact)}
                            >
                                <div className="contact-avatar">
                                    {getUserInitials(contact)}
                                </div>
                                <div className="contact-info">
                                    <div className="contact-username">
                                        {contact}
                                    </div>
                                    <div className="contact-preview">
                                        {getContactPreview(contact)}
                                    </div>
                                </div>
                                <div className="contact-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeContact(contact);
                                        }}
                                        className="remove-button"
                                        title={`Remove ${contact}`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContactsList; 