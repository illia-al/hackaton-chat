package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.User;
import com.example.hackaton_chat.model.UserContact;
import com.example.hackaton_chat.repository.UserRepository;
import com.example.hackaton_chat.repository.UserContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserContactRepository userContactRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MessagingService messagingService;

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
    public User loginUser(String username, String password) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return user;
    }

    @Transactional
    public void addContact(User user, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername)
            .orElseThrow(() -> new RuntimeException("Contact not found"));

        // Check if contact relationship already exists
        Optional<UserContact> existingContact = userContactRepository
            .findByUserIdAndContactId(user.getId(), contact.getId());
        
        if (existingContact.isPresent()) {
            throw new RuntimeException("Contact already exists");
        }

        // Create bidirectional contact relationship
        userContactRepository.save(new UserContact(user.getId(), contact.getId()));
        userContactRepository.save(new UserContact(contact.getId(), user.getId()));

        // Send WebSocket notifications to both users about the new contact
        messagingService.notifyContactAdded(user.getUsername(), contactUsername);
        messagingService.notifyContactAdded(contactUsername, user.getUsername());
    }

    @Transactional
    public void removeContact(User user, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername)
            .orElseThrow(() -> new RuntimeException("Contact not found"));

        // Remove bidirectional contact relationship
        userContactRepository.deleteBidirectionalContact(user.getId(), contact.getId());

        // Send WebSocket notifications to both users about the contact removal
        messagingService.notifyContactRemoved(user.getUsername(), contactUsername);
        messagingService.notifyContactRemoved(contactUsername, user.getUsername());
    }

    public boolean isContact(User user, String contactUsername) {
        User contact = userRepository.findByUsername(contactUsername).orElse(null);
        if (contact == null) {
            return false;
        }
        
        return userContactRepository
            .findByUserIdAndContactId(user.getId(), contact.getId())
            .isPresent();
    }

    public List<User> getContacts(User user) {
        List<UserContact> userContacts = userContactRepository.findByUserId(user.getId());
        List<Long> contactIds = userContacts.stream()
            .map(UserContact::getContactId)
            .collect(Collectors.toList());
        
        return userRepository.findAllById(contactIds);
    }

    public List<User> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
} 