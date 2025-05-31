package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.model.Message;
import com.example.hackaton_chat.service.ChatService;
import com.example.hackaton_chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatWebSocketController {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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
            
            messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiverUsername(),
                "/queue/messages",
                message
            );
        } catch (Exception e) {
            messagingTemplate.convertAndSendToUser(
                chatMessage.getSenderUsername(),
                "/queue/errors",
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
            
            messagingTemplate.convertAndSend(
                "/topic/group." + chatMessage.getGroupId(),
                message
            );
        } catch (Exception e) {
            messagingTemplate.convertAndSendToUser(
                chatMessage.getSenderUsername(),
                "/queue/errors",
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