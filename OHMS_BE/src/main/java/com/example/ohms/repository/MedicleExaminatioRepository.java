package com.example.ohms.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.enums.MedicalSpecialty;

public interface MedicleExaminatioRepository extends JpaRepository<MedicalExamination,String> {
   List<MedicalExamination> findAllByIdIn(Set<String> name);
   Optional<MedicalExamination> findByName(String name);
   List<MedicalExamination> findAllByMedicalSpecialty(MedicalSpecialty specialty);
}
