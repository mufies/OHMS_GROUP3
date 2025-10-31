package com.example.ohms;

import com.example.ohms.dto.request.AuthenticationRequest;
import com.example.ohms.dto.response.AuthenticationResponse;
import com.example.ohms.entity.Role;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.AuthenticationService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for AuthenticationService
 * 
 * Test Coverage:
 * 1. loginUser()
 * 2. generateTokenFromOAuth2()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationService Test Suite")
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService authenticationService;

    // Test data
    private User user;
    private AuthenticationRequest authenticationRequest;
    private Role patientRole;

    @BeforeEach
    void setUp() {
        // Setup role
        patientRole = Role.builder()
                .name("PATIENT")
                .description("Patient role")
                .build();

        // Setup user
        user = User.builder()
                .id("U001")
                .username("John Doe")
                .email("john@test.com")
                .password("$2a$10$encodedPassword")
                .roles(Set.of(patientRole))
                .build();

        // Setup authentication request
        authenticationRequest = new AuthenticationRequest("john@test.com", "password123");
    }

    // ==================== 1. LOGIN USER TESTS ====================

    @Nested
    @DisplayName("1. loginUser()")
    class LoginUserTests {

        @Test
        @DisplayName("Should login user successfully with correct credentials")
        void shouldLoginUser_WithCorrectCredentials() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", user.getPassword()))
                    .thenReturn(true);

            // When
            AuthenticationResponse response = authenticationService.loginUser(authenticationRequest);

            // Then
            assertNotNull(response);
            assertTrue(response.isAuthenticated());
            assertNotNull(response.getToken());
            verify(userRepository).findByEmailWithRoles("john@test.com");
            verify(passwordEncoder).matches("password123", user.getPassword());
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowException_WhenUserNotFound() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                authenticationService.loginUser(authenticationRequest);
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
            verify(passwordEncoder, never()).matches(anyString(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when password is incorrect")
        void shouldThrowException_WhenPasswordIncorrect() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", user.getPassword()))
                    .thenReturn(false);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                authenticationService.loginUser(authenticationRequest);
            });

            assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should generate valid JWT token on successful login")
        void shouldGenerateValidToken_OnSuccessfulLogin() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", user.getPassword()))
                    .thenReturn(true);

            // When
            AuthenticationResponse response = authenticationService.loginUser(authenticationRequest);

            // Then
            assertNotNull(response.getToken());
            assertTrue(response.getToken().length() > 0);
            // JWT token should have 3 parts separated by dots
            String[] tokenParts = response.getToken().split("\\.");
            assertEquals(3, tokenParts.length);
        }

        @Test
        @DisplayName("Should login user with multiple roles")
        void shouldLoginUser_WithMultipleRoles() {
            // Given
            Role doctorRole = Role.builder()
                    .name("DOCTOR")
                    .description("Doctor role")
                    .build();
            
            User userWithMultipleRoles = User.builder()
                    .id("U002")
                    .username("Dr. Smith")
                    .email("doctor@test.com")
                    .password("$2a$10$encodedPassword")
                    .roles(Set.of(patientRole, doctorRole))
                    .build();

            AuthenticationRequest doctorRequest = new AuthenticationRequest("doctor@test.com", "password123");

            when(userRepository.findByEmailWithRoles("doctor@test.com"))
                    .thenReturn(Optional.of(userWithMultipleRoles));
            when(passwordEncoder.matches("password123", userWithMultipleRoles.getPassword()))
                    .thenReturn(true);

            // When
            AuthenticationResponse response = authenticationService.loginUser(doctorRequest);

            // Then
            assertNotNull(response);
            assertTrue(response.isAuthenticated());
            assertNotNull(response.getToken());
        }
    }

    // ==================== 2. GENERATE TOKEN FROM OAUTH2 TESTS ====================

    @Nested
    @DisplayName("2. generateTokenFromOAuth2()")
    class GenerateTokenFromOAuth2Tests {

        @Test
        @DisplayName("Should generate token from OAuth2 user successfully")
        void shouldGenerateToken_FromOAuth2User() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.of(user));

            // When
            String token = authenticationService.generateTokenFromOAuth2(user);

            // Then
            assertNotNull(token);
            assertTrue(token.length() > 0);
            verify(userRepository).findByEmailWithRoles("john@test.com");
        }

        @Test
        @DisplayName("Should throw exception when OAuth2 user not found in database")
        void shouldThrowException_WhenOAuth2UserNotFound() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                authenticationService.generateTokenFromOAuth2(user);
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should reload user with roles from database")
        void shouldReloadUser_WithRoles() {
            // Given
            User userWithoutRoles = User.builder()
                    .id("U001")
                    .email("john@test.com")
                    .build();

            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.of(user));

            // When
            String token = authenticationService.generateTokenFromOAuth2(userWithoutRoles);

            // Then
            assertNotNull(token);
            verify(userRepository).findByEmailWithRoles("john@test.com");
        }

        @Test
        @DisplayName("Should generate valid JWT token structure")
        void shouldGenerateValidJWTStructure() {
            // Given
            when(userRepository.findByEmailWithRoles("john@test.com"))
                    .thenReturn(Optional.of(user));

            // When
            String token = authenticationService.generateTokenFromOAuth2(user);

            // Then
            String[] parts = token.split("\\.");
            assertEquals(3, parts.length, "JWT should have header, payload, and signature");
        }
    }
}
