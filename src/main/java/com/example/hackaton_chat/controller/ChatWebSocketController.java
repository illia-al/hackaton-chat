package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.model.Message;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.model.GroupChat;
import com.example.hackaton_chat.service.ChatService;
import com.example.hackaton_chat.service.UserService;
import com.example.hackaton_chat.service.MessagingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class ChatWebSocketController {
    @Autowired
    private MessagingService messagingService;

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @MessageMapping("/chat.direct")
    public void handleDirectMessage(@Payload ChatMessage chatMessage) {
        try {
            Message message = chatService.sendDirectMessage(
                userService.findByUsername(chatMessage.getSenderUsername()).orElseThrow(),
                chatMessage.getReceiverUsername(),
                chatMessage.getContent()
            );
            
            messagingService.sendDirectMessage(
                message,
                chatMessage.getSenderUsername(),
                chatMessage.getReceiverUsername()
            );
        } catch (Exception e) {
            messagingService.sendErrorToUser(
                chatMessage.getSenderUsername(),
                e.getMessage()
            );
        }
    }

    @MessageMapping("/chat.group")
    public void handleGroupMessage(@Payload GroupChatMessage chatMessage) {
        try {
            Message message = chatService.sendGroupMessage(
                userService.findByUsername(chatMessage.getSenderUsername()).orElseThrow(),
                chatMessage.getGroupId(),
                chatMessage.getContent()
            );
            
            messagingService.sendGroupMessage(message, chatMessage.getGroupId());
        } catch (Exception e) {
            messagingService.sendErrorToUser(
                chatMessage.getSenderUsername(),
                e.getMessage()
            );
        }
    }

    private static class ChatMessage {
        private String senderUsername;
        private String receiverUsername;
        private String content;

        public String getSenderUsername() {
            return senderUsername;
        }

        public void setSenderUsername(String senderUsername) {
            this.senderUsername = senderUsername;
        }

        public String getReceiverUsername() {
            return receiverUsername;
        }

        public void setReceiverUsername(String receiverUsername) {
            this.receiverUsername = receiverUsername;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    private static class GroupChatMessage {
        private String senderUsername;
        private Long groupId;
        private String content;

        public String getSenderUsername() {
            return senderUsername;
        }

        public void setSenderUsername(String senderUsername) {
            this.senderUsername = senderUsername;
        }

        public Long getGroupId() {
            return groupId;
        }

        public void setGroupId(Long groupId) {
            this.groupId = groupId;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
} 