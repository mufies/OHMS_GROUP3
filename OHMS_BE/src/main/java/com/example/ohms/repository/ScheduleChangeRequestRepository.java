package com.example.ohms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.ohms.entity.ScheduleChangeRequest;
import com.example.ohms.entity.ScheduleChangeRequest.RequestStatus;

@Repository
public interface ScheduleChangeRequestRepository extends JpaRepository<ScheduleChangeRequest, String> {
    // Tìm tất cả request theo targetDoctorId
    List<ScheduleChangeRequest> findByTargetDoctorId(String targetDoctorId);
    
    // Tìm theo status
    List<ScheduleChangeRequest> findByStatus(RequestStatus status);
    
    // Tìm theo targetDoctorId và status
    List<ScheduleChangeRequest> findByTargetDoctorIdAndStatus(String targetDoctorId, RequestStatus status);
    
    // Tìm theo targetDoctorId, ngày và status
    List<ScheduleChangeRequest> findByTargetDoctorIdAndDateChangeAndStatus(String targetDoctorId, String dateChange, RequestStatus status);
    
    // Tìm pending requests của một doctor
    List<ScheduleChangeRequest> findByTargetDoctorIdAndStatusOrderByCreatedAtDesc(String targetDoctorId, RequestStatus status);
    
    // Tìm theo ngày và department
    List<ScheduleChangeRequest> findByDateChangeAndDepartment(String dateChange, String department);
    
    // Tìm theo ngày, department và status
    List<ScheduleChangeRequest> findByDateChangeAndDepartmentAndStatus(String dateChange, String department, RequestStatus status);
    
    // Tìm theo ngày
    List<ScheduleChangeRequest> findByDateChange(String dateChange);
    
    // Tìm theo department
    List<ScheduleChangeRequest> findByDepartment(String department);
}
