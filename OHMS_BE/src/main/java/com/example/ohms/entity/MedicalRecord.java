package com.example.ohms.entity;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * MedicalRecord - Hồ sơ bệnh án
 * Được tạo sau khi bác sĩ hoàn thành khám bệnh cho một appointment
 */
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class MedicalRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    // Liên kết với appointment đã khám
    @OneToOne
    Appointment appointment;
    
    // Bệnh nhân
    @ManyToOne
    User patient;
    
    // Bác sĩ khám
    @ManyToOne
    User doctor;
    
    // Triệu chứng (symptoms)
    String symptoms;
    
    // Chẩn đoán (diagnosis)
    String diagnosis;
    
    // Đơn thuốc
    @OneToOne
    Prescription prescription;

    //cái này để khi bác sĩ có request thêm là phải thêm cái service gì
    @OneToMany
    Set<MedicalExamination> medicalExamination;
    
    
    // Thời gian tạo hồ sơ
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
    

}
