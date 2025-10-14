package com.example.ohms.repository;

import java.util.List;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Prescription;

public interface PrescriptionRepository extends JpaRepository<Prescription,String > {
   List<Prescription> findAllByPatientId(String patientId);
   Set<Prescription> findAllByIdIn(Set<String> name);
}
