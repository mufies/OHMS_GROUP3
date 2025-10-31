package com.example.ohms;

import com.example.ohms.dto.request.ChangePasswordRequest;
import com.example.ohms.dto.request.OfflineUserRequest;
import com.example.ohms.dto.request.ResetPasswordRequest;
import com.example.ohms.dto.request.UserRequest;
import com.example.ohms.dto.response.OfflineUserResponse;
import com.example.ohms.dto.response.UserResponse;
import com.example.ohms.entity.Role;
import com.example.ohms.entity.User;
import com.example.ohms.enums.MedicalSpecialty;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.UserMapper;
import com.example.ohms.repository.RoleRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.CloudinaryService;
import com.example.ohms.service.MailService;
import com.example.ohms.service.RoleService;
import com.example.ohms.service.UserService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for UserService
 * 
 * Test Coverage:
 * 1. createUser()
 * 2. registerUser()
 * 3. updateUser()
 * 4. userUpdateUser()
 * 5. deleteUser()
 * 6. changePassword()
 * 7. sendCodeToEmail()
 * 8. checkResetToken()
 * 9. updateUserBankInfo()
 * 10. getListDoctor()
 * 11. createOfflineUser()
 * 12. getOfflineUserByPhone()
 * 13. updateOfflineUser()
 * 14. getListUserHoho()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Test Suite")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private CloudinaryService cloudinaryService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MailService mailService;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private UserService userService;

    // Test data
    private User user;
    private UserRequest userRequest;
    private UserResponse userResponse;
    private Role patientRole;
    private Role doctorRole;
    private Role offlinePatientRole;
    private MultipartFile avatarFile;

    @BeforeEach
    void setUp() {
        // Setup roles
        patientRole = Role.builder()
                .name("PATIENT")
                .description("Patient role")
                .build();

        doctorRole = Role.builder()
                .name("DOCTOR")
                .description("Doctor role")
                .build();

        offlinePatientRole = Role.builder()
                .name("OFFLINE_PATIENT")
                .description("Offline patient role")
                .build();

        // Setup user
        user = User.builder()
                .id("U001")
                .username("John Doe")
                .email("john@test.com")
                .phone(123456789)
                .password("encodedPassword")
                .roles(Set.of(patientRole))
                .imageUrl("http://example.com/avatar.jpg")
                .build();

        // Setup user request
        userRequest = UserRequest.builder()
                .username("John Doe")
                .email("john@test.com")
                .phone(123456789)
                .password("password123")
                .roles(Set.of("PATIENT"))
                .imageUrls(null)
                .dob(null)
                .gender(null)
                .bankNumber(null)
                .bankName(null)
                .medicleSpecially(null)
                .build();

        // Setup user response
        userResponse = UserResponse.builder()
                .id("U001")
                .username("John Doe")
                .email("john@test.com")
                .password(null)
                .imageUrl("http://example.com/avatar.jpg")
                .roles(null)
                .phone(123456789)
                .gender(null)
                .dob(null)
                .bankNumber(null)
                .bankName(null)
                .medicleSpecially(null)
                .build();

        // Mock avatar file
        avatarFile = mock(MultipartFile.class);
    }

    // ==================== 1. CREATE USER TESTS ====================

    @Nested
    @DisplayName("1. createUser()")
    class CreateUserTests {

        @Test
        @DisplayName("Should create user with avatar successfully")
        void shouldCreateUser_WithAvatar() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(userRequest)).thenReturn(user);
            when(avatarFile.isEmpty()).thenReturn(false);
            when(cloudinaryService.uploadFile(avatarFile)).thenReturn("http://cloudinary.com/avatar.jpg");
            when(passwordEncoder.encode(userRequest.getPassword())).thenReturn("encodedPassword");
            when(roleService.getdetail("PATIENT")).thenReturn(patientRole);
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.createUser(userRequest, avatarFile);

            // Then
            assertNotNull(response);
            assertEquals("U001", response.getId());
            verify(cloudinaryService).uploadFile(avatarFile);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should create user without avatar")
        void shouldCreateUser_WithoutAvatar() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(userRequest)).thenReturn(user);
            when(passwordEncoder.encode(userRequest.getPassword())).thenReturn("encodedPassword");
            when(roleService.getdetail("PATIENT")).thenReturn(patientRole);
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.createUser(userRequest, null);

            // Then
            assertNotNull(response);
            verify(cloudinaryService, never()).uploadFile(any());
        }

        @Test
        @DisplayName("Should create doctor with medical specialties")
        void shouldCreateDoctor_WithSpecialties() throws IOException {
            // Given
            UserRequest doctorRequest = UserRequest.builder()
                    .username("Dr. Smith")
                    .email("doctor@test.com")
                    .phone(987654321)
                    .password("password123")
                    .roles(Set.of("DOCTOR"))
                    .medicleSpecially(Set.of(MedicalSpecialty.CARDIOLOGY))
                    .imageUrls(null)
                    .dob(null)
                    .gender(null)
                    .bankNumber(null)
                    .bankName(null)
                    .build();

            User doctorUser = User.builder()
                    .id("D001")
                    .username("Dr. Smith")
                    .email("doctor@test.com")
                    .phone(987654321)
                    .password("encodedPassword")
                    .roles(Set.of(doctorRole))
                    .medicleSpecially(Set.of(MedicalSpecialty.CARDIOLOGY))
                    .build();

            when(userRepository.findByEmail(doctorRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(doctorRequest)).thenReturn(doctorUser);
            when(passwordEncoder.encode(doctorRequest.getPassword())).thenReturn("encodedPassword");
            when(roleService.getdetail("DOCTOR")).thenReturn(doctorRole);
            when(userRepository.save(any(User.class))).thenReturn(doctorUser);
            when(userMapper.toUserResponseDto(doctorUser)).thenReturn(userResponse);

            // When
            UserResponse response = userService.createUser(doctorRequest, null);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowException_WhenEmailExists() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.of(user));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.createUser(userRequest, null);
            });

            assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when role not found")
        void shouldThrowException_WhenRoleNotFound() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(userRequest)).thenReturn(user);
            when(passwordEncoder.encode(userRequest.getPassword())).thenReturn("encodedPassword");
            when(roleService.getdetail("PATIENT")).thenThrow(new AppException(ErrorCode.ROLE_NOT_FOUND));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.createUser(userRequest, null);
            });

            assertEquals(ErrorCode.ROLE_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 2. REGISTER USER TESTS ====================

    @Nested
    @DisplayName("2. registerUser()")
    class RegisterUserTests {

        @Test
        @DisplayName("Should register user as PATIENT by default")
        void shouldRegisterUser_AsPatient() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(userRequest)).thenReturn(user);
            when(roleRepository.findByName("PATIENT")).thenReturn(Optional.of(patientRole));
            when(passwordEncoder.encode(userRequest.getPassword())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.registerUser(userRequest, null);

            // Then
            assertNotNull(response);
            verify(roleRepository).findByName("PATIENT");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should register user with avatar")
        void shouldRegisterUser_WithAvatar() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(userRequest)).thenReturn(user);
            when(avatarFile.isEmpty()).thenReturn(false);
            when(cloudinaryService.uploadFile(avatarFile)).thenReturn("http://cloudinary.com/avatar.jpg");
            when(roleRepository.findByName("PATIENT")).thenReturn(Optional.of(patientRole));
            when(passwordEncoder.encode(userRequest.getPassword())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.registerUser(userRequest, avatarFile);

            // Then
            assertNotNull(response);
            verify(cloudinaryService).uploadFile(avatarFile);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when PATIENT role not found")
        void shouldThrowException_WhenPatientRoleNotFound() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.empty());
            when(userMapper.toUser(userRequest)).thenReturn(user);
            when(roleRepository.findByName("PATIENT")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.registerUser(userRequest, null);
            });

            assertEquals(ErrorCode.ROLE_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when email exists")
        void shouldThrowException_WhenEmailExistsOnRegister() throws IOException {
            // Given
            when(userRepository.findByEmail(userRequest.getEmail())).thenReturn(Optional.of(user));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.registerUser(userRequest, null);
            });

            assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
        }
    }

    // ==================== 3. UPDATE USER TESTS (ADMIN) ====================

    @Nested
    @DisplayName("3. updateUser() - Admin Update")
    class UpdateUserTests {

        @Test
        @DisplayName("Should update user successfully")
        void shouldUpdateUser_Successfully() throws IOException {
            // Given
            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(roleRepository.findById("PATIENT")).thenReturn(Optional.of(patientRole));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.updateUser("U001", userRequest, null);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should update user with avatar and delete old one")
        void shouldUpdateUser_WithAvatarAndDeleteOld() throws IOException {
            // Given
            user.setImageUrl("http://cloudinary.com/upload/v123456789/old_avatar.jpg");
            
            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(avatarFile.isEmpty()).thenReturn(false);
            when(cloudinaryService.uploadFile(avatarFile)).thenReturn("http://cloudinary.com/new_avatar.jpg");
            when(roleRepository.findById("PATIENT")).thenReturn(Optional.of(patientRole));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.updateUser("U001", userRequest, avatarFile);

            // Then
            assertNotNull(response);
            verify(cloudinaryService).uploadFile(avatarFile);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should update user medical specialties")
        void shouldUpdateUser_WithMedicalSpecialties() throws IOException {
            // Given
            UserRequest updateRequest = UserRequest.builder()
                    .username("Dr. Updated")
                    .email("updated@test.com")
                    .phone(111222333)
                    .medicleSpecially(Set.of(MedicalSpecialty.CARDIOLOGY, MedicalSpecialty.NEUROLOGY))
                    .roles(Set.of("DOCTOR"))
                    .build();

            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(roleRepository.findById("DOCTOR")).thenReturn(Optional.of(doctorRole));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.updateUser("U001", updateRequest, null);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should clear roles when empty set provided")
        void shouldUpdateUser_ClearRoles() throws IOException {
            // Given
            UserRequest updateRequest = UserRequest.builder()
                    .username("John Doe")
                    .email("john@test.com")
                    .roles(Set.of()) // Empty set
                    .build();

            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.updateUser("U001", updateRequest, null);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user not found for update")
        void shouldThrowException_WhenUserNotFoundForUpdate() throws IOException {
            // Given
            when(userRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            assertThrows(AppException.class, () -> {
                userService.updateUser("INVALID_ID", userRequest, null);
            });
        }
    }

    // ==================== 4. USER UPDATE USER TESTS ====================

    @Nested
    @DisplayName("4. userUpdateUser() - User Self Update")
    class UserUpdateUserTests {

        @Test
        @DisplayName("Should update own profile successfully")
        void shouldUserUpdateUser_Successfully() throws IOException {
            // Given
            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.userUpdateUser("U001", userRequest, null);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should update avatar and delete old one")
        void shouldUserUpdateUser_WithAvatarDeleteOld() throws IOException {
            // Given
            String oldImageUrl = "http://cloudinary.com/upload/v123456789/folder/old_avatar.jpg";
            String expectedPublicId = "folder/old_avatar";
            
            user.setImageUrl(oldImageUrl);
            
            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(avatarFile.isEmpty()).thenReturn(false);
            when(cloudinaryService.uploadFile(avatarFile))
                .thenReturn("http://cloudinary.com/new_avatar.jpg");
            when(cloudinaryService.deleteFile(expectedPublicId)).thenReturn("ok"); // Change here!
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.userUpdateUser("U001", userRequest, avatarFile);

            // Then
            assertNotNull(response);
            verify(cloudinaryService).deleteFile(expectedPublicId); // Still verify with exact value
            verify(cloudinaryService).uploadFile(avatarFile);
            verify(userRepository).save(any(User.class));
        }



        @Test
        @DisplayName("Should update DOB and gender")
        void shouldUserUpdateUser_WithDobAndGender() throws IOException {
            // Given
            UserRequest updateRequest = UserRequest.builder()
                    .username("John Doe")
                    .dob(new java.sql.Date(System.currentTimeMillis()))
                    .gender("Male")
                    .build();

            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.userUpdateUser("U001", updateRequest, null);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }
    }

    // ==================== 5. DELETE USER TESTS ====================

    @Nested
    @DisplayName("5. deleteUser()")
    class DeleteUserTests {

        @Test
        @DisplayName("Should delete user successfully")
        void shouldDeleteUser_Successfully() {
            // Given
            doNothing().when(userRepository).deleteById("U001");

            // When
            Void result = userService.deleteUser("U001");

            // Then
            assertNull(result);
            verify(userRepository).deleteById("U001");
        }
    }

    // ==================== 6. CHANGE PASSWORD TESTS ====================

    @Nested
    @DisplayName("6. changePassword()")
    class ChangePasswordTests {

        @Test
        @DisplayName("Should change password successfully")
        void shouldChangePassword_Successfully() {
            // Given
            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("password123");
            request.setNewPassword("newPassword123");
            request.setConfirmPassword("newPassword123");

            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("password123", user.getPassword())).thenReturn(true);
            when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(user);

            // When
            userService.changePassword("U001", request);

            // Then
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when old password incorrect")
        void shouldThrowException_WhenOldPasswordIncorrect() {
            // Given
            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("wrongPassword");
            request.setNewPassword("newPassword123");
            request.setConfirmPassword("newPassword123");

            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrongPassword", user.getPassword())).thenReturn(false);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.changePassword("U001", request);
            });

            assertEquals(ErrorCode.PASSWORD_INVALID, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when new password and confirm password do not match")
        void shouldThrowException_WhenPasswordsDoNotMatch() {
            // Given
            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("password123");
            request.setNewPassword("newPassword123");
            request.setConfirmPassword("differentPassword");

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.changePassword("U001", request);
            });

            assertEquals(ErrorCode.NEWPASSNOTEQUALS, exception.getErrorCode());
            verify(passwordEncoder, never()).matches(anyString(), anyString());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowException_WhenUserNotFound() {
            // Given
            ChangePasswordRequest request = new ChangePasswordRequest();
            request.setOldPassword("password123");
            request.setNewPassword("newPassword123");
            request.setConfirmPassword("newPassword123");

            when(userRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.changePassword("INVALID_ID", request);
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 7. SEND CODE TO EMAIL TESTS ====================

    @Nested
    @DisplayName("7. sendCodeToEmail()")
    class SendCodeToEmailTests {

        @Test
        @DisplayName("Should send reset code to email successfully")
        void shouldSendCodeToEmail_Successfully() throws MessagingException {
            // Given
            when(userRepository.findByEmail("john@test.com")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);
            doNothing().when(mailService).sendMail(anyString(), anyString(), anyString());

            // When
            Void result = userService.sendCodeToEmail("john@test.com");

            // Then
            assertNull(result);
            verify(userRepository).save(any(User.class));
            verify(mailService).sendMail(eq("john@test.com"), anyString(), anyString());
        }

        @Test
        @DisplayName("Should throw exception when email not found")
        void shouldThrowException_WhenEmailNotFound() throws MessagingException {
            // Given
            when(userRepository.findByEmail("invalid@test.com")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.sendCodeToEmail("invalid@test.com");
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
            verify(mailService, never()).sendMail(anyString(), anyString(), anyString());
        }
    }

    // ==================== 8. RESET PASSWORD TESTS ====================

    @Nested
    @DisplayName("8. checkResetToken()")
    class CheckResetTokenTests {

        @Test
        @DisplayName("Should reset password with valid token")
        void shouldResetPassword_WithValidToken() {
            // Given
            ResetPasswordRequest request = new ResetPasswordRequest();
            request.setToken("valid-token-123");
            request.setNewPassword("newPassword123");

            user.setResetToken("valid-token-123");

            when(userRepository.findByResetToken("valid-token-123")).thenReturn(Optional.of(user));
            when(passwordEncoder.encode("newPassword123")).thenReturn("newEncodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(user);

            // When
            Void result = userService.checkResetToken(request);

            // Then
            assertNull(result);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception with invalid token")
        void shouldThrowException_WithInvalidToken() {
            // Given
            ResetPasswordRequest request = new ResetPasswordRequest();
            request.setToken("invalid-token");
            request.setNewPassword("newPassword123");

            when(userRepository.findByResetToken("invalid-token")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.checkResetToken(request);
            });

            assertEquals(ErrorCode.RESETCODE_ERROR, exception.getErrorCode());
        }
    }

    // ==================== 9. UPDATE BANK INFO TESTS ====================

    @Nested
    @DisplayName("9. updateUserBankInfo()")
    class UpdateUserBankInfoTests {

        @Test
        @DisplayName("Should update bank info successfully")
        void shouldUpdateBankInfo_Successfully() throws IOException {
            // Given
            UserRequest bankRequest = UserRequest.builder()
                    .bankName("Vietcombank")
                    .bankNumber("1234567890")
                    .build();

            when(userRepository.findById("U001")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toUserResponseDto(user)).thenReturn(userResponse);

            // When
            UserResponse response = userService.updateUserBankInfo("U001", bankRequest);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowException_WhenUserNotFoundForBankUpdate() throws IOException {
            // Given
            UserRequest bankRequest = UserRequest.builder()
                    .bankName("Vietcombank")
                    .bankNumber("1234567890")
                    .build();

            when(userRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            assertThrows(AppException.class, () -> {
                userService.updateUserBankInfo("INVALID_ID", bankRequest);
            });
        }
    }

    // ==================== 10. GET LIST DOCTOR TESTS ====================

    @Nested
    @DisplayName("10. getListDoctor()")
    class GetListDoctorTests {

        @Test
        @DisplayName("Should return list of doctors only")
        void shouldGetListDoctor_Successfully() {
            // Given
            User doctor1 = User.builder()
                    .id("D001")
                    .username("Dr. Smith")
                    .email("smith@test.com")
                    .roles(Set.of(doctorRole))
                    .build();

            User doctor2 = User.builder()
                    .id("D002")
                    .username("Dr. Jones")
                    .email("jones@test.com")
                    .roles(Set.of(doctorRole))
                    .build();

            User patient = User.builder()
                    .id("P001")
                    .username("Patient")
                    .email("patient@test.com")
                    .roles(Set.of(patientRole))
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(doctor1, doctor2, patient));
            when(userMapper.toUserResponseDto(any(User.class))).thenReturn(userResponse);

            // When
            List<UserResponse> doctors = userService.getListDoctor();

            // Then
            assertNotNull(doctors);
            assertEquals(2, doctors.size());
            verify(userMapper, times(2)).toUserResponseDto(any(User.class));
        }

        @Test
        @DisplayName("Should return empty list when no doctors")
        void shouldGetListDoctor_EmptyList() {
            // Given
            when(userRepository.findAll()).thenReturn(List.of(user));

            // When
            List<UserResponse> doctors = userService.getListDoctor();

            // Then
            assertNotNull(doctors);
            assertEquals(0, doctors.size());
        }
    }

    // ==================== 11. CREATE OFFLINE USER TESTS ====================

    @Nested
    @DisplayName("11. createOfflineUser()")
    class CreateOfflineUserTests {

        @Test
        @DisplayName("Should create offline user successfully")
        void shouldCreateOfflineUser_Successfully() {
            // Given
            OfflineUserRequest request = OfflineUserRequest.builder()
                    .username("Walk-in Patient")
                    .phone(111222333)
                    .roles(Set.of("OFFLINE_PATIENT"))
                    .build();

            User offlineUser = User.builder()
                    .id("OFF001")
                    .username("Walk-in Patient")
                    .phone(111222333)
                    .email(null)
                    .password(null)
                    .enabled(true)
                    .roles(Set.of(offlinePatientRole))
                    .build();

            OfflineUserResponse offlineResponse = OfflineUserResponse.builder()
                    .id("OFF001")
                    .username("Walk-in Patient")
                    .phone(111222333)
                    .build();

            when(userRepository.existsByPhone(111222333)).thenReturn(false);
            when(userMapper.toOfflineUser(request)).thenReturn(offlineUser);
            when(roleRepository.findByName("OFFLINE_PATIENT")).thenReturn(Optional.of(offlinePatientRole));
            when(userRepository.save(any(User.class))).thenReturn(offlineUser);
            when(userMapper.toOfflineUserResponse(offlineUser)).thenReturn(offlineResponse);

            // When
            OfflineUserResponse response = userService.createOfflineUser(request);

            // Then
            assertNotNull(response);
            assertEquals("OFF001", response.getId());
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when phone already exists")
        void shouldThrowException_WhenPhoneExists() {
            // Given
            OfflineUserRequest request = OfflineUserRequest.builder()
                    .username("Walk-in Patient")
                    .phone(123456789)
                    .build();

            when(userRepository.existsByPhone(123456789)).thenReturn(true);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.createOfflineUser(request);
            });

            assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should use default role when not specified")
        void shouldCreateOfflineUser_WithDefaultRole() {
            // Given
            OfflineUserRequest request = OfflineUserRequest.builder()
                    .username("Walk-in Patient")
                    .phone(999888777)
                    .roles(null)
                    .build();

            User offlineUser = User.builder()
                    .id("OFF002")
                    .username("Walk-in Patient")
                    .phone(999888777)
                    .build();

            OfflineUserResponse offlineResponse = OfflineUserResponse.builder()
                    .id("OFF002")
                    .username("Walk-in Patient")
                    .phone(999888777)
                    .build();

            when(userRepository.existsByPhone(999888777)).thenReturn(false);
            when(userMapper.toOfflineUser(request)).thenReturn(offlineUser);
            when(roleRepository.findByName("OFFLINE_PATIENT")).thenReturn(Optional.of(offlinePatientRole));
            when(userRepository.save(any(User.class))).thenReturn(offlineUser);
            when(userMapper.toOfflineUserResponse(offlineUser)).thenReturn(offlineResponse);

            // When
            OfflineUserResponse response = userService.createOfflineUser(request);

            // Then
            assertNotNull(response);
            verify(roleRepository).findByName("OFFLINE_PATIENT");
        }
    }

    // ==================== 12. GET OFFLINE USER BY PHONE TESTS ====================

    @Nested
    @DisplayName("12. getOfflineUserByPhone()")
    class GetOfflineUserByPhoneTests {

        @Test
        @DisplayName("Should get offline user by phone successfully")
        void shouldGetOfflineUserByPhone_Successfully() {
            // Given
            OfflineUserResponse offlineResponse = OfflineUserResponse.builder()
                    .id("OFF001")
                    .username("Walk-in Patient")
                    .phone(111222333)
                    .build();

            when(userRepository.findByPhone(111222333)).thenReturn(Optional.of(user));
            when(userMapper.toOfflineUserResponse(user)).thenReturn(offlineResponse);

            // When
            OfflineUserResponse response = userService.getOfflineUserByPhone(111222333);

            // Then
            assertNotNull(response);
            assertEquals(111222333, response.getPhone());
        }

        @Test
        @DisplayName("Should throw exception when phone not found")
        void shouldThrowException_WhenPhoneNotFound() {
            // Given
            when(userRepository.findByPhone(999999999)).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.getOfflineUserByPhone(999999999);
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 13. UPDATE OFFLINE USER TESTS ====================

    @Nested
    @DisplayName("13. updateOfflineUser()")
    class UpdateOfflineUserTests {

        @Test
        @DisplayName("Should update offline user successfully")
        void shouldUpdateOfflineUser_Successfully() {
            // Given
            OfflineUserRequest request = OfflineUserRequest.builder()
                    .username("Updated Name")
                    .phone(111222333)
                    .build();

            OfflineUserResponse offlineResponse = OfflineUserResponse.builder()
                    .id("OFF001")
                    .username("Updated Name")
                    .phone(111222333)
                    .build();

            when(userRepository.findById("OFF001")).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenReturn(user);
            when(userMapper.toOfflineUserResponse(user)).thenReturn(offlineResponse);

            // When
            OfflineUserResponse response = userService.updateOfflineUser("OFF001", request);

            // Then
            assertNotNull(response);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should throw exception when phone already exists on update")
        void shouldThrowException_WhenPhoneExistsOnUpdate() {
            // Given
            OfflineUserRequest request = OfflineUserRequest.builder()
                    .username("Updated Name")
                    .phone(999888777)
                    .build();

            user.setPhone(111222333);

            when(userRepository.findById("OFF001")).thenReturn(Optional.of(user));
            when(userRepository.existsByPhone(999888777)).thenReturn(true);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                userService.updateOfflineUser("OFF001", request);
            });

            assertEquals(ErrorCode.USER_EXISTED, exception.getErrorCode());
        }
    }

    // ==================== 14. GET LIST USER HOHO TESTS ====================

    @Nested
    @DisplayName("14. getListUserHoho()")
    class GetListUserHohoTests {

        @Test
        @DisplayName("Should return users without email")
        void shouldGetListUserHoho_Successfully() {
            // Given
            User offlineUser1 = User.builder()
                    .id("OFF001")
                    .username("Offline User 1")
                    .email(null)
                    .phone(111111111)
                    .build();

            User offlineUser2 = User.builder()
                    .id("OFF002")
                    .username("Offline User 2")
                    .email("")
                    .phone(222222222)
                    .build();

            User normalUser = User.builder()
                    .id("U001")
                    .username("Normal User")
                    .email("normal@test.com")
                    .phone(333333333)
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(offlineUser1, offlineUser2, normalUser));

            // When
            List<User> users = userService.getListUserHoho();

            // Then
            assertNotNull(users);
            assertEquals(2, users.size());
        }

        @Test
        @DisplayName("Should return empty list when all users have email")
        void shouldGetListUserHoho_EmptyList() {
            // Given
            when(userRepository.findAll()).thenReturn(List.of(user));

            // When
            List<User> users = userService.getListUserHoho();

            // Then
            assertNotNull(users);
            assertEquals(0, users.size());
        }
    }
}
