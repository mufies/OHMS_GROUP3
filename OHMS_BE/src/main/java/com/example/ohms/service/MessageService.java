package com.example.ohms.service;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ohms.dto.request.ConversationRequest;
import com.example.ohms.dto.response.ConversationResponse;
import com.example.ohms.entity.Conversation;
import com.example.ohms.entity.RoomChat;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.ConversationMapper;
import com.example.ohms.repository.ConversationRepository;
import com.example.ohms.repository.RoomChatRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
//  hoặc chat mình sẽ dùng microservice với mongo để làm
public class MessageService {
   ConversationMapper conversationMapper;
   ConversationRepository conversationRepository;
   RoomChatRepository roomChatRepositoryl;
   UserRepository userRepository;
   
   // @PreAuthorize("isAuthenticated()")
   @Transactional
   public ConversationResponse createMessage(String roomId,ConversationRequest conversationRequest){
      Conversation conversation = conversationMapper.toConversation(conversationRequest);
      
      // Find and set the room chat
      RoomChat roomChat = roomChatRepositoryl.findById(roomId).orElseThrow(()->new AppException(ErrorCode.ROOM_CHAT_NOT_FOUND));
      conversation.setRoomChat(roomChat);
      
      // Find and set the user with roles eagerly loaded to avoid lazy initialization
      User user = userRepository.findByIdWithRoles(conversationRequest.getUser()).orElseThrow(()->new AppException(ErrorCode.USER_NOT_FOUND));
      conversation.setUser(user);
      
      conversation.setCreatedAt(LocalDateTime.now());
      conversationRepository.save(conversation);
      return conversationMapper.toConversationResponse(conversation);
   }
   // lấy message trong roomchat
   @Transactional(readOnly = true)
   public List<ConversationResponse> getMessage(String roomId){
      List<Conversation> conversations = conversationRepository.findByRoomChatIdWithUserAndRoles(roomId);
      return conversations.stream().map(conversationMapper :: toConversationResponse).toList();
   }
   // xóa message
   public Void deleteMessage(String messageId){
   // kiểm tra message quá 30p là không thể xóa
   LocalDateTime now = LocalDateTime.now();
   Conversation conversation = conversationRepository.findById(messageId).orElseThrow(()-> new AppException(ErrorCode.MESSAGE_NOT_FOUND));
   LocalDateTime converSationChat = conversation.getCreatedAt();
   if(converSationChat.plusMinutes(30).isBefore(now)){
      throw new AppException(ErrorCode.MESSAGE_CANNOT_DELETE);
   }
   conversationRepository.deleteById(messageId);
     return null;
   }
public ConversationResponse update(String messageId,ConversationRequest conversationRequest){
   // kiểm tra message quá 30p là không thể xóa
   LocalDateTime now = LocalDateTime.now();
   Conversation conversation = conversationRepository.findById(messageId).orElseThrow(()-> new AppException(ErrorCode.MESSAGE_NOT_FOUND));
   LocalDateTime converSationChat = conversation.getCreatedAt();
   if(converSationChat.plusMinutes(30).isBefore(now)){
      throw new AppException(ErrorCode.MESSAGE_CANNOT_DELETE);
   }
   conversation.setCreatedAt(LocalDateTime.now());
   conversation.setMessage(conversationRequest.getMessage());
     return conversationMapper.toConversationResponse(conversationRepository.save(conversation));
   }
   // xóa message theo room
   public Void deleteMessageByRoomId(String roomId){
      conversationRepository.deleteByRoomChatId(roomId);
      return null;
   }
}