package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.*;
import com.example.hackaton_chat.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public Message sendDirectMessage(User sender, String receiverUsername, String content) {
        User receiver = userRepository.findByUsername(receiverUsername)
            .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (!userService.isContact(sender, receiverUsername)) {
            throw new RuntimeException("Cannot send message to non-contact");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        return messageRepository.save(message);
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
        return messageRepository.save(message);
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
} 