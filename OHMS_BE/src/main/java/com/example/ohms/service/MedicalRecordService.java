package com.example.ohms.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ohms.dto.request.MedicalRecordRequest;
import com.example.ohms.dto.response.MedicalRecordResponse;
import com.example.ohms.entity.Appointment;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.MedicalRecord;
import com.example.ohms.entity.Prescription;
import com.example.ohms.mapper.MedicalRecordMapper;
import com.example.ohms.repository.AppointmentRepository;
import com.example.ohms.repository.MedicalRecordRepository;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.PrescriptionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Transactional
public class MedicalRecordService {
    
    MedicalRecordRepository medicalRecordRepository;
    AppointmentRepository appointmentRepository;
    PrescriptionRepository prescriptionRepository;
    MedicleExaminatioRepository medicleExaminatioRepository;
    MedicalRecordMapper medicalRecordMapper;
    
    /**
     * Tạo hồ sơ bệnh án mới
     */
    public MedicalRecordResponse createMedicalRecord(MedicalRecordRequest request) {
        log.info("Creating medical record for appointment: {}", request.getAppointmentId());
        
        // Kiểm tra appointment tồn tại
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + request.getAppointmentId()));
        
        // Kiểm tra xem appointment đã có medical record chưa
        MedicalRecord existingRecord = medicalRecordRepository.findByAppointmentId(request.getAppointmentId());
        if (existingRecord != null) {
            throw new RuntimeException("Medical record already exists for this appointment");
        }
        
        // Tạo medical record
        MedicalRecord medicalRecord = MedicalRecord.builder()
            .appointment(appointment)
            .patient(appointment.getPatient())
            .doctor(appointment.getDoctor())
            .symptoms(request.getSymptoms())
            .diagnosis(request.getDiagnosis())
            .createdAt(LocalDateTime.now())
            .build();
        
        // Thêm prescription nếu có
        if (request.getPrescriptionId() != null && !request.getPrescriptionId().isBlank()) {
            Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + request.getPrescriptionId()));
            medicalRecord.setPrescription(prescription);
        }
        
        // Thêm medical examinations nếu có
        if (request.getMedicalExaminationIds() != null && !request.getMedicalExaminationIds().isEmpty()) {
            Set<MedicalExamination> examinations = new HashSet<>();
            for (String examId : request.getMedicalExaminationIds()) {
                MedicalExamination examination = medicleExaminatioRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("Medical examination not found: " + examId));
                examinations.add(examination);
            }
            medicalRecord.setMedicalExamination(examinations);
        }
        
        MedicalRecord savedRecord = medicalRecordRepository.save(medicalRecord);
        
        return medicalRecordMapper.toResponse(savedRecord);
    }
    
    /**
     * Lấy medical record theo ID
     */
    public MedicalRecordResponse getMedicalRecordById(String id) {
        log.info("Getting medical record by id: {}", id);
        
        MedicalRecord medicalRecord = medicalRecordRepository.findByIdWithDetails(id);
        if (medicalRecord == null) {
            throw new RuntimeException("Medical record not found with id: " + id);
        }
        
        return medicalRecordMapper.toResponse(medicalRecord);
    }
    
    /**
     * Lấy medical record theo appointment ID
     */
    public MedicalRecordResponse getMedicalRecordByAppointmentId(String appointmentId) {
        log.info("Getting medical record by appointment id: {}", appointmentId);
        
        MedicalRecord medicalRecord = medicalRecordRepository.findByAppointmentId(appointmentId);
        if (medicalRecord == null) {
            throw new RuntimeException("Medical record not found for appointment: " + appointmentId);
        }
        
        return medicalRecordMapper.toResponse(medicalRecord);
    }
    
    /**
     * Lấy tất cả medical records của bệnh nhân
     */
    public List<MedicalRecordResponse> getMedicalRecordsByPatient(String patientId) {
        log.info("Getting medical records for patient: {}", patientId);
        
        List<MedicalRecord> medicalRecords = medicalRecordRepository.findByPatientId(patientId);
        return medicalRecords.stream()
            .map(medicalRecordMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Lấy tất cả medical records do bác sĩ tạo
     */
    public List<MedicalRecordResponse> getMedicalRecordsByDoctor(String doctorId) {
        log.info("Getting medical records for doctor: {}", doctorId);
        
        List<MedicalRecord> medicalRecords = medicalRecordRepository.findByDoctorId(doctorId);
        return medicalRecords.stream()
            .map(medicalRecordMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Cập nhật medical record
     */
    public MedicalRecordResponse updateMedicalRecord(String id, MedicalRecordRequest request) {
        log.info("Updating medical record: {}", id);
        
        MedicalRecord medicalRecord = medicalRecordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Medical record not found with id: " + id));
        
        // Cập nhật thông tin
        if (request.getSymptoms() != null) {
            medicalRecord.setSymptoms(request.getSymptoms());
        }
        if (request.getDiagnosis() != null) {
            medicalRecord.setDiagnosis(request.getDiagnosis());
        }
        
        // Cập nhật prescription
        if (request.getPrescriptionId() != null && !request.getPrescriptionId().isBlank()) {
            Prescription prescription = prescriptionRepository.findById(request.getPrescriptionId())
                .orElseThrow(() -> new RuntimeException("Prescription not found with id: " + request.getPrescriptionId()));
            medicalRecord.setPrescription(prescription);
        }
        
        // Cập nhật medical examinations
        if (request.getMedicalExaminationIds() != null) {
            Set<MedicalExamination> examinations = new HashSet<>();
            for (String examId : request.getMedicalExaminationIds()) {
                MedicalExamination examination = medicleExaminatioRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("Medical examination not found: " + examId));
                examinations.add(examination);
            }
            medicalRecord.setMedicalExamination(examinations);
        }
        
        MedicalRecord updatedRecord = medicalRecordRepository.save(medicalRecord);
        log.info("Medical record updated successfully: {}", id);
        
        return medicalRecordMapper.toResponse(updatedRecord);
    }
    
    /**
     * Xóa medical record
     */
    public void deleteMedicalRecord(String id) {
        log.info("Deleting medical record: {}", id);
        
        if (!medicalRecordRepository.existsById(id)) {
            throw new RuntimeException("Medical record not found with id: " + id);
        }
        
        medicalRecordRepository.deleteById(id);
        log.info("Medical record deleted successfully: {}", id);
    }
}
