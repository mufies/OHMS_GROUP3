package com.example.ohms.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ohms.dto.request.MedicalServicesRequestRequest;
import com.example.ohms.dto.response.MedicalServicesRequestResponse;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.MedicalServicesRequest;
import com.example.ohms.entity.User;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.MedicalServicesRequestRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Transactional
public class MedicalServicesRequestService {

    MedicalServicesRequestRepository medicalServicesRequestRepository;
    UserRepository userRepository;
    MedicleExaminatioRepository medicleExaminatioRepository;

    // Create a new medical services request
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public MedicalServicesRequestResponse createMedicalServicesRequest(MedicalServicesRequestRequest request) {
        log.info("Creating medical services request for patient: {} with doctor: {}", request.getPatientId(), request.getDoctorId());

        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + request.getDoctorId()));
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found with id: " + request.getPatientId()));

        MedicalServicesRequest msr = MedicalServicesRequest.builder()
                .doctor(doctor)
                .patient(patient)
                .build();

        if (request.getMedicalExaminationIds() != null && !request.getMedicalExaminationIds().isEmpty()) {
            List<MedicalExamination> medicalExaminations = new ArrayList<>();
            for (String examId : request.getMedicalExaminationIds()) {
                MedicalExamination examination = medicleExaminatioRepository.findById(examId)
                        .orElseThrow(() -> new RuntimeException("Medical examination not found: " + examId));
                medicalExaminations.add(examination);
            }
            msr.setMedicalExamnination(medicalExaminations);
            log.info("Added {} medical examinations to the request", medicalExaminations.size());
        }

        MedicalServicesRequest savedRequest = medicalServicesRequestRepository.save(msr);
        log.info("Medical services request created successfully with id: {}", savedRequest.getId());

        return toMedicalServicesRequestResponse(savedRequest);
    }

    // Get a medical services request by ID
    public MedicalServicesRequestResponse getMedicalServicesRequestById(String id) {
        log.info("Getting medical services request by id: {}", id);
        Optional<MedicalServicesRequest> msr = medicalServicesRequestRepository.findById(id);
        return msr.map(this::toMedicalServicesRequestResponse)
                  .orElseThrow(() -> new RuntimeException("Medical Services Request not found with id: " + id));
    }

    // Get all requests for a specific patient
    public List<MedicalServicesRequestResponse> getMedicalServicesRequestsByPatient(String patientId) {
        log.info("Getting medical services requests for patient: {}", patientId);
        List<MedicalServicesRequest> requests = medicalServicesRequestRepository.findByPatientId(patientId);
        return requests.stream()
                       .map(this::toMedicalServicesRequestResponse)
                       .collect(Collectors.toList());
    }

    // Get all requests for a specific doctor
    public List<MedicalServicesRequestResponse> getMedicalServicesRequestsByDoctor(String doctorId) {
        log.info("Getting medical services requests for doctor: {}", doctorId);
        List<MedicalServicesRequest> requests = medicalServicesRequestRepository.findByDoctorId(doctorId);
        return requests.stream()
                       .map(this::toMedicalServicesRequestResponse)
                       .collect(Collectors.toList());
    }

    // Update a medical services request
    public MedicalServicesRequestResponse updateMedicalServicesRequest(String id, MedicalServicesRequestRequest request) {
        log.info("Updating medical services request: {}", id);

        MedicalServicesRequest msr = medicalServicesRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical Services Request not found with id: " + id));

        // Clear existing examinations and add new ones
        msr.getMedicalExamnination().clear();
        
        if (request.getMedicalExaminationIds() != null && !request.getMedicalExaminationIds().isEmpty()) {
            List<MedicalExamination> medicalExaminations = new ArrayList<>();
            for (String examId : request.getMedicalExaminationIds()) {
                MedicalExamination examination = medicleExaminatioRepository.findById(examId)
                        .orElseThrow(() -> new RuntimeException("Medical examination not found: " + examId));
                medicalExaminations.add(examination);
            }
            msr.setMedicalExamnination(medicalExaminations);
            log.info("Updated with {} medical examinations", medicalExaminations.size());
        }

        MedicalServicesRequest updatedRequest = medicalServicesRequestRepository.save(msr);
        log.info("Medical services request updated successfully: {}", id);

        return toMedicalServicesRequestResponse(updatedRequest);
    }

    // Delete a medical services request
    public void deleteMedicalServicesRequest(String id) {
        log.info("Deleting medical services request: {}", id);

        if (!medicalServicesRequestRepository.existsById(id)) {
            throw new RuntimeException("Medical Services Request not found with id: " + id);
        }

        medicalServicesRequestRepository.deleteById(id);
        log.info("Medical services request deleted successfully: {}", id);
    }

    // Convert MedicalServicesRequest entity to MedicalServicesRequestResponse DTO
    private MedicalServicesRequestResponse toMedicalServicesRequestResponse(MedicalServicesRequest msr) {
        if (msr == null) {
            return null;
        }

        MedicalServicesRequestResponse.MedicalServicesRequestResponseBuilder builder = MedicalServicesRequestResponse.builder()
                .id(msr.getId())
                .status(msr.isStatus());

        // Map patient info
        if (msr.getPatient() != null) {
            User patient = msr.getPatient();
            builder.patient(MedicalServicesRequestResponse.PatientInfo.builder()
                    .id(patient.getId())
                    .name(patient.getUsername())
                    .build());
        }

        // Map doctor info
        if (msr.getDoctor() != null) {
            User doctor = msr.getDoctor();
            builder.doctor(MedicalServicesRequestResponse.DoctorInfo.builder()
                    .id(doctor.getId())
                    .name(doctor.getUsername())
                    .build());
        }

        // Map medical examinations
        if (msr.getMedicalExamnination() != null && !msr.getMedicalExamnination().isEmpty()) {
            List<MedicalServicesRequestResponse.MedicalExaminationInfo> examInfos = msr.getMedicalExamnination()
                    .stream()
                    .map(exam -> MedicalServicesRequestResponse.MedicalExaminationInfo.builder()
                            .id(exam.getId())
                            .name(exam.getName())
                            .price((double) exam.getPrice())
                            .build())
                    .collect(Collectors.toList());
            builder.medicalExaminations(examInfos);
        }

        return builder.build();
    }
}
