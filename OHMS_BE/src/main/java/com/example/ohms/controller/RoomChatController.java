package com.example.ohms.controller;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.RoomChatRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.RoomChatResponse;
import com.example.ohms.service.RoomChatService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
public class RoomChatController {
   RoomChatService roomChatService;

   @PostMapping()
   public ApiResponse<RoomChatResponse> createRoomChat(
      @RequestBody RoomChatRequest roomChatRequest
   ){
      return ApiResponse.<RoomChatResponse>builder()
      .code(200)
      .results(roomChatService.createRoomChat(roomChatRequest))
      .build();
   }
   @GetMapping("{id1}/{id2}")
   public ApiResponse<RoomChatResponse> checkRoomChat(
      @PathVariable("id1") String id1,
      @PathVariable("id2") String id2
   ){
      return ApiResponse.<RoomChatResponse>builder()
      .results(roomChatService.getExistingRoomChat(id1, id2))
      .build();
   }

   //id nay la cua user hay gi day
   @GetMapping("{id}")
   public ApiResponse<List<RoomChatResponse>> getListRommchat(
      @PathVariable("id") String id
   ){
      return ApiResponse.<List<RoomChatResponse>>builder()
      .code(200)
      .results(roomChatService.getListRoomChat(id))
      .build();
   }


}
