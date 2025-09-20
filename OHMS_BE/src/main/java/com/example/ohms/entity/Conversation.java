package com.example.ohms.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
// thực ra bảng này là tin nhắn, mỗi tin nhắn sẽ có 1 id như này 
public class Conversation {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
   @ManyToOne // gán room chat id vào, nhiều mesage chỉ được nhắn trong 1 cái room
   RoomChat roomChat;
   
   String message;
   @ManyToOne // 1 user có thể có nhiều message
   User user;
// thời gian tạo tin nhắn
     // thời gian tạo tin nhắn
    LocalDateTime createdAt = LocalDateTime.now();
}
