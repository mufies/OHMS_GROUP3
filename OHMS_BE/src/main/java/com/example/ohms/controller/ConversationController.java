package com.example.ohms.controller;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.ConversationRequest;
import com.example.ohms.dto.request.FileRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.ConversationResponse;
import com.example.ohms.service.CloudinaryService;
import com.example.ohms.service.MessageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/conversation")
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class ConversationController {
   MessageService messageService;
    SimpMessagingTemplate simpMessagingTemplate;
    CloudinaryService cloudinaryService;

   // New: Upload images via HTTP first (returns Cloudinary URLs)
   @PostMapping("/upload-images")
   public ApiResponse<List<String>> uploadImages(@RequestBody List<String> base64Images) {
      try {
         List<String> imageUrls = new ArrayList<>();
         
         if (base64Images != null && !base64Images.isEmpty()) {
            List<byte[]> imageBytesList = new ArrayList<>();
            for (String base64Data : base64Images) {
               if (base64Data.contains(",")) {
                  base64Data = base64Data.split(",")[1];  // Remove data:image/...;base64, prefix
               }
               byte[] imageBytes = Base64.getDecoder().decode(base64Data);
               imageBytesList.add(imageBytes);
            }
            
            // Upload to Cloudinary
            imageUrls = cloudinaryService.uploadMulti(imageBytesList);
            log.info("Uploaded {} images to Cloudinary", imageUrls.size());
         }
         
         return ApiResponse.<List<String>>builder()
            .code(200)
            .results(imageUrls)
            .build();
      } catch (Exception e) {
         log.error("Error uploading images: {}", e.getMessage(), e);
         return ApiResponse.<List<String>>builder()
            .code(500)
            .message("Upload failed: " + e.getMessage())
            .build();
      }
   }

//app/chat/{roomId chỗ này handle cho fontend gọi send
   @MessageMapping("chat/{roomId}")    // xác lập message bắn lên cái room
    public void sendMessage(
        @DestinationVariable("roomId") String roomId,
        @Payload ConversationRequest conversationRequest
    ) { 
        try {
            // ConversationRequest now should contain imageUrls (not base64)
            ConversationResponse conversationResponse = messageService.createMessage(
                roomId, 
                conversationRequest, 
                conversationRequest.getBase64Datas() // Reuse this field for imageUrls from frontend
            );
            simpMessagingTemplate.convertAndSend("/topic/room/" + roomId, conversationResponse);
            log.info("✅ Message sent to room {}", roomId);
        } catch (Exception e) {
            log.error("❌ Error sending message in room {}: {}", roomId, e.getMessage(), e);
            simpMessagingTemplate.convertAndSend("/topic/room/" + roomId, "Error: " + e.getMessage());
        }
    }
   //  get id from room
   @GetMapping("{roomId}")
   public ApiResponse<List<ConversationResponse>> getConversation(
      @PathVariable("roomId") String roomId
   ){
      return ApiResponse.<List<ConversationResponse>>builder()
      .code(200)
      .results(messageService.getMessage(roomId))
      .build();
   }
   
   @MessageMapping("chat/delete/{roomId}/{messageId}")
   public void deleteMessage(
      @DestinationVariable("messageId") String messageId,
      @DestinationVariable("roomId") String roomId
   ){
      messageService.deleteMessage(messageId);
      //  1 cách khác thay thế send to, cách này sẽ gửi response tới thằng roomId để thông báo là đã xóa message
      simpMessagingTemplate.convertAndSend("/topic/room/" + roomId, "deleted:" + messageId );
   }
   @MessageMapping("chat/update/{roomId}/{messageId}")
   public void updateMessage(
      @DestinationVariable String roomId,
            @DestinationVariable String messageId,
            @Payload ConversationRequest request
   ){
        ConversationResponse response = messageService.update(messageId, request);
        // broadcast lại cho room biết tin nhắn này đã được update
        simpMessagingTemplate.convertAndSend("/topic/room/" + roomId, response);
   }

   // @MessageMapping("/chat/{roomId}/file")
   // public void sendFile(
   //    @DestinationVariable("roomId") String roomId,
   //    @Payload FileRequest request
   // ) {
      
   // }
}
