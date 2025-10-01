// package com.example.ohms.service;

// import java.io.IOException;
// import java.util.List;

// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import com.example.ohms.dto.request.FileRequest;
// import com.example.ohms.dto.response.FileResponse;
// import com.example.ohms.entity.File;
// import com.example.ohms.entity.RoomChat;
// import com.example.ohms.entity.User;
// import com.example.ohms.exception.AppException;
// import com.example.ohms.exception.ErrorCode;
// import com.example.ohms.mapper.FileMapper;
// import com.example.ohms.repository.FileRepository;
// import com.example.ohms.repository.RoomChatRepository;
// import com.example.ohms.repository.UserRepository;

// import lombok.AccessLevel;
// import lombok.RequiredArgsConstructor;
// import lombok.experimental.FieldDefaults;
// import lombok.extern.slf4j.Slf4j;

// @Service
// @RequiredArgsConstructor
// @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
// @Slf4j
// public class FileService {
    
//     FileRepository fileRepository;
//     UserRepository userRepository;
//     RoomChatRepository roomChatRepository;
//     FileMapper fileMapper;
//     CloudinaryService cloudinaryService;
    
//     // Upload file
//     public FileResponse uploadFile(MultipartFile file, FileRequest fileRequest) throws IOException {
//         log.info("Uploading file: {}", file.getOriginalFilename());
        
//         // Validate user exists
//         User user = userRepository.findById(fileRequest.getUserId())
//                 .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                
//         // Validate room chat exists
//         RoomChat roomChat = roomChatRepository.findById(fileRequest.getRoomChatId())
//                 .orElseThrow(() -> new AppException(ErrorCode.ROOM_CHAT_NOT_FOUND));
        
//         // Upload file to Cloudinary
//         String fileUrl = cloudinaryService.uploadFile(file);
        
//         // Create file entity
//         File fileEntity = File.builder()
//                 .fileName(file.getOriginalFilename())
//                 .fileLocation(fileUrl)
//                 .user(user)
//                 .roomChat(roomChat)
//                 .build();
        
//         File savedFile = fileRepository.save(fileEntity);
//         return fileMapper.toFileResponse(savedFile);
//     }
    
//     // Get file by ID
//     public FileResponse getFileById(String fileId) {
//         File file = fileRepository.findByIdWithDetails(fileId)
//                 .orElseThrow(() -> new AppException(ErrorCode.UNKNOWN_ERROR));
//         return fileMapper.toFileResponse(file);
//     }
    
//     // Get files by room chat ID
//     public List<FileResponse> getFilesByRoomChatId(String roomChatId) {
//         List<File> files = fileRepository.findByRoomChatIdWithUserDetails(roomChatId);
//         return files.stream()
//                 .map(fileMapper::toFileResponse)
//                 .toList();
//     }
    
//     // Get files by user ID
//     public List<FileResponse> getFilesByUserId(String userId) {
//         List<File> files = fileRepository.findByUserId(userId);
//         return files.stream()
//                 .map(fileMapper::toFileResponse)
//                 .toList();
//     }
    
//     // Search files by name
//     public List<FileResponse> searchFilesByName(String fileName) {
//         List<File> files = fileRepository.findByFileNameContainingIgnoreCase(fileName);
//         return files.stream()
//                 .map(fileMapper::toFileResponse)
//                 .toList();
//     }
    
//     // Get files by room chat and user
//     public List<FileResponse> getFilesByRoomChatAndUser(String roomChatId, String userId) {
//         List<File> files = fileRepository.findByRoomChatIdAndUserId(roomChatId, userId);
//         return files.stream()
//                 .map(fileMapper::toFileResponse)
//                 .toList();
//     }
    
//     // Delete file
//     public void deleteFile(String fileId) {
//         File file = fileRepository.findById(fileId)
//                 .orElseThrow(() -> new AppException(ErrorCode.UNKNOWN_ERROR));
        
//         // TODO: Delete file from Cloudinary as well
//         // cloudinaryService.deleteFile(file.getFileLocation());
        
//         fileRepository.delete(file);
//     }
    
//     // Get all files
//     public List<FileResponse> getAllFiles() {
//         List<File> files = fileRepository.findAll();
//         return files.stream()
//                 .map(fileMapper::toFileResponse)
//                 .toList();
//     }
// }