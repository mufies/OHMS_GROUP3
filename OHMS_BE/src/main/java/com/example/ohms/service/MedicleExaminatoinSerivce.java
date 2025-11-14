package com.example.ohms.service;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.example.ohms.dto.request.MedicleExaminationRequest;
import com.example.ohms.dto.request.SpecilityMedicalExaminationRequest;
import com.example.ohms.dto.response.MedicleExaminationResponse;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.MedicalExaminationMappers;
import com.example.ohms.repository.MedicleExaminatioRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE, makeFinal = true)
public class MedicleExaminatoinSerivce{
   MedicleExaminatioRepository medicleExaminationRepository;
   MedicalExaminationMappers medicalExaminationMapper;
// tạo dịch vụ khám bệnh mới, này chắc để quyền admin
  @PreAuthorize("hasRole('ADMIN')")
   public MedicleExaminationResponse createMedicleExamination(MedicleExaminationRequest medicleExaminationRequest){
      MedicalExamination medicalExamination = medicalExaminationMapper.toMedicalExamination(medicleExaminationRequest);
      medicleExaminationRepository.save(medicalExamination);
      return medicalExaminationMapper.toMedicleExaminationResponse(medicalExamination);
   }
// lấy tất cả dịch vụ khám
   public List<MedicleExaminationResponse> getListMedicleExamination(){
      return medicleExaminationRepository.findAll().stream().map(medicalExaminationMapper :: toMedicleExaminationResponse).toList();
   }
// xóa dịch vụ khám
// tí nhớ check relation lại
   public Void deleteMedicleExamination(String id){
      medicleExaminationRepository.deleteById(id);
      return null;
   }
// get detail
   public MedicleExaminationResponse getDetailMedicleEx(String id){
      return medicalExaminationMapper.toMedicleExaminationResponse(medicleExaminationRepository.findById(id).orElseThrow(()-> new AppException(ErrorCode.MEDICLE_NOT_FOUND))) ;
   }
// put, thay đổi tên hoặc thay đổi giá
   public MedicleExaminationResponse updateMedicleExamination(MedicleExaminationRequest medicleExaminationRequest, String id){
      MedicalExamination medicalExamination = medicleExaminationRepository.findById(id).orElseThrow(()-> new AppException(ErrorCode.MEDICLE_NOT_FOUND));
      if(medicleExaminationRequest.getName() != null){
            medicalExamination.setName(medicleExaminationRequest.getName());
      }
      if(medicleExaminationRequest.getPrice() > 0){
         medicalExamination.setPrice(medicleExaminationRequest.getPrice());
      }
      if(medicleExaminationRequest.getMinDuration() != null){
         medicalExamination.setMinDuration(medicleExaminationRequest.getMinDuration());
      }
      medicleExaminationRepository.save(medicalExamination);
      return medicalExaminationMapper.toMedicleExaminationResponse(medicalExamination);
   }

   public List<MedicleExaminationResponse> getMedicalExaminationsByMedicalSpecialy(
      SpecilityMedicalExaminationRequest request
   )
   {
      return medicleExaminationRepository.findAllByMedicalSpecialty(request.getSpecility())
         .stream()
         .map(medicalExaminationMapper::toMedicleExaminationResponse)
         .toList();
   }

   public MedicleExaminationResponse getMedicalExaminationByName(String name) {
      MedicalExamination medicalExamination = medicleExaminationRepository.findByName(name)
         .orElseThrow(() -> new AppException(ErrorCode.MEDICLE_NOT_FOUND));
      return medicalExaminationMapper.toMedicleExaminationResponse(medicalExamination);
   }

}