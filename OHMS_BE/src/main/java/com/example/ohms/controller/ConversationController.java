package com.example.ohms.controller;
import java.util.List;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.ConversationRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.ConversationResponse;
import com.example.ohms.service.MessageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/conversation")
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
public class ConversationController {
   MessageService messageService;
    SimpMessagingTemplate simpMessagingTemplate;
//app/chat/{roomId chỗ này handle cho fontend gọi send
   @MessageMapping("chat/{roomId}")    // xác lập message bắn lên cái room
   
   public void sendMessage(
      @DestinationVariable("roomId") String roomId,
      @Payload ConversationRequest conversationRequest
   ){ 
      ConversationResponse conversationResponse = messageService.createMessage(roomId, conversationRequest);
      simpMessagingTemplate.convertAndSend("/topic/room/" + roomId, conversationResponse);
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
}
