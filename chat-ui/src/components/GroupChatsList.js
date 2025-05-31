import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall } from '../config/api';
import './GroupChatsList.css';

function GroupChatsList({ user, selectedGroup, onGroupSelect, onGroupRemoval, allMessages, groups, setGroups }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [managingGroup, setManagingGroup] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [groupParticipants, setGroupParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const { showNotification } = useNotifications();

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            showNotification('Please enter a group name', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.CREATE, {
                method: 'POST',
                body: JSON.stringify({
                    name: newGroupName,
                    ownerUsername: user.username
                })
            });

            if (response.ok) {
                const newGroup = await response.json();
                setGroups(prev => [...prev, newGroup]);
                setNewGroupName('');
                setShowCreateModal(false);
                showNotification('Group created successfully!', 'success');
            } else {
                const error = await response.text();
                showNotification(error || 'Failed to create group', 'error');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            showNotification('Failed to create group', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManageGroup = async (group) => {
        setManagingGroup(group);
        setShowManageModal(true);
        loadGroupParticipants(group.id);
    };

    const loadGroupParticipants = async (groupId) => {
        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.PARTICIPANTS(groupId));
            if (response.ok) {
                const participants = await response.json();
                setGroupParticipants(participants);
            }
        } catch (error) {
            console.error('Error loading participants:', error);
            showNotification('Failed to load participants', 'error');
        }
    };

    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await apiCall(API_ENDPOINTS.CONTACTS_SEARCH(query));
            if (response.ok) {
                const users = await response.json();
                // Filter out users already in the group
                const filteredUsers = users.filter(user => 
                    !groupParticipants.some(participant => participant.username === user.username)
                );
                setSearchResults(filteredUsers);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const addParticipant = async (username) => {
        if (!managingGroup) return;

        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.ADD_PARTICIPANT(managingGroup.id), {
                method: 'POST',
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                loadGroupParticipants(managingGroup.id);
                setSearchUser('');
                setSearchResults([]);
                showNotification('Participant added successfully!', 'success');
            } else {
                const error = await response.text();
                showNotification(error || 'Failed to add participant', 'error');
            }
        } catch (error) {
            console.error('Error adding participant:', error);
            showNotification('Failed to add participant', 'error');
        }
    };

    const removeParticipant = async (username) => {
        if (!managingGroup) return;

        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.REMOVE_PARTICIPANT(managingGroup.id), {
                method: 'DELETE',
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                loadGroupParticipants(managingGroup.id);
                showNotification('Participant removed successfully!', 'success');
            } else {
                const error = await response.text();
                showNotification(error || 'Failed to remove participant', 'error');
            }
        } catch (error) {
            console.error('Error removing participant:', error);
            showNotification('Failed to remove participant', 'error');
        }
    };

    const leaveGroup = async (groupId) => {
        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.REMOVE_PARTICIPANT(groupId), {
                method: 'DELETE',
                body: JSON.stringify({ username: user.username })
            });

            if (response.ok) {
                setGroups(prev => prev.filter(group => group.id !== groupId));
                if (selectedGroup === `group_${groupId}`) {
                    onGroupRemoval(`group_${groupId}`);
                }
                showNotification('Left group successfully!', 'success');
            } else {
                const error = await response.text();
                showNotification(error || 'Failed to leave group', 'error');
            }
        } catch (error) {
            console.error('Error leaving group:', error);
            showNotification('Failed to leave group', 'error');
        }
    };

    const deleteGroup = async (groupId) => {
        if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiCall(API_ENDPOINTS.GROUPS.DELETE(groupId, user.username), {
                method: 'DELETE'
            });

            if (response.ok) {
                setGroups(prev => prev.filter(group => group.id !== groupId));
                if (selectedGroup === `group_${groupId}`) {
                    onGroupRemoval(`group_${groupId}`);
                }
                setShowManageModal(false);
                showNotification('Group deleted successfully!', 'success');
            } else {
                const error = await response.text();
                showNotification(error || 'Failed to delete group', 'error');
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            showNotification('Failed to delete group', 'error');
        }
    };

    const getGroupInitials = (groupName) => {
        return groupName.substring(0, 2).toUpperCase();
    };

    const getLastMessage = (groupId) => {
        const groupMessages = allMessages[`group_${groupId}`];
        if (!groupMessages || groupMessages.length === 0) return 'No messages yet';
        
        const lastMessage = groupMessages[groupMessages.length - 1];
        return `${lastMessage.sender.username}: ${lastMessage.content}`;
    };

    const getMessageTime = (groupId) => {
        const groupMessages = allMessages[`group_${groupId}`];
        if (!groupMessages || groupMessages.length === 0) return '';
        
        const lastMessage = groupMessages[groupMessages.length - 1];
        return new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="groups-list">
            <div className="groups-header">
                <h3>Group Chats</h3>
                <button 
                    className="create-group-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    +
                </button>
            </div>

            <div className="groups-items">
                {groups.map(group => (
                    <div 
                        key={group.id}
                        className={`group-item ${selectedGroup === `group_${group.id}` ? 'selected' : ''}`}
                        onClick={() => onGroupSelect(`group_${group.id}`, group)}
                    >
                        <div className="group-avatar">
                            {getGroupInitials(group.name)}
                        </div>
                        <div className="group-info">
                            <div className="group-name">{group.name}</div>
                            <div className="group-last-message">
                                {getLastMessage(group.id)}
                            </div>
                        </div>
                        <div className="group-meta">
                            <div className="group-time">{getMessageTime(group.id)}</div>
                            <div className="group-actions">
                                {group.ownerUsername === user.username && (
                                    <button 
                                        className="manage-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleManageGroup(group);
                                        }}
                                        title="Manage Group"
                                    >
                                        ⚙️
                                    </button>
                                )}
                                <button 
                                    className="leave-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        leaveGroup(group.id);
                                    }}
                                    title="Leave Group"
                                >
                                    🚪
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create New Group</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <input
                                type="text"
                                placeholder="Group name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                maxLength={50}
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button 
                                onClick={handleCreateGroup}
                                disabled={isLoading || !newGroupName.trim()}
                            >
                                {isLoading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Group Modal */}
            {showManageModal && managingGroup && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <div className="modal-header">
                            <h3>Manage {managingGroup.name}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowManageModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="participants-section">
                                <h4>Participants ({groupParticipants.length}/300)</h4>
                                <div className="participants-list">
                                    {groupParticipants.map(participant => (
                                        <div key={participant.id} className="participant-item">
                                            <span>{participant.username}</span>
                                            {participant.username === managingGroup.ownerUsername && (
                                                <span className="owner-badge">Owner</span>
                                            )}
                                            {managingGroup.ownerUsername === user.username && 
                                             participant.username !== user.username && (
                                                <button 
                                                    className="remove-participant-btn"
                                                    onClick={() => removeParticipant(participant.username)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {managingGroup.ownerUsername === user.username && groupParticipants.length < 300 && (
                                <div className="add-participant-section">
                                    <h4>Add Participants</h4>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchUser}
                                        onChange={(e) => {
                                            setSearchUser(e.target.value);
                                            searchUsers(e.target.value);
                                        }}
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="search-results">
                                            {searchResults.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    className="search-result-item"
                                                    onClick={() => addParticipant(user.username)}
                                                >
                                                    {user.username}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {managingGroup.ownerUsername === user.username && (
                                <button 
                                    className="delete-group-btn"
                                    onClick={() => deleteGroup(managingGroup.id)}
                                >
                                    Delete Group
                                </button>
                            )}
                            <button onClick={() => setShowManageModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupChatsList; 