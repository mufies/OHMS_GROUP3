package com.example.ohms.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.BillRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.BillResponse;
import com.example.ohms.service.BillService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/bill")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BillController {
   BillService billService;

   @PostMapping("/{patientId}")
    @PreAuthorize("hasRole('DOCTOR')")
   public ApiResponse<BillResponse> createBill(
      @PathVariable("patientId") String patientId,
      @RequestBody BillRequest billRequest
   ){
      return ApiResponse.<BillResponse>builder()
      .code(200)
      .results(billService.createBill(patientId, billRequest))
      .build();
   }
   @GetMapping
   public ApiResponse<List<BillResponse>> getListBill(){
      return ApiResponse.<List<BillResponse>>builder()
      .code(200)
      .results(billService.getListBill())
      .build();
   }
   @PreAuthorize("hasRole('ADMIN')")
   @GetMapping("/getBillByPatient/{patientId}")
   public ApiResponse<List<BillResponse>> getListBillByPatients(
      @PathVariable("patientId") String id
   ){
      return ApiResponse.<List<BillResponse>>builder()
      .code(200)
      .results(billService.getBillByPatients(id))
      .build();
   }
   @PreAuthorize("hasRole('DOCTOR')")
   @DeleteMapping("/{billId}")
   public ApiResponse<Void> deleteBill(
      @PathVariable("billId") String id
   ){
      billService.deleteBill(id);
      return ApiResponse.<Void>builder().code(200).message("delete sucessful").build();
   }
@PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT')")
   @GetMapping("/{billId}")
   public ApiResponse<BillResponse> getDetailBill(@PathVariable("billId") String id){
      return ApiResponse.<BillResponse>builder()
      .code(200)
      .results(billService.getBillId(id))
      .build();
   }
}
