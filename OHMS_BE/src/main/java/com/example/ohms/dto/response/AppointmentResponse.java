package com.example.ohms.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.example.ohms.entity.MedicalExamination;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class AppointmentResponse {
    
    String id;
    String patientId;
    String patientName;
    String patientEmail;
    String patientPhone;
    
    String doctorId;
    String doctorName;
    String doctorSpecialty;    
    LocalDate workDate;
    LocalTime startTime;
    LocalTime endTime;
    
    String status; // Trạng thái appointment: SCHEDULED, COMPLETED, CANCELLED, etc.
    List<MedicalExaminationInfo> medicalExaminations; // Changed to use nested class
    
    // Nested classes cho thông tin chi tiết
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PatientInfo {
        String id;
        String name;
        String email;
        String phone;
        String address;
    }
    
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DoctorInfo {
        String id;
        String name;
        String specialty;
        String department;
    }
    
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MedicalExaminationInfo {
        String id;
        String name;
        int price;
    }

    


}
