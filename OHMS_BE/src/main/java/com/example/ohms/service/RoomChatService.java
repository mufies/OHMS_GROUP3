package com.example.ohms.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.example.ohms.dto.request.RoomChatRequest;
import com.example.ohms.dto.response.RoomChatResponse;
import com.example.ohms.entity.RoomChat;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.RoomChatMapper;
import com.example.ohms.repository.RoomChatRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class RoomChatService {
   RoomChatRepository roomChatRepository;
   RoomChatMapper roomChatMapper;
   MessageService messageService;
   UserRepository userRepository; // Thêm UserRepository
   
   // tạo room chat 
   @PreAuthorize("isAuthenticated()")
   public RoomChatResponse createRoomChat(RoomChatRequest roomChatRequest){
      RoomChat roomChat = roomChatMapper.toRoomChat(roomChatRequest);
      
      // Fetch User entities từ userIds trong request
      if (roomChatRequest.getUser() != null && !roomChatRequest.getUser().isEmpty()) {
         Set<User> users = new HashSet<>();
         for (String userId : roomChatRequest.getUser()) {
            User user = userRepository.findById(userId)
               .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            users.add(user);
         }
         roomChat.setUser(users);
         log.info("Added {} users to room chat", users.size());
      }
      
      RoomChat savedRoom = roomChatRepository.save(roomChat);
      log.info("✅ Room chat created with id: {} and {} users", savedRoom.getId(), savedRoom.getUser().size());
      
      return roomChatMapper.toRoomChatResponse(savedRoom);
   }
   // xóa room chat thì xóa luôn cả message
   @PreAuthorize("isAuthenticated()")
   public Void deleteRoomChat(String roomId){
      messageService.deleteMessageByRoomId(roomId);
      roomChatRepository.deleteById(roomId);
      return null;
   }
   
  public RoomChatResponse getExistingRoomChat(String userId1, String userId2) {
    RoomChat room = roomChatRepository.findRoomByTwoUsers(userId1, userId2)
        .orElseThrow(() -> new AppException(ErrorCode.ROOM_CHAT_NOT_FOUND));
    return roomChatMapper.toRoomChatResponse(room);
}
   @PreAuthorize("isAuthenticated()")
   public List<RoomChatResponse> getListRoomChat(String userId) {
      List<RoomChat> roomChats = roomChatRepository.findByUser_Id(userId);
      return roomChats.stream()
            .map(roomChatMapper::toRoomChatResponse)
            .toList();
}
 
}
