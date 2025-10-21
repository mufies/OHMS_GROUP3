package com.example.ohms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.ohms.entity.MedicalRecord;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, String> {
    
    // Tìm hồ sơ theo appointment ID
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.appointment.id = :appointmentId")
    MedicalRecord findByAppointmentId(@Param("appointmentId") String appointmentId);
    
    // Tìm tất cả hồ sơ của bệnh nhân
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.patient.id = :patientId ORDER BY mr.createdAt DESC")
    List<MedicalRecord> findByPatientId(@Param("patientId") String patientId);
    
    // Tìm tất cả hồ sơ do bác sĩ tạo
    @Query("SELECT mr FROM MedicalRecord mr WHERE mr.doctor.id = :doctorId ORDER BY mr.createdAt DESC")
    List<MedicalRecord> findByDoctorId(@Param("doctorId") String doctorId);
    
    // Tìm hồ sơ kèm đầy đủ thông tin (eager loading)
    @Query("SELECT mr FROM MedicalRecord mr " +
           "LEFT JOIN FETCH mr.appointment " +
           "LEFT JOIN FETCH mr.patient " +
           "LEFT JOIN FETCH mr.doctor " +
           "LEFT JOIN FETCH mr.prescription " +
           "WHERE mr.id = :id")
    MedicalRecord findByIdWithDetails(@Param("id") String id);
}
