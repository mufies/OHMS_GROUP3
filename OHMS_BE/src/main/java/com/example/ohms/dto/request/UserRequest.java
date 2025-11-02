package com.example.ohms.dto.request;

  import java.sql.Date;
  import java.util.Set;

import com.example.ohms.enums.MedicalSpecialty;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Email;
   import jakarta.validation.constraints.NotNull;
   import jakarta.validation.constraints.Size;
   import lombok.AccessLevel;
   import lombok.Builder;
   import lombok.Data;
   import lombok.RequiredArgsConstructor;
   import lombok.experimental.FieldDefaults;
   @Data
   @Builder
   @RequiredArgsConstructor
   @FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
   public class UserRequest{
      @Size(min = 6, message = "USERNAME_INVALIDS")
      @NotNull(message = "NAME_NOT_NULL")
      String username;
      @Size(min = 6, message = "PASSWORD_INVALID")   
      @NotNull(message = "PASSWORD_INVALID")
      String password;
      String imageUrls;
      @Email(message = "EMAIL_NOT_VAILID")
      String email;
      Set<String> roles;
      //  làm thêm cái phone với cái chuyên ngành hẹp cho thằng bác sĩ
      // 1 bác sĩ có thể có nhiều chuyên khoa hẹp
      Integer phone;
      Date dob;
      String gender;
      String bankNumber;
      String bankName;
      Set<MedicalSpecialty> medicleSpecially;
      
      // Thông tin học vấn của bác sĩ
      String education;
      
      // Kinh nghiệm làm việc (số năm)
      Integer experience;
      
      // Chứng chỉ hành nghề
      String certifications;
      
      // Mô tả về bác sĩ
      String description;
      
      // Địa chỉ
      String address;
   }