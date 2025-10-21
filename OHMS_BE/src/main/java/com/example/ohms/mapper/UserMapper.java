package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.OfflineUserRequest;
import com.example.ohms.dto.request.UserRequest;
import com.example.ohms.dto.response.HideUserResponse;
import com.example.ohms.dto.response.OfflineUserResponse;
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
   
   // Offline user mappings
   @Mapping(target = "id", ignore = true)
   @Mapping(target = "password", ignore = true)
   @Mapping(target = "email", ignore = true)
   @Mapping(target = "imageUrl", ignore = true)
   @Mapping(target = "gender", ignore = true)
   @Mapping(target = "dob", ignore = true)
   @Mapping(target = "roles", ignore = true)
   @Mapping(target = "provider", ignore = true)
   @Mapping(target = "refreshToken", ignore = true)
   @Mapping(target = "resetToken", ignore = true)
   @Mapping(target = "providerId", ignore = true)
   @Mapping(target = "enabled", ignore = true)
   @Mapping(target = "medicleSpecially", ignore = true)
   @Mapping(target = "identification", ignore = true)
   User toOfflineUser(OfflineUserRequest request);
   
   OfflineUserResponse toOfflineUserResponse(User user);
}
