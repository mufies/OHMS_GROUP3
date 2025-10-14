package com.example.ohms.entity;

import com.example.ohms.enums.MedicalSpecialty;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

// admin sẽ tạo service đi kèm với giá, khám xong doctor chọn service rồi thanh toán 90% còn lại + tiền thuốc
//tạo dịch vụ khám 
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
   @Enumerated(EnumType.STRING)
   MedicalSpecialty medicalSpecialty;

   @Override
   public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      MedicalExamination that = (MedicalExamination) o;
      return id != null && id.equals   (that.id);
   }

   @Override
   public int hashCode() {
      return id != null ? id.hashCode() : 0;
   }
}
