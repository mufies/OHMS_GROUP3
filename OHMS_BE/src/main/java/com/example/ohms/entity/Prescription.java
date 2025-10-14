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
// đơn thuốc
// tiền của đơn thuốc, tiền của dịch vụ là 2 cái khác nhau ấy
// khám xong tổng sau
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Prescription {
//1 bệnh nhân có 1 bác sĩ khám
// 1 bác sĩ thì kê nhiều đơn 
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;  
   @ManyToOne  
   User doctor; // get ở authen
// id của mỗi lần khám là riêng biệt, nên đơn thuốc cũng là many one cho từng bệnh nhân
   @ManyToOne
   User patient; // get
   // 1 đơn thuốc thì có nhiều thuốc
   @OneToMany
   Set<PrescriptionMedicine> medicinePrescription; // get
   Integer amount; // hide tổng giá
   // status để check cái trạng thái thanh toán
   @Enumerated(EnumType.STRING)
   PaymentStatus status; //hide
}
