package com.example.ohms.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
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
public class PrescriptionMedicine {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id;
// lấy từng cái thuốc với số lượng ra
// trỏ tới từng cái thuốc
   @OneToMany
   Medicine medicine;
   Integer amount;
}
