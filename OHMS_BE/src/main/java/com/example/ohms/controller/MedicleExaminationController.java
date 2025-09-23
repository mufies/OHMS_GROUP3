package com.example.ohms.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.MedicleExaminationRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.MedicleExaminationResponse;
import com.example.ohms.service.MedicleExaminatoinSerivce;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/medical-examination")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MedicleExaminationController {
   MedicleExaminatoinSerivce medicleExaminatoinSerivce;
   @PostMapping
   public ApiResponse<MedicleExaminationResponse> createMedicleExamination(
      @RequestBody MedicleExaminationRequest medicleExaminationRequest
   ){
      return ApiResponse.<MedicleExaminationResponse>builder()
      .code(200)
      .results(medicleExaminatoinSerivce.createMedicleExamination(medicleExaminationRequest))
      .build();
   }
   @GetMapping
   public ApiResponse<List<MedicleExaminationResponse>> getListMedicleExamination(){
      return ApiResponse.<List<MedicleExaminationResponse>>builder()
      .code(200)
      .results(medicleExaminatoinSerivce.getListMedicleExamination())
      .build();
   }
   // xóa luôn để cuối cùng để check relation
   @DeleteMapping("/{id}")
   public ApiResponse<Void> deleteMedicleExamination(
      @PathVariable("id") String id
   ){
      medicleExaminatoinSerivce.deleteMedicleExamination(id);
      return ApiResponse.<Void>builder()
      .code(200)
      .message("delete successfull")
      .build();
   }
   @GetMapping("/{id}")
   public ApiResponse<MedicleExaminationResponse> getDetailMedicleExamination(
      @PathVariable("id") String id
   ){
      return ApiResponse.<MedicleExaminationResponse>builder()
      .code(200)
      .results(medicleExaminatoinSerivce.getDetailMedicleEx(id))
      .build();
   }
   @PatchMapping("/{id}")
   public ApiResponse<MedicleExaminationResponse> patchMedicleExamination(
      @PathVariable("id") String id,
      @RequestBody MedicleExaminationRequest medicleExaminationRequest
   ){
      return ApiResponse.<MedicleExaminationResponse>builder()
      .code(200)
      .results(medicleExaminatoinSerivce.updateMedicleExamination(medicleExaminationRequest, id))
      .build();

   }
}
