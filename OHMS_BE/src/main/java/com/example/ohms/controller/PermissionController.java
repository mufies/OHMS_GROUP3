package com.example.ohms.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.PermissionRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.PermissionResponse;
import com.example.ohms.service.PermissionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/permission")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionController {
   PermissionService permissionService;
   @PostMapping
   public ApiResponse<PermissionResponse> createPermission(@RequestBody PermissionRequest permissionRequest){
      return ApiResponse.<PermissionResponse>builder()
      .code(200)
      .results(permissionService.createPermission(permissionRequest))
      .build();
   }
   @DeleteMapping("delete/{id}")
   public ApiResponse<Void> deletePermission(@PathVariable("id") String id){
      permissionService.deletePermission(id);
      return ApiResponse.<Void>builder().code(200).build();
   }
   @GetMapping
   public ApiResponse<List<PermissionResponse>> getAllRPermission(){
      return ApiResponse.<List<PermissionResponse>>builder()
      .code(200)
      .results(permissionService.getAllPermission())
      .build();
   }
}
