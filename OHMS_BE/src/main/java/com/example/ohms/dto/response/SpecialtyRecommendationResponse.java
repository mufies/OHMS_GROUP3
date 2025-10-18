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
    // Trả lời AI diagnosis
    private String diagnosis;
    
    // Chuyên khoa được gợi ý (enum)
    private String recommendedSpecialty;
    
    // Tên tiếng Việt của chuyên khoa
    private String specialtyNameVi;
    
    // Danh sách dịch vụ khám phù hợp
    private List<MedicalExamination> suggestedExaminations;
    
    // URL đặt lịch
    private String bookingUrl;
    
    // Mức độ khẩn cấp
    private String urgencyLevel;
    
    // Có cần hỏi thêm dữ kiện không
    private boolean needMoreInfo;
    
    // Câu hỏi cần hỏi thêm (nếu needMoreInfo = true)
    private String followUpQuestion;
}
