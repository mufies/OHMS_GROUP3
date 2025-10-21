package com.example.ohms.dto.response;

import java.time.LocalDateTime;
import java.util.List;

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
public class MedicalRecordResponse {
    
    String id;
    
    // Appointment info
    String appointmentId;
    String appointmentDate;
    String appointmentTime;
    
    // Patient info
    String patientId;
    String patientName;
    String patientEmail;
    String patientPhone;
    
    // Doctor info
    String doctorId;
    String doctorName;
    String doctorSpecialty;
    
    // Medical info
    String symptoms;
    String diagnosis;
    
    // Prescription info
    PrescriptionInfo prescription;
    
    // Medical examinations
    List<MedicalExaminationInfo> medicalExaminations;
    
    // Timestamps
    LocalDateTime createdAt;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PrescriptionInfo {
        String id;
        Integer amount;
        String status;
        List<MedicineInfo> medicines;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class MedicineInfo {
        String id;
        String name;
        String dosage;
        String instructions;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class MedicalExaminationInfo {
        String id;
        String name;
        Integer price;
    }
}
