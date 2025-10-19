package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.ConversationRequest;
import com.example.ohms.dto.response.ConversationResponse;
import com.example.ohms.entity.Conversation;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface ConversationMapper  {
   @Mapping(target = "roomChat", ignore = true)
   @Mapping(target = "user", ignore = true)  
   @Mapping(target = "id", ignore = true)
   @Mapping(target = "createdAt", ignore = true)
   @Mapping(target = "imageUrls", ignore = true)
   Conversation toConversation(ConversationRequest conversationRequest);
   
   ConversationResponse toConversationResponse(Conversation conversation);
}
