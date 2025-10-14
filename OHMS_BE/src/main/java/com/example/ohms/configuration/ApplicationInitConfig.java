package com.example.ohms.configuration;
import java.util.HashSet;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.ohms.entity.Role;
import com.example.ohms.entity.User;
import com.example.ohms.enums.UserRole;
import com.example.ohms.repository.PermissionRepository;
import com.example.ohms.repository.RoleRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;


@Configuration
@RequiredArgsConstructor 
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplicationInitConfig {
   final PasswordEncoder passwordEncoder;
   @Bean
   ApplicationRunner applicationRunner(UserRepository userRepository,RoleRepository roleRepository,PermissionRepository permissionRepository){ // nó luôn chạy khi app khởi động
      return args ->{
       if (userRepository.findByUsername("admin").isEmpty()) {
    // Kiểm tra nếu role ADMIN chưa có thì tạo mới
Role roleAdmin = roleRepository.findByName("ADMIN")
        .orElseGet(() -> {
            Role newRole = Role.builder()
                    .name(UserRole.ADMIN.name())
                    .build();
            return roleRepository.save(newRole);
        });


    HashSet<Role> roles = new HashSet<>();
    roles.add(roleAdmin);

    User user = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("123456789"))
            .email("admin@gmail.com")
            .roles(roles)
            .build();

    userRepository.save(user);
}  


      };
   }   
}
