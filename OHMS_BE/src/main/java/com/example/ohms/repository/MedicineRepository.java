package com.example.ohms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Medicine;

public interface MedicineRepository extends JpaRepository<Medicine,String> {
   Optional<Medicine> findByName(String name);
}
