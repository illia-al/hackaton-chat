package com.example.hackaton_chat.repository;

import com.example.hackaton_chat.model.GroupChat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupChatRepository extends JpaRepository<GroupChat, Long> {
    List<GroupChat> findByOwnerId(Long ownerId);
} 