package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    @Autowired
    private UserService userService;

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserContacts(@PathVariable String username) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<User> contacts = userService.getContacts(user);
            List<ContactResponse> contactResponses = contacts.stream()
                .map(contact -> new ContactResponse(contact.getId(), contact.getUsername()))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(contactResponses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{username}/add")
    public ResponseEntity<?> addContact(@PathVariable String username, @RequestBody AddContactRequest request) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            userService.addContact(user, request.getContactUsername());
            
            return ResponseEntity.ok("Contact added successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{username}/remove")
    public ResponseEntity<?> removeContact(@PathVariable String username, @RequestBody RemoveContactRequest request) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            userService.removeContact(user, request.getContactUsername());
            return ResponseEntity.ok("Contact removed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query) {
        try {
            List<User> users = userService.searchUsers(query);
            List<ContactResponse> userResponses = users.stream()
                .map(user -> new ContactResponse(user.getId(), user.getUsername()))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(userResponses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{username}/check/{contactUsername}")
    public ResponseEntity<?> checkIfContact(@PathVariable String username, @PathVariable String contactUsername) {
        try {
            User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            boolean isContact = userService.isContact(user, contactUsername);
            return ResponseEntity.ok(new ContactCheckResponse(isContact));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Request/Response DTOs
    private static class AddContactRequest {
        private String contactUsername;

        public String getContactUsername() {
            return contactUsername;
        }

        public void setContactUsername(String contactUsername) {
            this.contactUsername = contactUsername;
        }
    }

    private static class RemoveContactRequest {
        private String contactUsername;

        public String getContactUsername() {
            return contactUsername;
        }

        public void setContactUsername(String contactUsername) {
            this.contactUsername = contactUsername;
        }
    }

    private static class ContactResponse {
        private Long id;
        private String username;

        public ContactResponse(Long id, String username) {
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

    private static class ContactCheckResponse {
        private boolean isContact;

        public ContactCheckResponse(boolean isContact) {
            this.isContact = isContact;
        }

        public boolean isContact() {
            return isContact;
        }

        public void setContact(boolean contact) {
            isContact = contact;
        }
    }
} 