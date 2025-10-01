package com.example.ohms.dto.response;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class FileResponse {
    String id;
    String fileName;
    String fileLocation;
    String userId;  // Sender ID
    String username;  // Sender username
    String userImageUrl;  // Sender avatar
    String roomChatId;  // Room chat ID
    String roomChatName;  // Room chat name
    LocalDateTime createdAt;
}
