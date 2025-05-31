package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.GroupChat;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.dto.Notification;
import com.example.hackaton_chat.dto.NotificationType;
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
        Notification notification = Notification.createGroupNotification(
            NotificationType.GROUP_CREATED,
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
        Notification notification = Notification.createContactNotification(
            NotificationType.CONTACT_ADDED,
            newContactUsername
        );
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + username,
            notification
        );
    }

    // Send notification when user is added to a group
    public void notifyAddedToGroup(String username, GroupChat group, String ownerUsername) {
        Notification notification = Notification.createGroupNotification(
            NotificationType.GROUP_CREATED,
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
        Notification notification = Notification.createGroupNotification(
            NotificationType.GROUP_REMOVED,
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
        Notification notification = Notification.createContactNotification(
            NotificationType.CONTACT_REMOVED,
            removedContactUsername
        );
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
} 