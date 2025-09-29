package com.example.ohms.entity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

import com.example.ohms.enums.PaymentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

// trong 1 cái bill thì có nhiều cái dịch vụ
// dịch vụ thì tính mỗi khám
// bill là tổng tiền của dịch vụ
// còn cái kia là tính thuốc riêng
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Appointment {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id; // hide
   @ManyToOne
   User patient;
   @ManyToOne
   User doctor;
// book khám gì ?
   @OneToMany
   Set<MedicalExamination> medicalExamnination;
   LocalDate workDate;
   LocalTime startTime;
   LocalTime endTime;
}
