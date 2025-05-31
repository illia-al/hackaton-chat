package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.GroupChat;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.model.Message;
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
    }

    // Send group message via WebSocket
    public void sendGroupMessage(Object message, Long groupId) {
        messagingTemplate.convertAndSend(
            "/topic/group." + groupId,
            message
        );
    }

    // Send message received notification
    public void notifyMessageReceived(String receiverUsername, Message message) {
        Notification notification = Notification.createMessageNotification(
            NotificationType.MESSAGE_RECEIVED,
            message.getId(),
            message.getSender().getUsername(),
            getMessagePreview(message),
            message.getImage() != null
        );
        
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + receiverUsername,
            notification
        );
    }

    // Send message sent notification
    public void notifyMessageSent(String senderUsername, Message message) {
        Notification notification = Notification.createMessageNotification(
            NotificationType.MESSAGE_SENT,
            message.getId(),
            message.getSender().getUsername(),
            getMessagePreview(message),
            message.getImage() != null
        );
        
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + senderUsername,
            notification
        );
    }

    // Send group message received notification
    public void notifyGroupMessageReceived(List<User> participants, Message message, GroupChat group) {
        String senderUsername = message.getSender().getUsername();
        
        for (User participant : participants) {
            // Don't send notification to the sender
            if (!participant.getUsername().equals(senderUsername)) {
                Notification notification = Notification.createGroupMessageNotification(
                    NotificationType.GROUP_MESSAGE_RECEIVED,
                    message.getId(),
                    senderUsername,
                    getMessagePreview(message),
                    message.getImage() != null,
                    group.getId(),
                    group.getName()
                );
                
                messagingTemplate.convertAndSend(
                    "/queue/notifications-" + participant.getUsername(),
                    notification
                );
            }
        }
    }

    // Send group message sent notification
    public void notifyGroupMessageSent(String senderUsername, Message message, GroupChat group) {
        Notification notification = Notification.createGroupMessageNotification(
            NotificationType.GROUP_MESSAGE_SENT,
            message.getId(),
            senderUsername,
            getMessagePreview(message),
            message.getImage() != null,
            group.getId(),
            group.getName()
        );
        
        messagingTemplate.convertAndSend(
            "/queue/notifications-" + senderUsername,
            notification
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

    // Helper method to create message preview for notifications
    private String getMessagePreview(Message message) {
        if (message.getContent() != null && !message.getContent().trim().isEmpty()) {
            return message.getContent().length() > 50 
                ? message.getContent().substring(0, 50) + "..."
                : message.getContent();
        } else if (message.getImage() != null) {
            return "📷 Image";
        }
        return "Message";
    }
} 