package com.example.ohms.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    String fileName;
    String fileLocation;
    
    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    User user;

    @ManyToOne
    @JoinColumn(name = "room_chat_id", nullable = false)
    RoomChat roomChat;

    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
    



}
