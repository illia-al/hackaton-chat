package com.example.hackaton_chat.service;

import com.example.hackaton_chat.model.MessageImage;
import com.example.hackaton_chat.repository.MessageImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ImageService {
    
    @Autowired
    private MessageImageRepository messageImageRepository;

    // Allowed image types
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg",
        "image/jpg", 
        "image/png",
        "image/gif",
        "image/webp"
    );

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    public MessageImage saveImage(MultipartFile file) throws IOException {
        validateImage(file);

        MessageImage messageImage = new MessageImage();
        messageImage.setFileName(file.getOriginalFilename());
        messageImage.setContentType(file.getContentType());
        messageImage.setFileSize(file.getSize());
        messageImage.setImageData(file.getBytes());

        return messageImageRepository.save(messageImage);
    }

    public Optional<MessageImage> getImageById(Long id) {
        return messageImageRepository.findById(id);
    }

    public void deleteImage(Long id) {
        messageImageRepository.deleteById(id);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file cannot be empty");
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("Image size too large. Maximum allowed size is 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }
    }
} 