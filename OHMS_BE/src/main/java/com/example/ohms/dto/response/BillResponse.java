package com.example.ohms.dto.response;

import java.util.Set;

import com.example.ohms.enums.PaymentStatus;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
   @RequiredArgsConstructor
   @FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class BillResponse {
   // viết đại đại xong tí xử lí trong service sau
   HideUserResponse user;
   Set<MedicleExaminationResponse> medicalExamination;
   Integer priceExamination;
   PaymentStatus status;

}
