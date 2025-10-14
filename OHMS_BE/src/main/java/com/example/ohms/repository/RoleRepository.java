package com.example.ohms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Role;

public interface RoleRepository extends JpaRepository<Role,String> {
Optional<Role> findByName(String name);

}
