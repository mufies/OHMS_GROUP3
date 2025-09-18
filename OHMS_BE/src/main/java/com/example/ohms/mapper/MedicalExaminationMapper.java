package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.MedicleExaminationRequest;
import com.example.ohms.dto.response.MedicleExaminationResponse;
import com.example.ohms.entity.MedicalExamination;

@Mapper(componentModel = "spring")
public interface MedicalExaminationMapper {
   @Mapping(target = "id", ignore = true)
   MedicalExamination toMedicalExamination(MedicleExaminationRequest medicleExaminationRequest);
   MedicleExaminationResponse toMedicleExaminationResponse(MedicalExamination medicalExamination);
}
