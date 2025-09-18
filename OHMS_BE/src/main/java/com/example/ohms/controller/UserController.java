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

import com.example.ohms.dto.request.UserRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.UserResponse;
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
    // find user detail by admin
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
    }
    @PostMapping("/sendResetCode")
    public ApiResponse<Void> sendResetCode(@RequestBody String email)throws MessagingException{
        return ApiResponse.<Void>builder()
        .code(200)
        .message("Send mail successful")
        .results(userService.sendCodeToEmail(email))
        .build();
    }
    @PostMapping("/resetPassword")
    public ApiResponse<Void> checkTokenAndResetPass(
        @RequestBody String token,
        @RequestBody String newPassword
    ){
        return ApiResponse.<Void>builder()
        .results(userService.checkResetToken(token, newPassword))
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
}