package com.example.ohms.entity;

import java.util.List;

import com.example.ohms.enums.MedicalSpecialty;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.Builder.Default;

// admin sẽ tạo service đi kèm với giá, khám xong doctor chọn service rồi thanh toán 90% còn lại + tiền thuốc
//tạo dịch vụ khám 
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
// tạo dịch vụ khám
// mỗi dịch vụ khám lại có 1 cái giá riêng
public class MedicalServicesRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @OneToOne
    User patient;
    @OneToOne
    User doctor;
    @ManyToMany
    @JoinTable(
        name = "medical_services_request_medical_examnination",
        joinColumns = @JoinColumn(name = "medical_services_request_id"),
        inverseJoinColumns = @JoinColumn(name = "medical_examnination_id")
    )
    List<MedicalExamination> medicalExamnination;
    
    @Enumerated(EnumType.STRING)
    MedicalSpecialty medicalSpecialty;
    
    @Default
    boolean status = true;

}