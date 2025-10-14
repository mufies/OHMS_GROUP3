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
   //  thêm trường này
   MedicalSpecialty medicalSpecialty;
}
