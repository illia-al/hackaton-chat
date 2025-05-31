package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String username, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    @Transactional
    public void addContact(User user, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername)
            .orElseThrow(() -> new RuntimeException("Contact not found"));

        if (user.getContacts().contains(contact)) {
            throw new RuntimeException("Contact already exists");
        }

        user.getContacts().add(contact);
        contact.getContacts().add(user);
        userRepository.save(user);
        userRepository.save(contact);
    }

    @Transactional
    public void removeContact(User user, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername)
            .orElseThrow(() -> new RuntimeException("Contact not found"));

        user.getContacts().remove(contact);
        contact.getContacts().remove(user);
        userRepository.save(user);
        userRepository.save(contact);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
} 