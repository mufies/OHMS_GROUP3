package com.example.ohms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Permission;


public interface PermissionRepository extends JpaRepository<Permission, String> {
   
}
