package com.example.hackaton_chat.repository;

import com.example.hackaton_chat.model.MessageImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageImageRepository extends JpaRepository<MessageImage, Long> {
} 