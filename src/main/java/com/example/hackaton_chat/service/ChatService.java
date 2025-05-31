package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.*;
import com.example.hackaton_chat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class ChatService {
    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private GroupChatRepository groupChatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private GroupChatService groupChatService;

    @Autowired
    private ImageService imageService;

    @Autowired
    private MessagingService messagingService;

    @Transactional
    public Message sendDirectMessage(User sender, String receiverUsername, String content) {
        return sendDirectMessage(sender, receiverUsername, content, null);
    }

    @Transactional
    public Message sendDirectMessage(User sender, String receiverUsername, String content, MultipartFile image) {
        User receiver = userRepository.findByUsername(receiverUsername)
            .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (!userService.isContact(sender, receiverUsername)) {
            throw new RuntimeException("Cannot send message to non-contact");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);

        // Handle image if provided
        if (image != null && !image.isEmpty()) {
            try {
                MessageImage messageImage = imageService.saveImage(image);
                message.setImage(messageImage);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save image: " + e.getMessage());
            }
        }

        Message savedMessage = messageRepository.save(message);

        // Send RabbitMQ notification for real-time messaging
        messagingService.sendDirectMessage(savedMessage, sender.getUsername(), receiverUsername);
        
        // Send specific notifications for message events
        messagingService.notifyMessageSent(sender.getUsername(), savedMessage);
        messagingService.notifyMessageReceived(receiverUsername, savedMessage);

        return savedMessage;
    }

    @Transactional
    public GroupChat createGroupChat(User owner, String name, List<String> participantUsernames) {
        if (participantUsernames.size() > 300) {
            throw new RuntimeException("Group chat cannot have more than 300 participants");
        }

        // Create the group using GroupChatService
        GroupChat groupChat = groupChatService.createGroupChat(name, owner.getId());

        // Add participants
        for (String username : participantUsernames) {
            User participant = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
            
            try {
                groupChatService.addParticipant(groupChat.getId(), participant.getId());
            } catch (RuntimeException e) {
                // Skip if user is already a participant (owner is automatically added)
                if (!e.getMessage().contains("already a participant")) {
                    throw e;
                }
            }
        }

        return groupChat;
    }

    @Transactional
    public Message sendGroupMessage(User sender, Long groupId, String content) {
        return sendGroupMessage(sender, groupId, content, null);
    }

    @Transactional
    public Message sendGroupMessage(User sender, Long groupId, String content, MultipartFile image) {
        GroupChat groupChat = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group chat not found"));

        // Check if user is a participant using GroupChatService
        List<User> participants = groupChatService.getGroupParticipants(groupId);
        boolean isParticipant = participants.stream()
            .anyMatch(participant -> participant.getId().equals(sender.getId()));

        if (!isParticipant) {
            throw new RuntimeException("User is not a participant of this group");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setGroupChat(groupChat);
        message.setContent(content);

        // Handle image if provided
        if (image != null && !image.isEmpty()) {
            try {
                MessageImage messageImage = imageService.saveImage(image);
                message.setImage(messageImage);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save image: " + e.getMessage());
            }
        }

        Message savedMessage = messageRepository.save(message);

        // Send RabbitMQ notification for real-time group messaging
        messagingService.sendGroupMessage(savedMessage, groupId);
        
        // Send specific notifications for group message events
        messagingService.notifyGroupMessageSent(sender.getUsername(), savedMessage, groupChat);
        messagingService.notifyGroupMessageReceived(participants, savedMessage, groupChat);

        return savedMessage;
    }

    @Transactional
    public void leaveGroupChat(User user, Long groupId) {
        GroupChat groupChat = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group chat not found"));

        if (groupChat.getOwnerId().equals(user.getId())) {
            throw new RuntimeException("Group owner cannot leave the group");
        }

        groupChatService.removeParticipant(groupId, user.getId());
    }

    @Transactional
    public void deleteGroupChat(User user, Long groupId) {
        groupChatService.deleteGroup(groupId, user.getId());
    }

    public List<Message> searchMessages(User user, String query) {
        return messageRepository.searchMessages(user.getId(), query);
    }

    public List<Message> getConversation(User user1, User user2) {
        // Get messages where user1 is sender and user2 is receiver
        List<Message> messages1 = messageRepository.findBySenderAndReceiver(user1, user2);
        // Get messages where user2 is sender and user1 is receiver
        List<Message> messages2 = messageRepository.findBySenderAndReceiver(user2, user1);
        
        // Combine both lists
        messages1.addAll(messages2);
        
        // Sort by timestamp
        messages1.sort((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()));
        
        return messages1;
    }

    public List<Message> getGroupMessages(Long groupId) {
        GroupChat groupChat = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group chat not found"));
        
        List<Message> messages = messageRepository.findByGroupChat(groupChat);
        
        // Sort by timestamp
        messages.sort((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()));
        
        return messages;
    }
} 