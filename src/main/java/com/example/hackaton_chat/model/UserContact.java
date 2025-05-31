package com.example.hackaton_chat.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "user_contacts")
public class UserContact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "contact_id", nullable = false)
    private Long contactId;

    public UserContact() {}

    public UserContact(Long userId, Long contactId) {
        this.userId = userId;
        this.contactId = contactId;
    }
} 