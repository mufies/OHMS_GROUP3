package com.example.ohms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Permission;
import com.example.ohms.entity.PrescriptionMedicine;


public interface PrescriptionMedicineRepository extends JpaRepository<PrescriptionMedicine, String> {
   
}
