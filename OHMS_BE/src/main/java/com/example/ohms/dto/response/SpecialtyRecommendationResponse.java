package com.example.ohms.dto.response;

import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.enums.MedicalSpecialty;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class SpecialtyRecommendationResponse {
    // Original fields - AI diagnosis
    private String diagnosis;
    private String recommendedSpecialty;
    private String specialtyEnum;
    private String specialtyNameVi;
    private List<MedicalExamination> suggestedExaminations;
    private String bookingUrl;
    private String urgencyLevel;
    private boolean needMoreInfo;
    private String followUpQuestion;
    
    // ========== NEW BOOKING FIELDS ==========
    
    // Booking readiness flag
    private Boolean ready;
    
    // Booking type: CONSULTATION_ONLY, SERVICE_AND_CONSULTATION, PREVENTIVE_SERVICE
    private String bookingType;
    
    // Doctor info (for CONSULTATION types)
    private String doctorId;
    private String doctorName;
    
    // Date and time
    private String workDate; // yyyy-MM-dd format
    private String startTime; // HH:mm:ss (for CONSULTATION_ONLY and PREVENTIVE_SERVICE)
    private String endTime; // HH:mm:ss
    
    // Service slots (for SERVICE_AND_CONSULTATION)
    private List<ServiceSlotDto> serviceSlots;
    private TimeSlotDto consultationSlot;
    
    // Medical examination IDs
    private List<String> medicalExaminationIds;
    
    // Pricing information
    private Double totalPrice; // Total price before discount
    private Double discountedPrice; // Price after 10% discount
    private Double depositAmount; // 50% of discounted price
    private Integer discount; // Discount percentage (10)
    
    // ========== NESTED DTOs ==========
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    public static class ServiceSlotDto {
        private String serviceId;
        private String startTime;
        private String endTime;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    public static class TimeSlotDto {
        private String startTime;
        private String endTime;
    }
}
