package com.example.ohms.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.ohms.dto.request.EmailRequest;
import com.example.ohms.dto.request.ResetPasswordRequest;
import com.example.ohms.dto.request.UserRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.UserResponse;
import com.example.ohms.entity.User;
import com.example.ohms.service.UserService;

import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;
// create user with role admin
   @PostMapping(value = "/createUser" , consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ApiResponse<UserResponse> createUser(
    // form data 
        @Valid @ModelAttribute UserRequest userRequestDto,
        @RequestPart(value = "avatar", required = false) MultipartFile avatar) throws IOException {
    return ApiResponse.<UserResponse>builder()
            .code(200)
            .results(userService.createUser(userRequestDto, avatar))
            .build();
}


    // register
     @PostMapping(value = "/register",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ApiResponse<UserResponse> register(
    // form data 
        @Valid @ModelAttribute UserRequest userRequestDto,
        @RequestPart(value = "avatar", required = false) MultipartFile avatar) throws IOException {
    return ApiResponse.<UserResponse>builder()
            .code(200)
            .results(userService.registerUser(userRequestDto, avatar))
            .build();
}
    // find user detail by admin,doctor,staff
    @GetMapping("/findUser/{id}")
    public ApiResponse<UserResponse> findUser(@PathVariable("id") String id){
        return ApiResponse.<UserResponse>builder()
        .code(200)
        .results(userService.findUserbyId(id))
        .build();
    }
    // admin update user
   @PatchMapping(value = "/adminUpdateUser/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> updateUserByAdmin(
        @PathVariable("id") String userId,
         @ModelAttribute UserRequest userRequestDto,   // nhận JSON string
    @RequestPart(value = "avatar", required = false) MultipartFile avatar)throws IOException{
            log.error("aaaaaaaaaaaaaa");
        return ApiResponse.<UserResponse>builder()
        .results(userService.updateUser(userId,userRequestDto,avatar ))
        .build();
    }   
    // user update chinh no
    @PatchMapping(value = "userUpdateUser/{id}",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> userUpdateUser(
        @PathVariable("id") String id,
        @ModelAttribute UserRequest userRequestDto,
        @RequestPart(value = "avatar",required = false) MultipartFile avatar
    ) throws IOException{
        return ApiResponse.<UserResponse>builder()
        .code(200)
        .results(userService.userUpdateUser(id, userRequestDto, avatar))
        .build();
    }@PostMapping("/sendResetCode")
public ApiResponse<Void> sendResetCode(@RequestBody EmailRequest request) throws MessagingException {
    log.info("{}", request.getEmail());
    return ApiResponse.<Void>builder()
        .code(200)
        .message("Send mail successful")
        .results(userService.sendCodeToEmail(request.getEmail()))
        .build();
}
@PostMapping("/resetPassword")
public ApiResponse<Void> checkTokenAndResetPass(
    @RequestBody ResetPasswordRequest request
) {
    return ApiResponse.<Void>builder()
        .results(userService.checkResetToken(request))
        .build();
}


     @GetMapping("/getinfo")
    public UserResponse getCurrentUser(Authentication authentication) {
        return userService.getDetailUser(authentication);
    }
    @GetMapping("/getListUser")
    public ApiResponse<List<UserResponse>> getListUser(){
        return ApiResponse.<List<UserResponse>>builder()
        .code(200)
        .results(userService.getListhehe())
        .build()
        ;
    }
    @GetMapping("/getListDoctor")
    public ApiResponse<List<UserResponse>> getListDoctor(){
        return ApiResponse.<List<UserResponse>>builder()
        .code(200)
        .results(userService.getListDoctor())
        .build();
    }
    @DeleteMapping(value = "/deleteUser/{userId}")
    public ApiResponse<Void> deleteUser(
        @PathVariable("userId") String id
    ){
        return ApiResponse.<Void>builder()
        .code(200)
        .results(userService.deleteUser(id))
        .build();
    }
    

    @PostMapping("/offline")
    public ApiResponse<com.example.ohms.dto.response.OfflineUserResponse> createOfflineUser(
            @Valid @RequestBody com.example.ohms.dto.request.OfflineUserRequest request) {
        log.info("REST request to create offline user");
        return ApiResponse.<com.example.ohms.dto.response.OfflineUserResponse>builder()
            .code(200)
            // .message("Offline user created successfully")
            .results(userService.createOfflineUser(request))
            .build();
    }
    
    /**
     * Lấy thông tin offline user theo số điện thoại
     * GET /users/offline/phone/{phone}
     */
    @GetMapping("/getListUserOffline")
    public ApiResponse<List<User>> getListUserOffline(){
        return ApiResponse.<List<User>>builder()
        .code(200)
        .results(userService.getListUserHoho())
        .build();
    }
    @GetMapping("/offline/phone/{phone}")
    public ApiResponse<com.example.ohms.dto.response.OfflineUserResponse> getOfflineUserByPhone(
            @PathVariable Integer phone) {
        log.info("REST request to get offline user by phone: {}", phone);
        return ApiResponse.<com.example.ohms.dto.response.OfflineUserResponse>builder()
            .code(200)
            // .message("Offline user retrieved successfully")
            .results(userService.getOfflineUserByPhone(phone))
            .build();
    }
    
    /**
     * Cập nhật thông tin offline user
     * PATCH /users/offline/{id}
     */
    @PatchMapping("/offline/{id}")
    public ApiResponse<com.example.ohms.dto.response.OfflineUserResponse> updateOfflineUser(
            @PathVariable String id,
            @Valid @RequestBody com.example.ohms.dto.request.OfflineUserRequest request) {
        log.info("REST request to update offline user: {}", id);
        return ApiResponse.<com.example.ohms.dto.response.OfflineUserResponse>builder()
            .code(200)
            // .message("Offline user updated successfully")
            .results(userService.updateOfflineUser(id, request))
            .build();
    }
}
