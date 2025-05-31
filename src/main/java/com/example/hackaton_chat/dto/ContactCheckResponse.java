package com.example.hackaton_chat.dto;

public class ContactCheckResponse {
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