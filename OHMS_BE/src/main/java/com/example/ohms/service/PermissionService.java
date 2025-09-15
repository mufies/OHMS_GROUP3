package com.example.ohms.service;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.ohms.dto.request.PermissionRequest;
import com.example.ohms.dto.response.PermissionResponse;
import com.example.ohms.entity.Permission;
import com.example.ohms.entity.Role;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.PermissionMapper;
import com.example.ohms.repository.PermissionRepository;
import com.example.ohms.repository.RoleRepository;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
@Service
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PermissionService {
   PermissionRepository permissionRepository;
   PermissionMapper permissionMapper;
   RoleRepository roleRepository;
   //  mình chưa biết nên để cái này theo 
   public PermissionResponse createPermission(PermissionRequest permissionRequest){
      Permission permission = permissionMapper.toPermission(permissionRequest);
      permission = permissionRepository.save(permission);
      return permissionMapper.toPermissionResponse(permission);
   }

   @Transactional // tránh ràng buộc quan hệ
   public void deletePermission(String name){
      Permission permission = permissionRepository.findById(name).orElseThrow(()->new AppException(ErrorCode.PERMISSION_NOT_FOUND));
      for(Role role : roleRepository.findAll() ){ // clean lại cái role
         role.getPermissions().remove(permission);
      }
      roleRepository.saveAll(roleRepository.findAll()); 
      permissionRepository.delete(permission);
   }

   public List<PermissionResponse> getAllPermission(){
      return permissionRepository.findAll().stream().map(permissionMapper :: toPermissionResponse).toList();
   }
}
