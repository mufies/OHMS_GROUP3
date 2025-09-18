package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.MedicineRequest;
import com.example.ohms.dto.response.MedicineResponse;
import com.example.ohms.entity.Medicine;

@Mapper(componentModel = "spring")
public interface MedicineMapper {
   @Mapping(target = "id", ignore = true)
   Medicine toMedicine(MedicineRequest medicineRequest);
   MedicineResponse toMedicineResponse(Medicine medicine);
}
