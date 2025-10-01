package com.example.ohms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.ohms.entity.File;

public interface FileRepository extends JpaRepository<File, String> {
    
    // Find files by room chat ID
    List<File> findByRoomChatId(String roomChatId);
    
    // Find files by sender (user) ID
    List<File> findByUserId(String userId);
    
    // Find files by room chat ID and sender ID
    List<File> findByRoomChatIdAndUserId(String roomChatId, String userId);
    
    // Find files by file name containing keyword (for search)
    List<File> findByFileNameContainingIgnoreCase(String fileName);
    
    // Find files by room chat ID ordered by creation date
    List<File> findByRoomChatIdOrderByCreatedAtDesc(String roomChatId);
    
    // Custom query to find files with user and room chat details
    @Query("SELECT f FROM File f LEFT JOIN FETCH f.user LEFT JOIN FETCH f.roomChat WHERE f.id = :id")
    Optional<File> findByIdWithDetails(@Param("id") String id);
    
    // Find files by room chat ID with user details
    @Query("SELECT f FROM File f LEFT JOIN FETCH f.user WHERE f.roomChat.id = :roomChatId ORDER BY f.createdAt DESC")
    List<File> findByRoomChatIdWithUserDetails(@Param("roomChatId") String roomChatId);
}