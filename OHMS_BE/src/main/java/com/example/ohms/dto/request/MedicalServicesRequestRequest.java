package com.example.ohms.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotNull;
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
public class MedicalServicesRequestRequest {

    @NotNull(message = "Patient ID is required")
    String patientId;

    @NotNull(message = "Doctor ID is required")
    String doctorId;

    List<String> medicalExaminationIds; // List các ID của medical examinations
    
}
