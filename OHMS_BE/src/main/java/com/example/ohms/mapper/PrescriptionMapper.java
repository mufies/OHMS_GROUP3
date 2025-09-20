package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.response.PrescriptionResponse;
import com.example.ohms.entity.Prescription;
@Mapper(componentModel = "spring")

public interface PrescriptionMapper {
  @Mapping(target = "doctor", source = "doctor")
   @Mapping(target = "patient", source = "patient")
   PrescriptionResponse toPrescriptionResponse(Prescription prescription);
}

