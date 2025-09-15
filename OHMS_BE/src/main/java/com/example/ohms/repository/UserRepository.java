package com.example.ohms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.User;

public interface UserRepository extends JpaRepository<User,String> {
   Optional<User> findByUsername(String username);
   Optional<User> findByEmail(String email);
   Optional<User> findByResetToken(String resetToken);
}
