package com.example.ohms.entity;

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
public class Bill {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id; // hide
   @ManyToOne
   User patient; //hide, lấy trong api
// trong 1 cái bill thì sẽ có nhiều cái medical_examination
   @OneToMany
   Set<MedicalExamination> medicalExamination;
   Integer priceExamination; // hide luôn, vì cái này mình xử lí trong service
   // 1 cái là status nữa để check trạng thái thanh toán
   @Enumerated(EnumType.STRING)
   PaymentStatus status; // để mặc định khi tạo, thanh toán xong thay đổi trạng thái
}
