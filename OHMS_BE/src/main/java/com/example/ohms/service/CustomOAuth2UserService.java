package com.example.ohms.service;

import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;  // Thêm import

import com.example.ohms.entity.User;
import com.example.ohms.entity.Role;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.repository.RoleRepository;
import com.example.ohms.enums.AuthProvider;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public CustomOAuth2UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional  // Thêm: Mở transaction như UserService (readOnly=false mặc định cho write/save)
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        // Lấy thông tin từ Google
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String pictureUrl = oauth2User.getAttribute("picture");

        // Dùng findByEmailWithRoles cho existing user (eager roles)
        User user = userRepository.findByEmailWithRoles(email)
            .map(existingUser -> {
                existingUser.setUsername(name);
                existingUser.setImageUrl(pictureUrl);
                return userRepository.save(existingUser);  // Save trong tx
            })
            .orElseGet(() -> {
    User newUser = new User();
    newUser.setEmail(email);
    newUser.setUsername(name);
    newUser.setImageUrl(pictureUrl);
    newUser.setAuthProvider(AuthProvider.GOOGLE);
    newUser.setEnabled(true);  // <-- Thêm này: Enable user mới ngay
    // Lấy role PATIENT...
    Role clientRole = roleRepository.findByName("PATIENT")
        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
    newUser.setRoles(Set.of(clientRole));
    return userRepository.save(newUser);
});
         
        // Build authorities từ roles (đã load)
        Set<GrantedAuthority> authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .collect(Collectors.toSet());

        return new DefaultOAuth2User(authorities, oauth2User.getAttributes(), "email");
    }
}