package com.example.ohms.controller;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.PrescriptionRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.PrescriptionResponse;
import com.example.ohms.service.PrescriptionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/prescription")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PrescriptionController {
   PrescriptionService prescriptionService;
   // bác sĩ mới kê đơn được
   @PostMapping("{patientId}")
   public ApiResponse<PrescriptionResponse> createPrescription(Authentication authAuthentication, @PathVariable("patientId") String id,
    @RequestBody PrescriptionRequest prescriptionRequest){
      return ApiResponse.<PrescriptionResponse>builder()
      .code(200)
      .results(prescriptionService.createPrescription(authAuthentication, prescriptionRequest, id))
      .build();

   }
   @GetMapping("{patientId}")
   public ApiResponse<List<PrescriptionResponse>> getListPrescriptionByPatientID(@PathVariable("patientId") String id){
      return ApiResponse.<List<PrescriptionResponse>>builder()
      .code(200)
      .results(prescriptionService.viewListPrescriptionForPatients(id)).build();
   }
}
