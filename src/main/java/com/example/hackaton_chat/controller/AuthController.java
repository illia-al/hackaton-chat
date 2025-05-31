package com.example.hackaton_chat.controller;

import com.example.hackaton_chat.dto.LoginRequest;
import com.example.hackaton_chat.dto.RegisterRequest;
import com.example.hackaton_chat.dto.UserResponse;
import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        try {
            User user = userService.registerUser(request.getUsername(), request.getPassword());
            UserResponse userResponse = new UserResponse(user.getId(), user.getUsername());
            return ResponseEntity.ok(userResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        try {
            User user = userService.loginUser(request.getUsername(), request.getPassword());
            UserResponse userResponse = new UserResponse(user.getId(), user.getUsername());
            return ResponseEntity.ok(userResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 