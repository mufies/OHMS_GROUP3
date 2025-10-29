package com.example.ohms.dto.response;
import java.sql.Date;
import java.util.Set;

import com.example.ohms.enums.MedicalSpecialty;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Email;
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
public class UserResponse{
   String id;
   String username;
   @Size(min = 6, message = "PASSWORD_INVALID")
   String password;
   String imageUrl;
   @Email(message = "EMAIL_NOT_VAILID")
   String email;
   Set<RoleResponse> roles;
   // Set<String> reviews; // những cái mảng nó sẽ ẩn trong mapper và gán lại ở service
   Integer phone;
   String gender;
   Date dob;
   String bankNumber;
   String bankName;
   Set<MedicalSpecialty> medicleSpecially;
}