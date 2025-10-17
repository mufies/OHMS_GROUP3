package com.example.ohms.configuration;

import java.util.List;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

@Configuration
@EnableWebSecurity
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@EnableMethodSecurity // thực tế thì đây là cách phân quyền được sử dụng phổ biển hơn trong các dự án
public class SecurityConfig {
    String [] PUBLIC={"/auth/**","/permission/**","/role/**","/users/**","/medicine/**","/bill/**","/medical-examination/**","/ws/**","/chat/**","/conversation/**","/api/v1/**","/api/**","/gemini/**","/api/gemini/**","/medical-examination/**"};
    String [] SWAGGEER_PUBLIC_ENDPOINT={"/v3/api-docs/**","/swagger-ui/**","/swagger-ui.html"};
        @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(request -> request
            .requestMatchers(SWAGGEER_PUBLIC_ENDPOINT).permitAll()
            .requestMatchers(PUBLIC).permitAll()    
            // Cho phép truy cập không cần token
                .anyRequest().authenticated()           
            );
            http.csrf(AbstractHttpConfigurer::disable);
            //         http
            // .csrf(csrf -> csrf
            //     .ignoringRequestMatchers("/ws/**") // Disable CSRF for WebSocket
            // )
            // .authorizeHttpRequests(auth -> auth
            //     .requestMatchers("/ws/**").permitAll() // Allow WebSocket handshake
            //     .requestMatchers("/chat/**").permitAll() // Allow chat API
            //     .requestMatchers("/conversation/**").permitAll() // Allow conversation API
            //     .anyRequest().authenticated()
            // );
            http.oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwtConfigurer -> jwtConfigurer.decoder(jwtDecoder())
                .jwtAuthenticationConverter(jwtAuthenticationConverter()))
                .authenticationEntryPoint(new JwtAuthenticationEntryPoint()) // khi authen fail thì điều hướng user đi đâu ? 
                // Bật xác thực JWT
                // khi chưa đăng nhập thì không được truy cập những cái cần đăng nhập, có thể nó nhảy 401 trước nên mình handle 403 trước nó
            );

        return http.build();
    }
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter(){
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
        JwtAuthenticationConverter jwtAuthenticationConverter =new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter; 
    }
   
    @Bean
    JwtDecoder jwtDecoder(){
        SecretKeySpec secretKeySpec = new SecretKeySpec("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9".getBytes(),"HS256"); // nó chính là lấy cái secret trong cái thằng authservice
        return NimbusJwtDecoder
        .withSecretKey(secretKeySpec).macAlgorithm(MacAlgorithm.HS256).build();
    }

       @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:3000")); // domain FE (React.js)
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true); // nếu FE gửi cookie/token

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    
}