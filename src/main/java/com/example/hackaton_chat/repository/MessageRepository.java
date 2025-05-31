package com.example.hackaton_chat.repository;

import com.example.hackaton_chat.model.Message;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.model.GroupChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderAndReceiver(User sender, User receiver);
    List<Message> findByGroupChat(GroupChat groupChat);
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user OR m.receiver = :user OR m.groupChat IN " +
           "(SELECT g FROM GroupChat g JOIN g.participants p WHERE p = :user)) " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Message> searchMessages(User user, String query);
} 