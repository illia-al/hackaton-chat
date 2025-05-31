package com.example.hackaton_chat.dto;

public class GroupResponse {
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