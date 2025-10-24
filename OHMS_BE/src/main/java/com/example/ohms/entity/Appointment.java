package com.example.ohms.entity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.example.ohms.enums.PaymentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
   @ManyToOne(optional = true)
   User doctor;
// book khám gì ?
   @ManyToMany
   @JoinTable(
      name = "appointment_medical_examnination",
      joinColumns = @JoinColumn(name = "appointment_id"),
      inverseJoinColumns = @JoinColumn(name = "medical_examnination_id")
   )
   @Builder.Default
   List<MedicalExamination> medicalExamnination = new java.util.ArrayList<>();

   // Relationship: appointment chính (khám bác sĩ) có nhiều appointment phụ (dịch vụ)
   // VD: Appointment khám bác sĩ -> serviceAppointments = [apt_xét_nghiệm, apt_siêu_âm, apt_x_quang]
   @OneToMany(mappedBy = "parentAppointment")
   @Builder.Default
   List<Appointment> serviceAppointments = new java.util.ArrayList<>();

   // Appointment phụ (dịch vụ) tham chiếu về appointment chính
   // VD: apt_xét_nghiệm.parentAppointment -> Appointment khám bác sĩ
   // DB sẽ có column: parent_appointment_id (nullable, vì appointment chính thì null)
   @ManyToOne
   @JoinColumn(name = "parent_appointment_id")
   Appointment parentAppointment;

   LocalDate workDate;
   LocalTime startTime;
   LocalTime endTime;
   String status;
}
