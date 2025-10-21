package com.example.ohms.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
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
public class MedicalRecordRequest {
    
    @NotBlank(message = "Appointment ID is required")
    String appointmentId;
    
    String symptoms;
    
    String diagnosis;
    
    String prescriptionId; // Optional - nếu đã tạo prescription trước
    
    List<String> medicalExaminationIds; // Danh sách dịch vụ y tế bổ sung (nếu có)
}
