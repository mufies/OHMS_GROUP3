package com.example.ohms.entity;

import java.sql.Date;
import java.util.Set;

import com.example.ohms.enums.MedicalSpecialty;
import com.example.ohms.enums.AuthProvider;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class User {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
   String username;
   String password;
   String imageUrl;
   String email;
   Integer phone;
   String gender;
   Date dob;
// mấy cái này tí nhớ ẩn trong mapper
   @ManyToMany
   Set<Role> roles;
   @Enumerated(EnumType.STRING)
   @Builder.Default
   AuthProvider authProvider = AuthProvider.LOCAL;
   String refreshToken;
   String resetToken;
// mấy cái ở dưới là của role bác sĩ 
// 1 bác sĩ có nhiều chuyên ngành
 Boolean enabled = true;
 @Enumerated(EnumType.STRING)
   Set<MedicalSpecialty> medicleSpecially;
   String identification; // mã số định danh, thực ra cái này hơi không cần để xử lí ấy, nó làm legit hơn thôi

 
}