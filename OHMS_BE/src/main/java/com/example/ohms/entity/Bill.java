package com.example.ohms.entity;

import java.util.Set;

import com.example.ohms.enums.PaymentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

// trong 1 cái bill thì có nhiều cái dịch vụ
// dịch vụ thì tính mỗi khám
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Bill {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
   @ManyToOne
   User patient;
// trong 1 cái bill thì sẽ có nhiều cái medical_examination
   @OneToMany
   Set<MedicalExamination> medicalExamination;
   int priceExamination;
   // 1 cái là status nữa để check trạng thái thanh toán
   PaymentStatus status;
}
