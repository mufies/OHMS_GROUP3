package com.example.ohms.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.MedicalExamination;

public interface MedicleExaminatioRepository extends JpaRepository<MedicalExamination,String> {
   List<MedicalExamination> findAllByNameIn(Set<String> name);
}
