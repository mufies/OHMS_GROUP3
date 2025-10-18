package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.UserRequest;
import com.example.ohms.dto.response.HideUserResponse;
import com.example.ohms.dto.response.UserResponse;
import com.example.ohms.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
   @Mapping(target = "roles",ignore = true)
   @Mapping(target = "id",ignore = true)
   @Mapping(target = "imageUrl",ignore = true)
   @Mapping(target = "resetToken",ignore = true)
   // identification, medicleSpecially, phone
   @Mapping(target = "identification",ignore = true)
   User toUser(UserRequest userRequestDto);
   UserResponse toUserResponseDto(User user);
   
   HideUserResponse toUserHideResponse(User user);
}
