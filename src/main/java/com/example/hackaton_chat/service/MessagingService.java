package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.GroupChat;
import com.example.hackaton_chat.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessagingService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Generic method to send notifications
    public void sendNotification(String destination, Object payload) {
        messagingTemplate.convertAndSend(destination, payload);
    }

    // Send group creation notification to all participants
    public void notifyGroupCreated(GroupChat group, List<User> participants, String ownerUsername) {
        GroupCreatedNotification notification = new GroupCreatedNotification(
            group.getId(),
            group.getName(),
            ownerUsername
        );

        for (User participant : participants) {
            messagingTemplate.convertAndSend(
                "/queue/notifications-" + participant.getUsername(),
                notification
            );
        }
    }

    // Send contact added notification
    public void notifyContactAdded(String username, String newContactUsername) {
        ContactAddedNotification notification = new ContactAddedNotification(newContactUsername);
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + username,
            notification
        );
    }

    // Send notification when user is added to a group
    public void notifyAddedToGroup(String username, GroupChat group, String ownerUsername) {
        GroupCreatedNotification notification = new GroupCreatedNotification(
            group.getId(),
            group.getName(),
            ownerUsername
        );
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + username,
            notification
        );
    }

    // Send notification when user is removed from a group
    public void notifyRemovedFromGroup(String username, GroupChat group, String ownerUsername) {
        GroupRemovedNotification notification = new GroupRemovedNotification(
            group.getId(),
            group.getName(),
            ownerUsername
        );
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + username,
            notification
        );
    }

    // Send contact removed notification
    public void notifyContactRemoved(String username, String removedContactUsername) {
        ContactRemovedNotification notification = new ContactRemovedNotification(removedContactUsername);
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + username,
            notification
        );
    }

    // Send direct message via WebSocket
    public void sendDirectMessage(Object message, String senderUsername, String receiverUsername) {
        // Send message to receiver using direct queue destination
        messagingTemplate.convertAndSend(
            "/queue/messages-" + receiverUsername,
            message
        );
        
        // Send message to sender as well for real-time confirmation
        messagingTemplate.convertAndSend(
            "/queue/messages-" + senderUsername,
            message
        );
    }

    // Send group message via WebSocket
    public void sendGroupMessage(Object message, Long groupId) {
        messagingTemplate.convertAndSend(
            "/topic/group." + groupId,
            message
        );
    }

    // Send error message to user
    public void sendErrorToUser(String username, String error) {
        messagingTemplate.convertAndSendToUser(
            username,
            "/queue/errors",
            error
        );
    }

    // Notification DTOs
    public static class GroupCreatedNotification {
        private String type = "GROUP_CREATED";
        private Long groupId;
        private String groupName;
        private String ownerUsername;

        public GroupCreatedNotification(Long groupId, String groupName, String ownerUsername) {
            this.groupId = groupId;
            this.groupName = groupName;
            this.ownerUsername = ownerUsername;
        }

        public String getType() {
            return type;
        }

        public Long getGroupId() {
            return groupId;
        }

        public String getGroupName() {
            return groupName;
        }

        public String getOwnerUsername() {
            return ownerUsername;
        }
    }

    public static class GroupRemovedNotification {
        private String type = "GROUP_REMOVED";
        private Long groupId;
        private String groupName;
        private String ownerUsername;

        public GroupRemovedNotification(Long groupId, String groupName, String ownerUsername) {
            this.groupId = groupId;
            this.groupName = groupName;
            this.ownerUsername = ownerUsername;
        }

        public String getType() {
            return type;
        }

        public Long getGroupId() {
            return groupId;
        }

        public String getGroupName() {
            return groupName;
        }

        public String getOwnerUsername() {
            return ownerUsername;
        }
    }

    public static class ContactAddedNotification {
        private String type = "CONTACT_ADDED";
        private String contactUsername;

        public ContactAddedNotification(String contactUsername) {
            this.contactUsername = contactUsername;
        }

        public String getType() {
            return type;
        }

        public String getContactUsername() {
            return contactUsername;
        }
    }

    public static class ContactRemovedNotification {
        private String type = "CONTACT_REMOVED";
        private String contactUsername;

        public ContactRemovedNotification(String contactUsername) {
            this.contactUsername = contactUsername;
        }

        public String getType() {
            return type;
        }

        public String getContactUsername() {
            return contactUsername;
        }
    }
} 