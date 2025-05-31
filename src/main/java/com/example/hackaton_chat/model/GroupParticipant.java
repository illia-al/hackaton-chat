package com.example.hackaton_chat.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "group_participants")
public class GroupParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    public GroupParticipant() {}

    public GroupParticipant(Long groupId, Long userId) {
        this.groupId = groupId;
        this.userId = userId;
    }
} 