package com.example.ohms.entity;

import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
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
    @OneToMany
    Set<MedicalExamination> medicalExamnination;
    @Default
    boolean status = true;

}
