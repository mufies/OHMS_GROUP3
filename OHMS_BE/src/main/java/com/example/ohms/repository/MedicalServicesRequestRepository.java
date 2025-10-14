package com.example.ohms.repository;

import com.example.ohms.entity.MedicalServicesRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalServicesRequestRepository extends JpaRepository<MedicalServicesRequest, String> {
    List<MedicalServicesRequest> findByPatientId(String patientId);
    List<MedicalServicesRequest> findByDoctorId(String doctorId);
    List<MedicalServicesRequest> findByStatus(boolean status);
}
