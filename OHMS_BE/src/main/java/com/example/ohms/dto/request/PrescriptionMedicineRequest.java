package com.example.ohms.dto.request;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
// xử lí lại cái này 
public class PrescriptionMedicineRequest {
   String medicineId;
   Integer amount;
}
