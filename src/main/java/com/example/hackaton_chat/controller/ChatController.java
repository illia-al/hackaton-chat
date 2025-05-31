package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.model.*;
import com.example.hackaton_chat.service.ChatService;
import com.example.hackaton_chat.service.UserService;
import com.example.hackaton_chat.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @Autowired
    private ImageService imageService;

    @PostMapping(value = "/direct", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> sendDirectMessage(
            @RequestParam String senderUsername,
            @RequestParam String receiverUsername,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile image) {
        try {
            // Validate message content
            if (!hasValidContent(content) && !hasValidImage(image)) {
                return ResponseEntity.badRequest()
                    .body("Message must have either text content or an image");
            }

            User sender = userService.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
            Message message = chatService.sendDirectMessage(sender, receiverUsername, content, image);
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

    @PostMapping(value = "/group/{groupId}/message", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> sendGroupMessage(
            @PathVariable Long groupId,
            @RequestParam String senderUsername,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile image) {
        try {
            // Validate message content
            if (!hasValidContent(content) && !hasValidImage(image)) {
                return ResponseEntity.badRequest()
                    .body("Message must have either text content or an image");
            }

            User sender = userService.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
            Message message = chatService.sendGroupMessage(sender, groupId, content, image);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/image/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable Long imageId) {
        try {
            Optional<MessageImage> imageOpt = imageService.getImageById(imageId);
            if (imageOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            MessageImage messageImage = imageOpt.get();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(messageImage.getContentType()));
            headers.setContentLength(messageImage.getFileSize());
            headers.setContentDispositionFormData("inline", messageImage.getFileName());

            return ResponseEntity.ok()
                .headers(headers)
                .body(messageImage.getImageData());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
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

    // Helper method to check if content is valid
    private boolean hasValidContent(String content) {
        return content != null && !content.trim().isEmpty();
    }

    // Helper method to check if image is valid
    private boolean hasValidImage(MultipartFile image) {
        return image != null && !image.isEmpty();
    }
} 