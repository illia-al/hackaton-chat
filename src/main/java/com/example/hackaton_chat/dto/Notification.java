package com.example.hackaton_chat.dto;

public class Notification {
    private NotificationType type;
    
    // Group-related fields (optional, used for GROUP_CREATED, GROUP_REMOVED)
    private Long groupId;
    private String groupName;
    private String ownerUsername;
    
    // Contact-related fields (optional, used for CONTACT_ADDED, CONTACT_REMOVED)
    private String contactUsername;
    
    // Message-related fields (optional, used for MESSAGE_RECEIVED, MESSAGE_SENT, etc.)
    private Long messageId;
    private String senderUsername;
    private String messageContent;
    private boolean hasImage;

    // Constructor for group notifications
    public Notification(NotificationType type, Long groupId, String groupName, String ownerUsername) {
        this.type = type;
        this.groupId = groupId;
        this.groupName = groupName;
        this.ownerUsername = ownerUsername;
    }

    // Constructor for contact notifications
    public Notification(NotificationType type, String contactUsername) {
        this.type = type;
        this.contactUsername = contactUsername;
    }
    
    // Constructor for message notifications
    public Notification(NotificationType type, Long messageId, String senderUsername, String messageContent, boolean hasImage) {
        this.type = type;
        this.messageId = messageId;
        this.senderUsername = senderUsername;
        this.messageContent = messageContent;
        this.hasImage = hasImage;
    }
    
    // Constructor for group message notifications
    public Notification(NotificationType type, Long messageId, String senderUsername, String messageContent, boolean hasImage, Long groupId, String groupName) {
        this.type = type;
        this.messageId = messageId;
        this.senderUsername = senderUsername;
        this.messageContent = messageContent;
        this.hasImage = hasImage;
        this.groupId = groupId;
        this.groupName = groupName;
    }

    // Getters
    public NotificationType getType() {
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

    public String getContactUsername() {
        return contactUsername;
    }
    
    public Long getMessageId() {
        return messageId;
    }
    
    public String getSenderUsername() {
        return senderUsername;
    }
    
    public String getMessageContent() {
        return messageContent;
    }
    
    public boolean isHasImage() {
        return hasImage;
    }

    // Factory methods for easier creation
    public static Notification createGroupNotification(NotificationType type, Long groupId, String groupName, String ownerUsername) {
        return new Notification(type, groupId, groupName, ownerUsername);
    }

    public static Notification createContactNotification(NotificationType type, String contactUsername) {
        return new Notification(type, contactUsername);
    }
    
    public static Notification createMessageNotification(NotificationType type, Long messageId, String senderUsername, String messageContent, boolean hasImage) {
        return new Notification(type, messageId, senderUsername, messageContent, hasImage);
    }
    
    public static Notification createGroupMessageNotification(NotificationType type, Long messageId, String senderUsername, String messageContent, boolean hasImage, Long groupId, String groupName) {
        return new Notification(type, messageId, senderUsername, messageContent, hasImage, groupId, groupName);
    }
} 