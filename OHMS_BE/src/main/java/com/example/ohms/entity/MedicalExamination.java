package com.example.ohms.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

// admin sẽ tạo service đi kèm với giá, khám xong doctor chọn service rồi thanh toán 90% còn lại + tiền thuốc
@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class MedicalExamination {
      @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
   String name;
   int price;
}
