package com.example.hackaton_chat.dto;

public class Notification {
    private NotificationType type;
    
    // Group-related fields (optional, used for GROUP_CREATED, GROUP_REMOVED)
    private Long groupId;
    private String groupName;
    private String ownerUsername;
    
    // Contact-related fields (optional, used for CONTACT_ADDED, CONTACT_REMOVED)
    private String contactUsername;

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

    // Factory methods for easier creation
    public static Notification createGroupNotification(NotificationType type, Long groupId, String groupName, String ownerUsername) {
        return new Notification(type, groupId, groupName, ownerUsername);
    }

    public static Notification createContactNotification(NotificationType type, String contactUsername) {
        return new Notification(type, contactUsername);
    }
} 