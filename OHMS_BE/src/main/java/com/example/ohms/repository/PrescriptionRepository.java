package com.example.ohms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription,String > {
   List<Prescription> findAllByPatientId(String patientId);
}
