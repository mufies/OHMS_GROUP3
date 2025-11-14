package com.example.ohms.dto.response;

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
public class MedicleExaminationResponse {
   String id;
   String name;
   int price;
      MedicalSpecialty medicalSpecialty;

   Integer minDuration; // Thời gian tối thiểu để hoàn thành (phút)
      String type;

}
