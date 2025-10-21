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

import com.example.ohms.dto.request.MedicalRecordRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.MedicalRecordResponse;
import com.example.ohms.service.MedicalRecordService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/medical-records")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MedicalRecordController {
    
    MedicalRecordService medicalRecordService;
    
    /**
     * Tạo hồ sơ bệnh án mới
     * POST /medical-records
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> createMedicalRecord(
            @Valid @RequestBody MedicalRecordRequest request) {
        log.info("REST request to create medical record for appointment: {}", request.getAppointmentId());
        
        try {
            MedicalRecordResponse response = medicalRecordService.createMedicalRecord(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<MedicalRecordResponse>builder()
                    .code(201)
                    .message("Medical record created successfully")
                    .results(response)
                    .build());
        } catch (Exception e) {
            log.error("Error creating medical record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<MedicalRecordResponse>builder()
                    .code(400)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Lấy hồ sơ bệnh án theo ID
     * GET /medical-records/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getMedicalRecordById(
            @PathVariable String id) {
        log.info("REST request to get medical record: {}", id);
        
        try {
            MedicalRecordResponse response = medicalRecordService.getMedicalRecordById(id);
            return ResponseEntity.ok(ApiResponse.<MedicalRecordResponse>builder()
                .code(200)
                .message("Medical record retrieved successfully")
                .results(response)
                .build());
        } catch (Exception e) {
            log.error("Error getting medical record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.<MedicalRecordResponse>builder()
                    .code(404)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Lấy hồ sơ bệnh án theo appointment ID
     * GET /medical-records/appointment/{appointmentId}
     */
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getMedicalRecordByAppointmentId(
            @PathVariable String appointmentId) {
        log.info("REST request to get medical record by appointment: {}", appointmentId);
        
        try {
            MedicalRecordResponse response = medicalRecordService.getMedicalRecordByAppointmentId(appointmentId);
            return ResponseEntity.ok(ApiResponse.<MedicalRecordResponse>builder()
                .code(200)
                .message("Medical record retrieved successfully")
                .results(response)
                .build());
        } catch (Exception e) {
            log.error("Error getting medical record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.<MedicalRecordResponse>builder()
                    .code(404)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Lấy tất cả hồ sơ bệnh án của bệnh nhân
     * GET /medical-records/patient/{patientId}
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getMedicalRecordsByPatient(
            @PathVariable String patientId) {
        log.info("REST request to get medical records for patient: {}", patientId);
        
        try {
            List<MedicalRecordResponse> responses = medicalRecordService.getMedicalRecordsByPatient(patientId);
            return ResponseEntity.ok(ApiResponse.<List<MedicalRecordResponse>>builder()
                .code(200)
                .message("Medical records retrieved successfully")
                .results(responses)
                .build());
        } catch (Exception e) {
            log.error("Error getting medical records: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<List<MedicalRecordResponse>>builder()
                    .code(400)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Lấy tất cả hồ sơ bệnh án do bác sĩ tạo
     * GET /medical-records/doctor/{doctorId}
     */
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getMedicalRecordsByDoctor(
            @PathVariable String doctorId) {
        log.info("REST request to get medical records for doctor: {}", doctorId);
        
        try {
            List<MedicalRecordResponse> responses = medicalRecordService.getMedicalRecordsByDoctor(doctorId);
            return ResponseEntity.ok(ApiResponse.<List<MedicalRecordResponse>>builder()
                .code(200)
                .message("Medical records retrieved successfully")
                .results(responses)
                .build());
        } catch (Exception e) {
            log.error("Error getting medical records: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<List<MedicalRecordResponse>>builder()
                    .code(400)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Cập nhật hồ sơ bệnh án
     * PUT /medical-records/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> updateMedicalRecord(
            @PathVariable String id,
            @Valid @RequestBody MedicalRecordRequest request) {
        log.info("REST request to update medical record: {}", id);
        
        try {
            MedicalRecordResponse response = medicalRecordService.updateMedicalRecord(id, request);
            return ResponseEntity.ok(ApiResponse.<MedicalRecordResponse>builder()
                .code(200)
                .message("Medical record updated successfully")
                .results(response)
                .build());
        } catch (Exception e) {
            log.error("Error updating medical record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<MedicalRecordResponse>builder()
                    .code(400)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Xóa hồ sơ bệnh án
     * DELETE /medical-records/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicalRecord(@PathVariable String id) {
        log.info("REST request to delete medical record: {}", id);
        
        try {
            medicalRecordService.deleteMedicalRecord(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(200)
                .message("Medical record deleted successfully")
                .build());
        } catch (Exception e) {
            log.error("Error deleting medical record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Void>builder()
                    .code(400)
                    .message(e.getMessage())
                    .build());
        }
    }
}
