package com.example.ohms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.ohms.entity.User;

public interface UserRepository extends JpaRepository<User,String> {
   Optional<User> findByUsername(String username);
   Optional<User> findByEmail(String email);
   Optional<User> findByResetToken(String resetToken);
   
   @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :id")
   Optional<User> findByIdWithRoles(@Param("id") String id);

   @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
   List<User> findByRoleName(@Param("roleName") String roleName);
}
