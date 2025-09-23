package com.example.ohms.service;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.ohms.dto.request.UserRequest;
import com.example.ohms.dto.response.UserResponse;
import com.example.ohms.entity.Role;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.UserMapper;
import com.example.ohms.repository.RoleRepository;
import com.example.ohms.repository.UserRepository;

import jakarta.mail.MessagingException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
@Service
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class UserService {
   UserRepository userRepository;
   RoleRepository roleRepository;
   UserMapper userMapper;
   CloudinaryService cloudinaryService;
   PasswordEncoder passwordEncoder;
   MailService mailService;
   @Autowired
   RoleService roleService;
   // create
   // register 
   // update
   // delete
   // cái này để quyền admin
   // làm lại user với bảng mới
   @PreAuthorize("hasRole('ADMIN')")
public UserResponse createUser(UserRequest userRequestDto, MultipartFile avatar) throws IOException {
    log.info("aaaaaaaaa{}", userRequestDto);
    User user = userMapper.toUser(userRequestDto);

    if (userRepository.findByEmail(userRequestDto.getEmail()).isPresent()) {
        throw new AppException(ErrorCode.USER_EXISTED);
    }

    if (avatar != null && !avatar.isEmpty()) {
        user.setImageUrl(cloudinaryService.uploadFile(avatar));
    }
    user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));

    log.info("Roles from request: {}", userRequestDto.getRoles());
    Set<Role> roles = new HashSet<>();
    for (String roleName : userRequestDto.getRoles()) {
    Role role = roleService.getdetail(roleName); // Sử dụng getdetail để tận dụng context của RoleService
    roles.add(role);
    log.info("Found role: {}", roleName);
}
    log.info("Roles found in DB: {}", roles.stream().map(Role::getName).collect(Collectors.toList()));

    if (roles.isEmpty()) {
        log.error("No roles found for requested roles: {}", userRequestDto.getRoles());
        throw new AppException(ErrorCode.ROLE_NOT_FOUND);
    }

    if (userRequestDto.getMedicleSpecially() != null) {
        var specialities = new HashSet<>(userRequestDto.getMedicleSpecially());
        user.setMedicleSpecially(specialities);
    }
    user.setRoles(roles);
    userRepository.save(user);
    return userMapper.toUserResponseDto(user);
}
// đăng kí thì auto là client
   public UserResponse registerUser( UserRequest userRequestDto,MultipartFile avatar) throws IOException{
         User user = userMapper.toUser(userRequestDto);
      if(avatar != null && !avatar.isEmpty()){
         user.setImageUrl(cloudinaryService.uploadFile(avatar));
      }
      Role clientRole = roleRepository.findByName("PATIENT")
      .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
      user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
      user.setRoles(Set.of(clientRole));
      userRepository.save(user);
      return userMapper.toUserResponseDto(user);
   }

   
      @PreAuthorize("hasRole('ADMIN')")
      public UserResponse findUserbyId(String userId){
         User userhehe = userRepository.findById(userId).orElseThrow(()->(new AppException(ErrorCode.USER_NOT_FOUND)));
         return userMapper.toUserResponseDto(userhehe);
      }
   // admin update user
   @PreAuthorize("hasRole('ADMIN')")
   public UserResponse updateUser(String userId,UserRequest userRequestDto,MultipartFile avatar) throws IOException{
      // 
      User user = userRepository.findById(userId).orElseThrow(()->new AppException(ErrorCode.USER_NOT_FOUND)); // user cũ
      if(userRequestDto.getEmail()!= null){
         user.setEmail(userRequestDto.getEmail());
      }
      if(userRequestDto.getUsername() != null){
         user.setUsername(userRequestDto.getUsername());
      }
      if(userRequestDto.getPassword() != null){
           user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
      }
      // admin update user thì có nha
      if(userRequestDto.getPhone() != null){
         user.setPhone(userRequestDto.getPhone());
      }
      if(userRequestDto.getMedicleSpecially() != null){
         var specialities = new HashSet<>(userRequestDto.getMedicleSpecially());
         user.setMedicleSpecially(specialities);
      }
      if(avatar != null && !avatar.isEmpty()){
         log.info("Avatar received: name={}, size={}", avatar.getOriginalFilename(), avatar.getSize());
    user.setImageUrl(cloudinaryService.uploadFile(avatar));
    log.error("aaaaaaaaaa"); // Kiểm tra log này
      }

      // lấy mảng role mới áp vào mảng cũ
      // check lại cái role
     if (userRequestDto.getRoles() != null) { // Chỉ kiểm tra null, không kiểm tra isEmpty
        Set<Role> roles = new HashSet<>();
        if (!userRequestDto.getRoles().isEmpty()) {
            roles = userRequestDto.getRoles().stream()
                .map(roleName -> roleRepository.findById(roleName)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
                .collect(Collectors.toSet());
        }
        user.setRoles(roles); // Cập nhật roles, kể cả khi rỗng
    }
    return userMapper.toUserResponseDto(userRepository.save(user));
   }
   // user update user
@PostAuthorize("returnObject.id == authentication.name")
      public UserResponse userUpdateUser(String userId,UserRequest userRequestDto,MultipartFile avatar) throws IOException{
      // 
      User user = userRepository.findById(userId).orElseThrow(()->new AppException(ErrorCode.USER_NOT_FOUND)); // user cũ
      if(userRequestDto.getEmail()!= null){
         user.setEmail(userRequestDto.getEmail());
      }
      if(userRequestDto.getUsername() != null){
         user.setUsername(userRequestDto.getUsername());
      }
      if(userRequestDto.getPassword() != null){
           user.setPassword(passwordEncoder.encode(userRequestDto.getPassword()));
      }
      if(avatar != null && !avatar.isEmpty()){
         user.setImageUrl(cloudinaryService.uploadFile(avatar));
      }
      if(userRequestDto.getPhone() != null){
         user.setPhone(userRequestDto.getPhone());
      }

      // này đang làm hơi sai, user không có update role được user á
      // fe làm thì ẩn cái này đi
      // lấy mảng role mới áp vào mảng cũ
        if (userRequestDto.getRoles() != null && !userRequestDto.getRoles().isEmpty()) {
        Set<Role> roles = userRequestDto.getRoles().stream()
                .map(roleName -> roleRepository.findById(roleName)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND)))
                .collect(Collectors.toSet());
        user.setRoles(roles);
    }
    return userMapper.toUserResponseDto(userRepository.save(user));
   }
