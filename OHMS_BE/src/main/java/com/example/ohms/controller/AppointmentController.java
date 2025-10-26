package com.example.ohms.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.AppointmentRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.AppointmentResponse;
import com.example.ohms.entity.Appointment;
import com.example.ohms.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AppointmentController {
    
    AppointmentService appointmentService;
    
    // Tạo appointment mới
    @PostMapping()
    public ResponseEntity<AppointmentResponse> createAppointment(@Valid @RequestBody AppointmentRequest request) {
        log.info("Creating new appointment for patient: {} with doctor: {}", request.getPatientId(), request.getDoctorId());
        
        try {
            AppointmentResponse response = appointmentService.createAppointment(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error creating appointment: {}", e.getMessage());
            throw e;
        }
        
    }
    
    // Lấy appointment theo ID
    @GetMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable String appointmentId) {
        log.info("Getting appointment by id: {}", appointmentId);
        
        try {
            AppointmentResponse response = appointmentService.getAppointmentById(appointmentId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting appointment: {}", e.getMessage());
            throw e;
        }
    }
    
    // Lấy danh sách appointment của patient
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByPatient(@PathVariable String patientId) {
        log.info("Getting appointments for patient: {}", patientId);
        
        List<AppointmentResponse> appointments = appointmentService.getAppointmentsByPatient(patientId);
        return ResponseEntity.ok(appointments);
    }


    
    // Lấy danh sách appointment của doctor
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByDoctor(@PathVariable String doctorId) {
        log.info("Getting appointments for doctor: {}", doctorId);
        
        List<AppointmentResponse> appointments = appointmentService.getAppointmentsByDoctor(doctorId);
        return ResponseEntity.ok(appointments);
    }
    
    // Lấy appointment hôm nay của doctor
    @GetMapping("/doctor/{doctorId}/today")
    public ResponseEntity<List<AppointmentResponse>> getTodayAppointmentsByDoctor(@PathVariable String doctorId) {
        log.info("Getting today's appointments for doctor: {}", doctorId);
        
        List<AppointmentResponse> appointments = appointmentService.getTodayAppointmentsByDoctor(doctorId);
        return ResponseEntity.ok(appointments);
    }
    
    // Lấy appointment sắp tới của patient
    @GetMapping("/patient/{patientId}/upcoming")
    public ResponseEntity<List<AppointmentResponse>> getUpcomingAppointmentsByPatient(@PathVariable String patientId) {
        log.info("Getting upcoming appointments for patient: {}", patientId);
        
        List<AppointmentResponse> appointments = appointmentService.getUpcomingAppointmentsByPatient(patientId);
        return ResponseEntity.ok(appointments);
    }
    
    // Lấy appointment sắp tới của doctor
    @GetMapping("/doctor/{doctorId}/upcoming")
    public ResponseEntity<List<AppointmentResponse>> getUpcomingAppointmentsByDoctor(@PathVariable String doctorId) {
        log.info("Getting upcoming appointments for doctor: {}", doctorId);
        
        List<AppointmentResponse> appointments = appointmentService.getUpcomingAppointmentsByDoctor(doctorId);
        return ResponseEntity.ok(appointments);
    }
    
    // Lấy appointment theo ngày
    @GetMapping("/date/{date}")
    public ResponseEntity<List<AppointmentResponse>> getAppointmentsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Getting appointments for date: {}", date);
        
        List<AppointmentResponse> appointments = appointmentService.getAppointmentsByDate(date);
        return ResponseEntity.ok(appointments);
    }
    
    // Lấy appointment của doctor theo ngày
    @GetMapping("/doctor/{doctorId}/date/{date}")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointmentsByDate(
            @PathVariable String doctorId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Getting appointments for doctor: {} on date: {}", doctorId, date);
        
        List<AppointmentResponse> appointments = appointmentService.getDoctorAppointmentsByDate(doctorId, date);
        return ResponseEntity.ok(appointments);
    }
    
    // Lấy appointment của patient theo ngày cụ thể
    @GetMapping("/patient/{patientId}/date/{date}")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointmentsByDate(
            @PathVariable String patientId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        log.info("Getting appointments for patient: {} on date: {}", patientId, date);
        
        List<AppointmentResponse> appointments = appointmentService.getPatientAppointmentsByDate(patientId, date);
        return ResponseEntity.ok(appointments);
    }
    
    // Cập nhật appointment
    @PutMapping("/{appointmentId}")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable String appointmentId,
            @Valid @RequestBody AppointmentRequest request) {
        log.info("Updating appointment: {}", appointmentId);
        
        try {
            AppointmentResponse response = appointmentService.updateAppointment(appointmentId, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating appointment: {}", e.getMessage());
            throw e;
        }
    }
    
    // Xóa appointment
    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable String appointmentId) {
        log.info("Deleting appointment: {}", appointmentId);
        
        try {
            appointmentService.deleteAppointment(appointmentId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting appointment: {}", e.getMessage());
            throw e;
        }
    }
    
    // Assign doctor to appointment
    @PutMapping("/{appointmentId}/assign-doctor/{doctorId}")
    public ResponseEntity<Void> assignDoctorToAppointment(@PathVariable String appointmentId, @PathVariable String doctorId) {
        log.info("Assigning doctor {} to appointment {}", doctorId, appointmentId);
        
        try {
            appointmentService.assignDoctorToAppointment(appointmentId, doctorId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error assigning doctor to appointment: {}", e.getMessage());
            throw e;
        }
    }
    
    // Update appointment status
    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable String appointmentId,
            @RequestParam String status) {
        log.info("Updating status of appointment {} to {}", appointmentId, status);
        
        try {
            AppointmentResponse response = appointmentService.updateAppointmentStatus(appointmentId, status);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating appointment status: {}", e.getMessage());
            throw e;
        }
    }

    // Update appointment medical examinations
    @PutMapping("/{appointmentId}/medical-examinations")
    public ResponseEntity<AppointmentResponse> updateAppointmentMedicalExaminations(
            @PathVariable String appointmentId,
            @RequestBody Map<String, List<String>> payload) {
        log.info("Updating medical examinations for appointment {}", appointmentId);
        
        try {
            List<String> medicalExaminationIds = payload.get("medicalExaminationIds");
            AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(appointmentId, medicalExaminationIds);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating medical examinations: {}", e.getMessage());
            throw e;
        }
    }
    
    // Calculate total price and deposit for medical examinations
    @PostMapping("/calculate-price")
    public ResponseEntity<Map<String, Integer>> calculatePrice(@RequestBody Map<String, Object> payload) {
        @SuppressWarnings("unchecked")
        List<String> medicalExaminationIds = (List<String>) payload.get("medicalExaminationIds");
        Integer discountPercent = payload.get("discount") != null ? 
            Integer.parseInt(payload.get("discount").toString()) : 0;
        
        int totalPrice = appointmentService.calculateTotalPrice(medicalExaminationIds);
        int priceAfterDiscount = appointmentService.calculatePriceAfterDiscount(totalPrice, discountPercent);
        int deposit = appointmentService.calculateDeposit(priceAfterDiscount);
        
        Map<String, Integer> result = new java.util.HashMap<>();
        result.put("totalPrice", totalPrice);
        result.put("discount", discountPercent);
        result.put("priceAfterDiscount", priceAfterDiscount);
        result.put("deposit", deposit);
        
        return ResponseEntity.ok(result);
    }
    
    // // Lấy các khung giờ đã đặt của doctor
    // @GetMapping("/doctor/{doctorId}/booked-slots")
    // public ResponseEntity<List<String>> getBookedTimeSlots(
    //         @PathVariable String doctorId,
    //         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    //     log.info("Getting booked time slots for doctor {} on date {}", doctorId, date);
    //     return ResponseEntity.ok(List.of());
    // }
    // tạo khám cho thằng user vãng lai 
}
