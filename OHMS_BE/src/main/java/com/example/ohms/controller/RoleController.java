package com.example.ohms.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.RoleRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.RoleResponse;
import com.example.ohms.entity.Role;
import com.example.ohms.service.RoleService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/role")
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
public class RoleController {
   RoleService roleService;
   
   @PostMapping
   public ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest roleRequest){
      return ApiResponse.<RoleResponse>builder()
      .results(roleService.createRole(roleRequest)).code(200)
      .build();
   }
   @DeleteMapping("{id}")
   public ApiResponse<Void> deleteRole(@PathVariable("id")String id){
      return ApiResponse.<Void>builder()
      .code(200).message("Delete Success").build();
   }
      @GetMapping
   public ApiResponse<List<RoleResponse>> getAllRole(){
      return ApiResponse.<List<RoleResponse>>builder()
      .code(200)
      .results(roleService.getAllRole())
      .build();
   }
   @GetMapping("{roleId}") 
   public ApiResponse<Role> getdatail(@PathVariable("roleId") String id){
      return ApiResponse.<Role>builder()
      .code(200)
      .results(roleService.getdetail(id))
      .build();
   }
}
