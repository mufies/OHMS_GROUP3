package com.example.ohms.dto.request;
import com.example.ohms.enums.MedicineType;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
   @RequiredArgsConstructor
   @FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class MedicineRequest {
   String name;
   @NotNull(message = "FIELD_NOT_NULL")
   int quantity; // kiểu int trong spring không thể = null nên mình phải set nó mặc định= 0 nha
      @NotNull(message = "FIELD_NOT_NULL")
   MedicineType type;
      @NotNull(message = "FIELD_NOT_NULL")
   int price; //giá tính theo đơn vị
}
