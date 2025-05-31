package com.example.hackaton_chat.repository;

import com.example.hackaton_chat.model.GroupParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupParticipantRepository extends JpaRepository<GroupParticipant, Long> {
    
    @Query("SELECT gp FROM GroupParticipant gp WHERE gp.groupId = :groupId")
    List<GroupParticipant> findByGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT gp FROM GroupParticipant gp WHERE gp.userId = :userId")
    List<GroupParticipant> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT gp FROM GroupParticipant gp WHERE gp.groupId = :groupId AND gp.userId = :userId")
    Optional<GroupParticipant> findByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM GroupParticipant gp WHERE gp.groupId = :groupId AND gp.userId = :userId")
    void deleteByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);
} 