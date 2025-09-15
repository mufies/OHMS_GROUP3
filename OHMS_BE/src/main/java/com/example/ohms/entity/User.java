package com.example.ohms.entity;

import java.util.Set;

import jakarta.persistence.Entity;
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
// mấy cái này tí nhớ ẩn trong mapper
   @ManyToMany
   Set<Role> roles;

   String facebookId;
   String refreshtoken;
   String resetToken;

}