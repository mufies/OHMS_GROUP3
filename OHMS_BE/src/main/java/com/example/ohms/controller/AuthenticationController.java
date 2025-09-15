package com.example.ohms.controller;

import java.text.ParseException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.AuthenticationRequest;
import com.example.ohms.dto.request.IntroSpectRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.AuthenticationResponse;
import com.example.ohms.dto.response.IntroSpectResponse;
import com.example.ohms.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class AuthenticationController {
   AuthenticationService authenticationService;
   // login
   @PostMapping("/login")
   public ApiResponse<AuthenticationResponse> loginUser(@RequestBody AuthenticationRequest authenticationRequest){
      return ApiResponse.<AuthenticationResponse>builder()
      .code(200)
      .results(authenticationService.loginUser(authenticationRequest))
      .build();
   }
   // check token
   @PostMapping("/introspect")
   public ApiResponse<IntroSpectResponse> introspectToken(@RequestBody IntroSpectRequest introSpectRequest)throws JOSEException,ParseException{
      return ApiResponse.<IntroSpectResponse>builder()
      .code(200)
      .results(authenticationService.introspect(introSpectRequest))
      .build();
   }
}
