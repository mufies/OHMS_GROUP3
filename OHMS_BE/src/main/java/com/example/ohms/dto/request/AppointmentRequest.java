package com.example.ohms.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
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
public class AppointmentRequest {
    
    @NotBlank(message = "Patient ID is required")
    String patientId;
    
    // @NotBlank(message = "Doctor ID is required")
    String doctorId;
    
    @NotNull(message = "Work date is required")
    LocalDate workDate;
    
    @NotNull(message = "Start time is required")
    LocalTime startTime;
    
    @NotNull(message = "End time is required")
    LocalTime endTime;

    List<String> medicalExaminationIds; // List các ID của medical examinations

}
