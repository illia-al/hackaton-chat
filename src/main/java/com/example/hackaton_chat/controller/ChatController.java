package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.model.*;
import com.example.hackaton_chat.service.ChatService;
import com.example.hackaton_chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @PostMapping("/direct")
    public ResponseEntity<?> sendDirectMessage(
            @RequestParam String senderUsername,
            @RequestParam String receiverUsername,
            @RequestParam String content) {
        try {
            User sender = userService.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
            Message message = chatService.sendDirectMessage(sender, receiverUsername, content);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/group")
    public ResponseEntity<?> createGroupChat(
            @RequestParam String ownerUsername,
            @RequestParam String name,
            @RequestBody List<String> participantUsernames) {
        try {
            User owner = userService.findByUsername(ownerUsername)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
            GroupChat groupChat = chatService.createGroupChat(owner, name, participantUsernames);
            return ResponseEntity.ok(groupChat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/group/{groupId}/message")
    public ResponseEntity<?> sendGroupMessage(
            @PathVariable Long groupId,
            @RequestParam String senderUsername,
            @RequestParam String content) {
        try {
            User sender = userService.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
            Message message = chatService.sendGroupMessage(sender, groupId, content);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/group/{groupId}/leave")
    public ResponseEntity<?> leaveGroupChat(
            @PathVariable Long groupId,
            @RequestParam String username) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            chatService.leaveGroupChat(user, groupId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/group/{groupId}")
    public ResponseEntity<?> deleteGroupChat(
            @PathVariable Long groupId,
            @RequestParam String username) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            chatService.deleteGroupChat(user, groupId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchMessages(
            @RequestParam String username,
            @RequestParam String query) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            List<Message> messages = chatService.searchMessages(user, query);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/messages/{username}/{contactUsername}")
    public ResponseEntity<?> getConversation(
            @PathVariable String username,
            @PathVariable String contactUsername) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            User contact = userService.findByUsername(contactUsername)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
            
            List<Message> messages = chatService.getConversation(user, contact);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/group/{groupId}/messages")
    public ResponseEntity<?> getGroupMessages(@PathVariable Long groupId) {
        try {
            List<Message> messages = chatService.getGroupMessages(groupId);
            return ResponseEntity.ok(messages);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 