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

    @Transactional
    public Message sendDirectMessage(User sender, String receiverUsername, String content) {
        User receiver = userRepository.findByUsername(receiverUsername)
            .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (!sender.getContacts().contains(receiver)) {
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

        GroupChat groupChat = new GroupChat();
        groupChat.setName(name);
        groupChat.setOwner(owner);
        groupChat.getParticipants().add(owner);

        for (String username : participantUsernames) {
            User participant = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
            groupChat.getParticipants().add(participant);
        }

        return groupChatRepository.save(groupChat);
    }

    @Transactional
    public Message sendGroupMessage(User sender, Long groupId, String content) {
        GroupChat groupChat = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group chat not found"));

        if (!groupChat.getParticipants().contains(sender)) {
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

        if (groupChat.getOwner().equals(user)) {
            throw new RuntimeException("Group owner cannot leave the group");
        }

        groupChat.getParticipants().remove(user);
        groupChatRepository.save(groupChat);
    }

    @Transactional
    public void deleteGroupChat(User user, Long groupId) {
        GroupChat groupChat = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group chat not found"));

        if (!groupChat.getOwner().equals(user)) {
            throw new RuntimeException("Only group owner can delete the group");
        }

        groupChatRepository.delete(groupChat);
    }

    public List<Message> searchMessages(User user, String query) {
        return messageRepository.searchMessages(user, query);
    }
} 