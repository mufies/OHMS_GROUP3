package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.RoomChatRequest;
import com.example.ohms.dto.response.RoomChatResponse;
import com.example.ohms.entity.RoomChat;

@Mapper(componentModel = "spring")
public interface RoomChatMapper {
   @Mapping(target = "user", ignore = true)
   @Mapping(target = "id", ignore = true)
   RoomChat toRoomChat(RoomChatRequest roomChatRequest);
   
   @Mapping(source = "id", target = "roomChatID")
   RoomChatResponse toRoomChatResponse(RoomChat roomChat);
}