// forgot password
  public Void sendCodeToEmail(String email) throws MessagingException {
   User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    String resetToken = UUID.randomUUID().toString();
    user.setResetToken(resetToken);
    userRepository.save(user);
    String subject = "Mã khôi phục mật khẩu của bạn";
    String content = "Xin chào " + user.getEmail() +
            ",\n\nMã khôi phục của bạn là: " + resetToken +
            "\nMã này sẽ hết hạn sau 15 phút.\n\nTrân trọng!";
    
     mailService.sendMail(user.getEmail(), subject, content);
   return null;
}

// reset password
 public Void checkResetToken(String token,String newPassword){
      User user = userRepository.findByResetToken(token).orElseThrow(()->new AppException(ErrorCode.RESETCODE_ERROR));
      user.setPassword(newPassword);
      return null;
 }
public UserResponse getDetailUser(Authentication authentication) {
    if (authentication.getPrincipal() instanceof Jwt jwt) {
        // Lấy thông tin từ claims
        String userId = jwt.getClaimAsString("sub"); 
        // Tìm user trong DB theo id hoặc email
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponseDto(user);
    }

    // nếu không phải Jwt thì ném lỗi
    throw new AppException(ErrorCode.USER_NOT_FOUND);
}
      @PreAuthorize("hasRole('ADMIN')")
      public List<UserResponse> getListhehe(){
         return userRepository.findAll().stream().map(userMapper :: toUserResponseDto).toList();
      }
// mấy phần delete thì từ từ, vì nó có liên kết với những phần khác
   @PreAuthorize("hasRole('ADMIN')")
   public Void deleteUser(String id){
   // phần này từ từ
      userRepository.deleteById(id);

      return null;
   }
// này sẽ lấy tất cả bác sĩ, xong filter chuyên ngành trong fe nha
 public List<UserResponse> getListDoctor() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRoles().stream()
                        .anyMatch(role -> role.getName().equals("DOCTOR")))
                .map(userMapper::toUserResponseDto)
                .toList();
    }
}
