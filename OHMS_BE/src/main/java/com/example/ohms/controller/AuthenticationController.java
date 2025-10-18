package com.example.ohms.controller;

import java.text.ParseException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.AuthenticationRequest;
import com.example.ohms.dto.request.IntroSpectRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.AuthenticationResponse;
import com.example.ohms.dto.response.IntroSpectResponse;
import com.example.ohms.security.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.example.ohms.service.AuthenticationService;
import com.example.ohms.utils.CookieUtils;
import com.nimbusds.jose.JOSEException;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class AuthenticationController {
   AuthenticationService authenticationService;
   HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;
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
@PostMapping("/logout")
public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
    log.info("Logout initiated – Clearing session and cookies");

    // Bỏ session.invalidate() vì STATELESS (nếu cần, check config)

    // Clear OAuth cookies qua repo
    httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

    // Explicit clear JSESSIONID nếu có (dù stateless)
    Cookie sessionCookie = new Cookie("JSESSIONID", null);
    sessionCookie.setPath("/");
    sessionCookie.setMaxAge(0);
    sessionCookie.setHttpOnly(true);
    sessionCookie.setSecure(false);  // Match localhost
    sessionCookie.setDomain("localhost");  // Thêm domain
    response.addCookie(sessionCookie);

    // Fix: Explicit loop clear tất cả OAuth-related cookies (state, redirect_uri, auth_request)
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
        for (Cookie cookie : cookies) {
            String name = cookie.getName();
            if (name.startsWith("oauth2_") || "JSESSIONID".equals(name)) {  // Catch all oauth2_*
                CookieUtils.deleteCookie(request, response, name);  // Dùng CookieUtils fix (secure=false, value=null)
                log.debug("Explicitly cleared cookie: {}", name);
            }
        }
    }

    log.info("Logout completed – All cookies cleared");
    return ResponseEntity.ok("Logged out successfully");
}
   // extent-token
}
