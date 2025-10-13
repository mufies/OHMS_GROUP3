package com.example.ohms.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.MedicalServicesRequestRequest;
import com.example.ohms.dto.response.MedicalServicesRequestResponse;
import com.example.ohms.service.MedicalServicesRequestService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/medical-requests")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MedicalServicesRequestController {

    MedicalServicesRequestService medicalServicesRequestService;

    // Tạo một yêu cầu dịch vụ y tế mới
    @PostMapping
    public ResponseEntity<MedicalServicesRequestResponse> createMedicalServicesRequest(@Valid @RequestBody MedicalServicesRequestRequest request) {
        log.info("Creating new medical services request for patient: {} from doctor: {}", request.getPatientId(), request.getDoctorId());
        
        try {
            MedicalServicesRequestResponse response = medicalServicesRequestService.createMedicalServicesRequest(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error creating medical services request: {}", e.getMessage());
            throw e;
        }
    }

    // Lấy một yêu cầu dịch vụ y tế theo ID
    @GetMapping("/{id}")
    public ResponseEntity<MedicalServicesRequestResponse> getMedicalServicesRequestById(@PathVariable String id) {
        log.info("Getting medical services request by id: {}", id);
        
        try {
            MedicalServicesRequestResponse response = medicalServicesRequestService.getMedicalServicesRequestById(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting medical services request: {}", e.getMessage());
            throw e;
        }
    }

    // Lấy danh sách các yêu cầu của một bệnh nhân
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalServicesRequestResponse>> getMedicalServicesRequestsByPatient(@PathVariable String patientId) {
        log.info("Getting medical services requests for patient: {}", patientId);
        List<MedicalServicesRequestResponse> responses = medicalServicesRequestService.getMedicalServicesRequestsByPatient(patientId);
        return ResponseEntity.ok(responses);
    }

    // Lấy danh sách các yêu cầu được tạo bởi một bác sĩ
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalServicesRequestResponse>> getMedicalServicesRequestsByDoctor(@PathVariable String doctorId) {
        log.info("Getting medical services requests by doctor: {}", doctorId);
        List<MedicalServicesRequestResponse> responses = medicalServicesRequestService.getMedicalServicesRequestsByDoctor(doctorId);
        return ResponseEntity.ok(responses);
    }

    // Cập nhật một yêu cầu dịch vụ y tế
    @PutMapping("/{id}")
    public ResponseEntity<MedicalServicesRequestResponse> updateMedicalServicesRequest(
            @PathVariable String id,
            @Valid @RequestBody MedicalServicesRequestRequest request) {
        log.info("Updating medical services request: {}", id);
        
        try {
            MedicalServicesRequestResponse response = medicalServicesRequestService.updateMedicalServicesRequest(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating medical services request: {}", e.getMessage());
            throw e;
        }
    }

    // Xóa một yêu cầu dịch vụ y tế
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicalServicesRequest(@PathVariable String id) {
        log.info("Deleting medical services request: {}", id);
        
        try {
            medicalServicesRequestService.deleteMedicalServicesRequest(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting medical services request: {}", e.getMessage());
            throw e;
        }
    }
}
