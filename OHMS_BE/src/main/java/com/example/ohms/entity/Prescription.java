package com.example.ohms.entity;

import java.util.List;

import com.example.ohms.enums.PaymentStatus;

import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
// đơn thuốc
// tiền của đơn thuốc, tiền của dịch vụ là 2 cái khác nhau ấy
// khám xong tổng sau
public class Prescription {
//1 bệnh nhân có 1 bác sĩ khám
// 1 bác sĩ thì kê nhiều đơn   
@ManyToOne  
   User doctor;
// id của mỗi lần khám là riêng biệt, nên đơn thuốc cũng là many one cho từng bệnh nhân
   @ManyToOne
   User patientId;
   // 1 đơn thuốc thì có nhiều thuốc
   @OneToMany
   List<Medicine> medicine;
   int amount;
   // status để check cái trạng thái thanh toán
   PaymentStatus status;
}
