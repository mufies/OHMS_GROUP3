// package com.example.ohms.controller;

// import java.io.IOException;
// import java.util.List;

// import org.springframework.http.MediaType;
// import org.springframework.web.bind.annotation.DeleteMapping;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.ModelAttribute;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RequestPart;
// import org.springframework.web.bind.annotation.RestController;
// import org.springframework.web.multipart.MultipartFile;

// import com.example.ohms.dto.request.FileRequest;
// import com.example.ohms.dto.response.ApiResponse;
// import com.example.ohms.dto.response.FileResponse;
// import com.example.ohms.service.FileService;

// import jakarta.validation.Valid;
// import lombok.AccessLevel;
// import lombok.RequiredArgsConstructor;
// import lombok.experimental.FieldDefaults;
// import lombok.extern.slf4j.Slf4j;

// @RestController
// @RequestMapping("/files")
// @RequiredArgsConstructor
// @Slf4j
// @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
// public class FileController {
    
//     FileService fileService;
    
//     // Upload file
//     @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//     public ApiResponse<FileResponse> uploadFile(
//             @Valid @ModelAttribute FileRequest fileRequest,
//             @RequestPart(value = "file", required = true) MultipartFile file) throws IOException {
//         return ApiResponse.<FileResponse>builder()
//                 .code(200)
//                 .message("File uploaded successfully")
//                 .results(fileService.uploadFile(file, fileRequest))
//                 .build();
//     }
    
//     // Get file by ID
//     @GetMapping("/{fileId}")
//     public ApiResponse<FileResponse> getFileById(@PathVariable String fileId) {
//         return ApiResponse.<FileResponse>builder()
//                 .code(200)
//                 .results(fileService.getFileById(fileId))
//                 .build();
//     }
    
//     // Get files by room chat ID
//     @GetMapping("/room/{roomChatId}")
//     public ApiResponse<List<FileResponse>> getFilesByRoomChatId(@PathVariable String roomChatId) {
//         return ApiResponse.<List<FileResponse>>builder()
//                 .code(200)
//                 .results(fileService.getFilesByRoomChatId(roomChatId))
//                 .build();
//     }
    
//     // Get files by user ID
//     @GetMapping("/user/{userId}")
//     public ApiResponse<List<FileResponse>> getFilesByUserId(@PathVariable String userId) {
//         return ApiResponse.<List<FileResponse>>builder()
//                 .code(200)
//                 .results(fileService.getFilesByUserId(userId))
//                 .build();
//     }
    
//     // Get files by room chat and user
//     @GetMapping("/room/{roomChatId}/user/{userId}")
//     public ApiResponse<List<FileResponse>> getFilesByRoomChatAndUser(
//             @PathVariable String roomChatId,
//             @PathVariable String userId) {
//         return ApiResponse.<List<FileResponse>>builder()
//                 .code(200)
//                 .results(fileService.getFilesByRoomChatAndUser(roomChatId, userId))
//                 .build();
//     }
    
//     // Search files by name
//     @GetMapping("/search")
//     public ApiResponse<List<FileResponse>> searchFilesByName(@RequestParam String fileName) {
//         return ApiResponse.<List<FileResponse>>builder()
//                 .code(200)
//                 .results(fileService.searchFilesByName(fileName))
//                 .build();
//     }
    
//     // Get all files
//     @GetMapping
//     public ApiResponse<List<FileResponse>> getAllFiles() {
//         return ApiResponse.<List<FileResponse>>builder()
//                 .code(200)
//                 .results(fileService.getAllFiles())
//                 .build();
//     }
    
//     // Delete file
//     @DeleteMapping("/{fileId}")
//     public ApiResponse<Void> deleteFile(@PathVariable String fileId) {
//         fileService.deleteFile(fileId);
//         return ApiResponse.<Void>builder()
//                 .code(200)
//                 .message("File deleted successfully")
//                 .build();
//     }
// }