package com.example.hackaton_chat.repository;

import com.example.hackaton_chat.model.Message;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.model.GroupChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findBySenderAndReceiver(User sender, User receiver);
    List<Message> findByGroupChat(GroupChat groupChat);
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId OR m.receiver.id = :userId OR " +
           "m.groupChat.id IN (SELECT gp.groupId FROM GroupParticipant gp WHERE gp.userId = :userId)) " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Message> searchMessages(@Param("userId") Long userId, @Param("query") String query);
} 