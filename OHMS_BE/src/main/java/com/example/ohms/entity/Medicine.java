package com.example.ohms.entity;

import com.example.ohms.enums.MedicineType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor

@FieldDefaults(level = AccessLevel.PRIVATE)
public class Medicine {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
   String name;
   int quantity; // số lượng
  @Enumerated(EnumType.STRING)

   MedicineType type; // mỗi loại thuốc có đơn vị riêng
   Integer price; // giá tính theo đơn vị
}
