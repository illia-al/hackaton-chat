package com.example.hackaton_chat.repository;

import com.example.hackaton_chat.model.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserContactRepository extends JpaRepository<UserContact, Long> {
    
    @Query("SELECT uc FROM UserContact uc WHERE uc.userId = :userId")
    List<UserContact> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT uc FROM UserContact uc WHERE uc.userId = :userId AND uc.contactId = :contactId")
    Optional<UserContact> findByUserIdAndContactId(@Param("userId") Long userId, @Param("contactId") Long contactId);
    
    @Modifying
    @Query("DELETE FROM UserContact uc WHERE uc.userId = :userId AND uc.contactId = :contactId")
    void deleteByUserIdAndContactId(@Param("userId") Long userId, @Param("contactId") Long contactId);
    
    @Modifying
    @Query("DELETE FROM UserContact uc WHERE (uc.userId = :userId AND uc.contactId = :contactId) OR (uc.userId = :contactId AND uc.contactId = :userId)")
    void deleteBidirectionalContact(@Param("userId") Long userId, @Param("contactId") Long contactId);
} 