package com.example.ohms.dto.request;

import com.example.ohms.enums.MedicalSpecialty;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class MedicleExaminationRequest {
   String name;
   int price;
   MedicalSpecialty medicalSpecialty;
   Integer minDuration; // Thời gian tối thiểu để hoàn thành dịch vụ (phút)
   String type; // Loại dịch vụ
   Boolean stay; // Dịch vụ cần chờ để lấy kết quả
}
