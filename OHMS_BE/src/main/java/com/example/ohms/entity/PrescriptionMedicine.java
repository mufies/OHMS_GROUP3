package com.example.ohms.entity;

import jakarta.persistence.Entity;
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

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
// mình đang tìm 1 set cái này 
public class PrescriptionMedicine {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
// lấy từng cái thuốc với số lượng ra
// trỏ tới từng cái thuốc
// nhiều thuốc cho 1 cái đơn vị 
   // @ManyToOne
   // Prescription prescription; // cái này là nguyên do cho đệ quy
   @ManyToOne 
   Medicine medicine; // lấy id của thuốc
   Integer amount; // lấy số lượng của id đó
   String instruction;
}
