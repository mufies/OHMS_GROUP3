package com.example.ohms.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.example.ohms.dto.response.MedicalRecordResponse;
import com.example.ohms.entity.MedicalRecord;

@Component
public class MedicalRecordMapper {
    
    public MedicalRecordResponse toResponse(MedicalRecord medicalRecord) {
        if (medicalRecord == null) {
            return null;
        }
        
        MedicalRecordResponse.MedicalRecordResponseBuilder builder = MedicalRecordResponse.builder()
            .id(medicalRecord.getId())
            .symptoms(medicalRecord.getSymptoms())
            .diagnosis(medicalRecord.getDiagnosis())
            .createdAt(medicalRecord.getCreatedAt());
        
        // Appointment info
        if (medicalRecord.getAppointment() != null) {
            builder.appointmentId(medicalRecord.getAppointment().getId())
                   .appointmentDate(medicalRecord.getAppointment().getWorkDate() != null 
                       ? medicalRecord.getAppointment().getWorkDate().toString() : null)
                   .appointmentTime(medicalRecord.getAppointment().getStartTime() != null 
                       ? medicalRecord.getAppointment().getStartTime().toString() : null);
            
            // Medical examinations from service appointments (child appointments)
            if (medicalRecord.getAppointment().getServiceAppointments() != null 
                && !medicalRecord.getAppointment().getServiceAppointments().isEmpty()) {
                List<MedicalRecordResponse.MedicalExaminationInfo> examinations = 
                    medicalRecord.getAppointment().getServiceAppointments().stream()
                        .filter(serviceApp -> serviceApp.getMedicalExamnination() != null)
                        .flatMap(serviceApp -> serviceApp.getMedicalExamnination().stream())
                        .distinct() // Remove duplicates if any
                        .map(exam -> MedicalRecordResponse.MedicalExaminationInfo.builder()
                            .id(exam.getId())
                            .name(exam.getName())
                            .price(exam.getPrice())
                            .build())
                        .collect(Collectors.toList());
                builder.medicalExaminations(examinations);
            }
        }
        
        // Patient info
        if (medicalRecord.getPatient() != null) {
            builder.patientId(medicalRecord.getPatient().getId())
                   .patientName(medicalRecord.getPatient().getUsername())
                   .patientEmail(medicalRecord.getPatient().getEmail())
                   .patientPhone(medicalRecord.getPatient().getPhone() != null 
                       ? medicalRecord.getPatient().getPhone().toString() : null);
        }
        
        // Doctor info
        if (medicalRecord.getDoctor() != null) {
            builder.doctorId(medicalRecord.getDoctor().getId())
                   .doctorName(medicalRecord.getDoctor().getUsername());
            
            if (medicalRecord.getDoctor().getMedicleSpecially() != null 
                && !medicalRecord.getDoctor().getMedicleSpecially().isEmpty()) {
                builder.doctorSpecialty(medicalRecord.getDoctor().getMedicleSpecially().toString());
            }
        }
        
        // Prescription info
        if (medicalRecord.getPrescription() != null) {
            MedicalRecordResponse.PrescriptionInfo prescriptionInfo = 
                MedicalRecordResponse.PrescriptionInfo.builder()
                    .id(medicalRecord.getPrescription().getId())
                    .amount(medicalRecord.getPrescription().getAmount())
                    .status(medicalRecord.getPrescription().getStatus() != null 
                        ? medicalRecord.getPrescription().getStatus().name() : null)
                    .build();
            
            // Medicines
            if (medicalRecord.getPrescription().getMedicinePrescription() != null) {
                List<MedicalRecordResponse.MedicineInfo> medicines = 
                    medicalRecord.getPrescription().getMedicinePrescription().stream()
                        .map(pm -> MedicalRecordResponse.MedicineInfo.builder()
                            .id(pm.getId())
                            .name(pm.getMedicine() != null ? pm.getMedicine().getName() : null)
                            .dosage(pm.getAmount() != null ? pm.getAmount().toString() : null)
                            .instructions(pm.getInstruction()) // Can be added later if needed
                            .build())
                        .collect(Collectors.toList());
                prescriptionInfo.setMedicines(medicines);
            }
            
            builder.prescription(prescriptionInfo);
        }
        
        return builder.build();
    }
}
