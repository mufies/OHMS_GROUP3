package com.example.ohms.mapper;

import org.mapstruct.Mapper;

import com.example.ohms.dto.request.PermissionRequest;
import com.example.ohms.dto.response.PermissionResponse;
import com.example.ohms.entity.Permission;
@Mapper(componentModel = "spring")
public interface PermissionMapper {
   Permission  toPermission(PermissionRequest permissionRequest);
   PermissionResponse toPermissionResponse(Permission permission);
}
