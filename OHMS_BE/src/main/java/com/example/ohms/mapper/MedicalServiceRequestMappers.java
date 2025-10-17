package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.MedicalServicesRequestRequest;
import com.example.ohms.dto.response.MedicalServicesRequestResponse;
import com.example.ohms.entity.MedicalServicesRequest;

@Mapper(componentModel = "spring")
public interface MedicalServiceRequestMappers {    
    @Mapping(target = "id", ignore = true)
    MedicalServicesRequest toMedicalServicesRequest(MedicalServicesRequestRequest request);
    MedicalServicesRequestResponse toMedicalServicesRequestResponse(MedicalServicesRequest msr);
}