package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.GroupChat;
import com.example.hackaton_chat.model.GroupParticipant;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.repository.GroupChatRepository;
import com.example.hackaton_chat.repository.GroupParticipantRepository;
import com.example.hackaton_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GroupChatService {
    @Autowired
    private GroupChatRepository groupChatRepository;

    @Autowired
    private GroupParticipantRepository groupParticipantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private MessagingService messagingService;

    @Transactional
    public GroupChat createGroupChat(String name, Long ownerId) {
        GroupChat groupChat = new GroupChat();
        groupChat.setName(name);
        groupChat.setOwnerId(ownerId);
        GroupChat savedGroup = groupChatRepository.save(groupChat);

        // Add owner as participant
        groupParticipantRepository.save(new GroupParticipant(savedGroup.getId(), ownerId));

        // Send WebSocket notification to all participants (initially just the owner)
        List<User> participants = getGroupParticipants(savedGroup.getId());
        User owner = userService.findById(ownerId).orElse(null);
        String ownerUsername = owner != null ? owner.getUsername() : "Unknown";
        messagingService.notifyGroupCreated(savedGroup, participants, ownerUsername);

        return savedGroup;
    }

    @Transactional
    public void addParticipant(Long groupId, Long userId) {
        // Check if group exists
        GroupChat group = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));

        // Check if user exists
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is already a participant
        Optional<GroupParticipant> existingParticipant = groupParticipantRepository
            .findByGroupIdAndUserId(groupId, userId);

        if (existingParticipant.isPresent()) {
            throw new RuntimeException("User is already a participant");
        }

        groupParticipantRepository.save(new GroupParticipant(groupId, userId));

        // Send WebSocket notification to the newly added user
        User owner = userService.findById(group.getOwnerId()).orElse(null);
        String ownerUsername = owner != null ? owner.getUsername() : "Unknown";
        messagingService.notifyAddedToGroup(user.getUsername(), group, ownerUsername);
    }

    @Transactional
    public void removeParticipant(Long groupId, Long userId) {
        GroupChat group = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));

        // Don't allow removing the owner
        if (group.getOwnerId().equals(userId)) {
            throw new RuntimeException("Cannot remove group owner");
        }

        // Get user info before removing to send notification
        User removedUser = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        User owner = userService.findById(group.getOwnerId()).orElse(null);
        String ownerUsername = owner != null ? owner.getUsername() : "Unknown";

        groupParticipantRepository.deleteByGroupIdAndUserId(groupId, userId);

        // Send WebSocket notification to the removed user
        messagingService.notifyRemovedFromGroup(removedUser.getUsername(), group, ownerUsername);
    }

    public List<User> getGroupParticipants(Long groupId) {
        List<GroupParticipant> participants = groupParticipantRepository.findByGroupId(groupId);
        List<Long> userIds = participants.stream()
            .map(GroupParticipant::getUserId)
            .collect(Collectors.toList());

        return userRepository.findAllById(userIds);
    }

    public List<GroupChat> getUserGroups(Long userId) {
        List<GroupParticipant> participations = groupParticipantRepository.findByUserId(userId);
        List<Long> groupIds = participations.stream()
            .map(GroupParticipant::getGroupId)
            .collect(Collectors.toList());

        return groupChatRepository.findAllById(groupIds);
    }

    public Optional<GroupChat> findById(Long id) {
        return groupChatRepository.findById(id);
    }

    public List<GroupChat> findAll() {
        return groupChatRepository.findAll();
    }

    @Transactional
    public void deleteGroup(Long groupId, Long requesterId) {
        GroupChat group = groupChatRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));

        // Only owner can delete the group
        if (!group.getOwnerId().equals(requesterId)) {
            throw new RuntimeException("Only group owner can delete the group");
        }

        // Remove all participants first
        List<GroupParticipant> participants = groupParticipantRepository.findByGroupId(groupId);
        groupParticipantRepository.deleteAll(participants);

        // Delete the group
        groupChatRepository.delete(group);
    }
} 