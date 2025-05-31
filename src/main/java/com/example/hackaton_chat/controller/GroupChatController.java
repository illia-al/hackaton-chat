package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.model.GroupChat;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.service.GroupChatService;
import com.example.hackaton_chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
public class GroupChatController {
    @Autowired
    private GroupChatService groupChatService;

    @Autowired
    private UserService userService;

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody CreateGroupRequest request) {
        try {
            User owner = userService.findByUsername(request.getOwnerUsername())
                .orElseThrow(() -> new RuntimeException("Owner not found"));

            GroupChat group = groupChatService.createGroupChat(request.getName(), owner.getId());
            GroupResponse groupResponse = new GroupResponse(group.getId(), group.getName(), owner.getUsername());
            
            return ResponseEntity.ok(groupResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserGroups(@PathVariable String username) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

            List<GroupChat> groups = groupChatService.getUserGroups(user.getId());
            List<GroupResponse> groupResponses = groups.stream()
                .map(group -> {
                    User owner = userService.findById(group.getOwnerId()).orElse(null);
                    String ownerUsername = owner != null ? owner.getUsername() : "Unknown";
                    return new GroupResponse(group.getId(), group.getName(), ownerUsername);
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(groupResponses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{groupId}/participants")
    public ResponseEntity<?> getGroupParticipants(@PathVariable Long groupId) {
        try {
            List<User> participants = groupChatService.getGroupParticipants(groupId);
            List<UserResponse> participantResponses = participants.stream()
                .map(user -> new UserResponse(user.getId(), user.getUsername()))
                .collect(Collectors.toList());

            return ResponseEntity.ok(participantResponses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{groupId}/participants/add")
    public ResponseEntity<?> addParticipant(@PathVariable Long groupId, @RequestBody AddParticipantRequest request) {
        try {
            User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

            groupChatService.addParticipant(groupId, user.getId());
            
            return ResponseEntity.ok("Participant added successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{groupId}/participants/remove")
    public ResponseEntity<?> removeParticipant(@PathVariable Long groupId, @RequestBody RemoveParticipantRequest request) {
        try {
            User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

            groupChatService.removeParticipant(groupId, user.getId());
            return ResponseEntity.ok("Participant removed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId, @RequestParam String requesterUsername) {
        try {
            User requester = userService.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

            groupChatService.deleteGroup(groupId, requester.getId());
            return ResponseEntity.ok("Group deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Request/Response DTOs
    private static class CreateGroupRequest {
        private String name;
        private String ownerUsername;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getOwnerUsername() {
            return ownerUsername;
        }

        public void setOwnerUsername(String ownerUsername) {
            this.ownerUsername = ownerUsername;
        }
    }

    private static class AddParticipantRequest {
        private String username;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }

    private static class RemoveParticipantRequest {
        private String username;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }

    private static class GroupResponse {
        private Long id;
        private String name;
        private String ownerUsername;

        public GroupResponse(Long id, String name, String ownerUsername) {
            this.id = id;
            this.name = name;
            this.ownerUsername = ownerUsername;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getOwnerUsername() {
            return ownerUsername;
        }

        public void setOwnerUsername(String ownerUsername) {
            this.ownerUsername = ownerUsername;
        }
    }

    private static class UserResponse {
        private Long id;
        private String username;

        public UserResponse(Long id, String username) {
            this.id = id;
            this.username = username;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }
    }
} 