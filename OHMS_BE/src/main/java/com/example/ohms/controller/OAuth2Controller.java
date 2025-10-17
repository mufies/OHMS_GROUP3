package com.example.ohms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.AuthenticationResponse;
import com.example.ohms.service.AuthenticationService;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/auth/oauth2")
public class OAuth2Controller {

    @Autowired
    private AuthenticationService authenticationService;

 @GetMapping("/success")
public void loginSuccess(@AuthenticationPrincipal OAuth2User oauth2User, HttpServletResponse response) throws Exception {
    AuthenticationResponse authResponse = authenticationService.createTokenFromOAuth2User(oauth2User);
    String redirectUrl = "http://localhost:5173/oauth2/redirect?token=" + authResponse.getToken();
    response.sendRedirect(redirectUrl);
}


    @GetMapping("/failure")
    public void loginFailure(HttpServletResponse response) throws Exception {
        String redirectUrl = "http://localhost:5173/login?error=oauth2_failure";
        response.sendRedirect(redirectUrl);
    }
}