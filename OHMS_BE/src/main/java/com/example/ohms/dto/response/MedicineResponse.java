package com.example.ohms.dto.response;

import com.example.ohms.enums.MedicineType;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MedicineResponse {
   String id;
   String name;
   int quantity;
   MedicineType type;
}
