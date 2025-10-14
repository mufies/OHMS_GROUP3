package com.example.ohms.controller;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.MedicineRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.MedicineResponse;
import com.example.ohms.service.MedicineService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/medicine")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MedicineController {
   MedicineService medicineService;

   @PostMapping()
   public ApiResponse<MedicineResponse> createMedicine(
      @Valid @RequestBody MedicineRequest medicineRequest
   ){
      return ApiResponse.<MedicineResponse>builder().
      code(200).
      results(medicineService.createMedicine(medicineRequest)).
      build();
   }
   @PatchMapping("update/{id}")
   public ApiResponse<MedicineResponse> updateMedicine(
      @RequestBody MedicineRequest medicineRequest,
      @PathVariable("id") String id
   ){
      return ApiResponse.<MedicineResponse>builder()
      .code(200)
      .results(medicineService.updateMedicine(medicineRequest, id))
      .build();
   }
   @GetMapping()
   public ApiResponse<List<MedicineResponse>> getListMedicine(){
      return ApiResponse.<List<MedicineResponse>>builder()
      .code(200)
      .results(medicineService.getAllMedicine())
      .build();
   }
   @GetMapping("/{id}")
   public ApiResponse<MedicineResponse> getDetailMedicine(@PathVariable("id") String id){
      return ApiResponse.<MedicineResponse>builder()
      .code(200)
      .results(medicineService.getDetailMedicine(id))
      .build();
   }
}
