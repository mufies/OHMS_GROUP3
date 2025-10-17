package com.example.ohms.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.example.ohms.dto.response.AppointmentResponse.DoctorInfo;
import com.example.ohms.enums.MedicalSpecialty;

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
public class MedicalServicesRequestResponse {
    String id;
    PatientInfo patient;
    DoctorInfo doctor;
    List<MedicalExaminationInfo> medicalExaminations;
    MedicalSpecialty medicalSpecialty;
    boolean status;
    LocalDateTime createdAt;
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PatientInfo {
        String id;
        String name;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DoctorInfo {
        String id;
        String name;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MedicalExaminationInfo {
        String id;
        String name;
        Double price;
    }
}
