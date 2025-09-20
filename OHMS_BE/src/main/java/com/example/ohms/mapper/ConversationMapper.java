package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.ConversationRequest;
import com.example.ohms.dto.response.ConversationResponse;
import com.example.ohms.entity.Conversation;

@Mapper(componentModel = "spring")
public interface ConversationMapper  {
   @Mapping(target = "roomChat", ignore = true)
   @Mapping(target = "user", ignore = true)
   @Mapping(target = "id", ignore = true)
   @Mapping(target = "createdAt", ignore = true)
   Conversation toConversation(ConversationRequest conversationRequest);
   // nhớ check lại chỗ này xíu, vì mình để thời gi
   ConversationResponse toConversationResponse(Conversation conversation);
}
