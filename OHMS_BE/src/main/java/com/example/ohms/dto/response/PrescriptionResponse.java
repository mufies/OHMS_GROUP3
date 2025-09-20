package com.example.ohms.dto.response;

import java.util.Set;

import com.example.ohms.entity.PrescriptionMedicine;
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
public class PrescriptionResponse {
// hiện
   HideUserResponse doctor;
   HideUserResponse patient;
   Set<PrescriptionMedicine> medicinePrescription;
   Integer amount;
   PaymentStatus status;
}