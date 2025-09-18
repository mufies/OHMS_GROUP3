package com.example.ohms.dto.request;
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
public class MedicineRequest {
   String name;
   int quantity; // kiểu int trong spring không thể = null nên mình phải set nó mặc định= 0 nha
   MedicineType type;
   int price; //giá tính theo đơn vị
}
