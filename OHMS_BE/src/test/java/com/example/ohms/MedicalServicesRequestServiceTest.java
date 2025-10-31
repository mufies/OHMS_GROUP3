package com.example.ohms;

import com.example.ohms.dto.request.MedicalServicesRequestRequest;
import com.example.ohms.dto.response.MedicalServicesRequestResponse;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.MedicalServicesRequest;
import com.example.ohms.entity.User;
import com.example.ohms.enums.MedicalSpecialty;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.MedicalServicesRequestRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.MedicalServicesRequestService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for MedicalServicesRequestService
 * 
 * Test Coverage:
 * 1. createMedicalServicesRequest()
 * 2. getMedicalServicesRequestById()
 * 3. getMedicalServicesRequestsByPatient()
 * 4. getMedicalServicesRequestsByDoctor()
 * 5. updateMedicalServicesRequest()
 * 6. updateMedicalServicesRequestStatus()
 * 7. deleteMedicalServicesRequest()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MedicalServicesRequestService Test Suite")
class MedicalServicesRequestServiceTest {

    @Mock
    private MedicalServicesRequestRepository medicalServicesRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MedicleExaminatioRepository medicleExaminatioRepository;

    @InjectMocks
    private MedicalServicesRequestService medicalServicesRequestService;

    // Test data
    private User doctor;
    private User patient;
    private MedicalExamination examination;
    private MedicalServicesRequest medicalServicesRequest;
    private MedicalServicesRequestRequest request;

    @BeforeEach
    void setUp() {
        // Setup doctor
        doctor = User.builder()
                .id("DOC001")
                .username("Dr. Smith")
                .email("doctor@test.com")
                .build();

        // Setup patient
        patient = User.builder()
                .id("PAT001")
                .username("Patient John")
                .email("patient@test.com")
                .build();

        // Setup medical examination
        examination = new MedicalExamination();
        examination.setId("EXAM001");
        examination.setName("Blood Test");
        examination.setPrice(100000);

        // Setup medical services request
        medicalServicesRequest = MedicalServicesRequest.builder()
                .id("MSR001")
                .doctor(doctor)
                .patient(patient)
                .medicalSpecialty(MedicalSpecialty.CARDIOLOGY)
                .status(false)
                .medicalExamnination(new ArrayList<>(List.of(examination)))
                .build();

        // Setup request DTO
        request = MedicalServicesRequestRequest.builder()
                .doctorId("DOC001")
                .patientId("PAT001")
                .medicalSpecialty(MedicalSpecialty.CARDIOLOGY)
                .medicalExaminationIds(List.of("EXAM001"))
                .build();
    }

    // ==================== 1. CREATE MEDICAL SERVICES REQUEST TESTS ====================

    @Nested
    @DisplayName("1. createMedicalServicesRequest()")
    class CreateMedicalServicesRequestTests {

        @Test
        @DisplayName("Should create medical services request successfully")
        void shouldCreateMedicalServicesRequest_Successfully() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            when(medicleExaminatioRepository.findById("EXAM001")).thenReturn(Optional.of(examination));
            when(medicalServicesRequestRepository.save(any(MedicalServicesRequest.class)))
                    .thenReturn(medicalServicesRequest);

            // When
            MedicalServicesRequestResponse response = medicalServicesRequestService
                    .createMedicalServicesRequest(request);

            // Then
            assertNotNull(response);
            assertEquals("MSR001", response.getId());
            assertEquals(MedicalSpecialty.CARDIOLOGY, response.getMedicalSpecialty());
            verify(medicalServicesRequestRepository).save(any(MedicalServicesRequest.class));
        }

        @Test
        @DisplayName("Should create request without medical examinations")
        void shouldCreateRequest_WithoutExaminations() {
            // Given
            MedicalServicesRequestRequest requestWithoutExam = MedicalServicesRequestRequest.builder()
                    .doctorId("DOC001")
                    .patientId("PAT001")
                    .medicalSpecialty(MedicalSpecialty.CARDIOLOGY)
                    .build();

            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            when(medicalServicesRequestRepository.save(any(MedicalServicesRequest.class)))
                    .thenReturn(medicalServicesRequest);

            // When
            MedicalServicesRequestResponse response = medicalServicesRequestService
                    .createMedicalServicesRequest(requestWithoutExam);

            // Then
            assertNotNull(response);
            verify(medicleExaminatioRepository, never()).findById(anyString());
        }

        @Test
        @DisplayName("Should throw exception when doctor not found")
        void shouldThrowException_WhenDoctorNotFound() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalServicesRequestService.createMedicalServicesRequest(request);
            });

            assertTrue(exception.getMessage().contains("Doctor not found"));
            verify(medicalServicesRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when patient not found")
        void shouldThrowException_WhenPatientNotFound() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalServicesRequestService.createMedicalServicesRequest(request);
            });

            assertTrue(exception.getMessage().contains("Patient not found"));
        }

        @Test
        @DisplayName("Should throw exception when medical examination not found")
        void shouldThrowException_WhenExaminationNotFound() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            when(medicleExaminatioRepository.findById("EXAM001")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalServicesRequestService.createMedicalServicesRequest(request);
            });

            assertTrue(exception.getMessage().contains("Medical examination not found"));
        }
    }

    // ==================== 2. GET MEDICAL SERVICES REQUEST BY ID TESTS ====================

    @Nested
    @DisplayName("2. getMedicalServicesRequestById()")
    class GetMedicalServicesRequestByIdTests {

        @Test
        @DisplayName("Should get medical services request by ID successfully")
        void shouldGetMedicalServicesRequest_ById() {
            // Given
            when(medicalServicesRequestRepository.findById("MSR001"))
                    .thenReturn(Optional.of(medicalServicesRequest));

            // When
            MedicalServicesRequestResponse response = medicalServicesRequestService
                    .getMedicalServicesRequestById("MSR001");

            // Then
            assertNotNull(response);
            assertEquals("MSR001", response.getId());
        }

        @Test
        @DisplayName("Should throw exception when request not found")
        void shouldThrowException_WhenRequestNotFound() {
            // Given
            when(medicalServicesRequestRepository.findById("INVALID_ID"))
                    .thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalServicesRequestService.getMedicalServicesRequestById("INVALID_ID");
            });

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    // ==================== 3. GET REQUESTS BY PATIENT TESTS ====================

    @Nested
    @DisplayName("3. getMedicalServicesRequestsByPatient()")
    class GetRequestsByPatientTests {

        @Test
        @DisplayName("Should get all requests for patient")
        void shouldGetAllRequests_ForPatient() {
            // Given
            when(medicalServicesRequestRepository.findByPatientId("PAT001"))
                    .thenReturn(List.of(medicalServicesRequest));

            // When
            List<MedicalServicesRequestResponse> responses = medicalServicesRequestService
                    .getMedicalServicesRequestsByPatient("PAT001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("MSR001", responses.get(0).getId());
        }

        @Test
        @DisplayName("Should return empty list when patient has no requests")
        void shouldReturnEmptyList_WhenPatientHasNoRequests() {
            // Given
            when(medicalServicesRequestRepository.findByPatientId("PAT001"))
                    .thenReturn(List.of());

            // When
            List<MedicalServicesRequestResponse> responses = medicalServicesRequestService
                    .getMedicalServicesRequestsByPatient("PAT001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 4. GET REQUESTS BY DOCTOR TESTS ====================

    @Nested
    @DisplayName("4. getMedicalServicesRequestsByDoctor()")
    class GetRequestsByDoctorTests {

        @Test
        @DisplayName("Should get all requests for doctor")
        void shouldGetAllRequests_ForDoctor() {
            // Given
            when(medicalServicesRequestRepository.findByDoctorId("DOC001"))
                    .thenReturn(List.of(medicalServicesRequest));

            // When
            List<MedicalServicesRequestResponse> responses = medicalServicesRequestService
                    .getMedicalServicesRequestsByDoctor("DOC001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
        }

        @Test
        @DisplayName("Should return empty list when doctor has no requests")
        void shouldReturnEmptyList_WhenDoctorHasNoRequests() {
            // Given
            when(medicalServicesRequestRepository.findByDoctorId("DOC001"))
                    .thenReturn(List.of());

            // When
            List<MedicalServicesRequestResponse> responses = medicalServicesRequestService
                    .getMedicalServicesRequestsByDoctor("DOC001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 5. UPDATE MEDICAL SERVICES REQUEST TESTS ====================

    @Nested
    @DisplayName("5. updateMedicalServicesRequest()")
    class UpdateMedicalServicesRequestTests {

        @Test
        @DisplayName("Should update medical services request successfully")
        void shouldUpdateRequest_Successfully() {
            // Given
            MedicalServicesRequestRequest updateRequest = MedicalServicesRequestRequest.builder()
                    .medicalSpecialty(MedicalSpecialty.NEUROLOGY)
                    .medicalExaminationIds(List.of("EXAM001"))
                    .build();

            when(medicalServicesRequestRepository.findById("MSR001"))
                    .thenReturn(Optional.of(medicalServicesRequest));
            when(medicleExaminatioRepository.findById("EXAM001"))
                    .thenReturn(Optional.of(examination));
            when(medicalServicesRequestRepository.save(any(MedicalServicesRequest.class)))
                    .thenReturn(medicalServicesRequest);

            // When
            MedicalServicesRequestResponse response = medicalServicesRequestService
                    .updateMedicalServicesRequest("MSR001", updateRequest);

            // Then
            assertNotNull(response);
            verify(medicalServicesRequestRepository).save(any(MedicalServicesRequest.class));
        }

        @Test
        @DisplayName("Should throw exception when request not found for update")
        void shouldThrowException_WhenRequestNotFoundForUpdate() {
            // Given
            when(medicalServicesRequestRepository.findById("INVALID_ID"))
                    .thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalServicesRequestService.updateMedicalServicesRequest("INVALID_ID", request);
            });

            assertTrue(exception.getMessage().contains("not found"));
        }
    }

    // ==================== 6. UPDATE STATUS TESTS ====================

    @Nested
    @DisplayName("6. updateMedicalServicesRequestStatus()")
    class UpdateStatusTests {

        @Test
        @DisplayName("Should update status to true")
        void shouldUpdateStatus_ToTrue() {
            // Given
            when(medicalServicesRequestRepository.findById("MSR001"))
                    .thenReturn(Optional.of(medicalServicesRequest));
            when(medicalServicesRequestRepository.save(any(MedicalServicesRequest.class)))
                    .thenReturn(medicalServicesRequest);

            // When
            MedicalServicesRequestResponse response = medicalServicesRequestService
                    .updateMedicalServicesRequestStatus("MSR001", true);

            // Then
            assertNotNull(response);
            verify(medicalServicesRequestRepository).save(any(MedicalServicesRequest.class));
        }

        @Test
        @DisplayName("Should update status to false")
        void shouldUpdateStatus_ToFalse() {
            // Given
            when(medicalServicesRequestRepository.findById("MSR001"))
                    .thenReturn(Optional.of(medicalServicesRequest));
            when(medicalServicesRequestRepository.save(any(MedicalServicesRequest.class)))
                    .thenReturn(medicalServicesRequest);

            // When
            MedicalServicesRequestResponse response = medicalServicesRequestService
                    .updateMedicalServicesRequestStatus("MSR001", false);

            // Then
            assertNotNull(response);
            verify(medicalServicesRequestRepository).save(any(MedicalServicesRequest.class));
        }
    }

    // ==================== 7. DELETE MEDICAL SERVICES REQUEST TESTS ====================

    @Nested
    @DisplayName("7. deleteMedicalServicesRequest()")
    class DeleteMedicalServicesRequestTests {

        @Test
        @DisplayName("Should delete medical services request successfully")
        void shouldDeleteRequest_Successfully() {
            // Given
            when(medicalServicesRequestRepository.existsById("MSR001")).thenReturn(true);
            doNothing().when(medicalServicesRequestRepository).deleteById("MSR001");

            // When
            medicalServicesRequestService.deleteMedicalServicesRequest("MSR001");

            // Then
            verify(medicalServicesRequestRepository).deleteById("MSR001");
        }

        @Test
        @DisplayName("Should throw exception when request not found for delete")
        void shouldThrowException_WhenRequestNotFoundForDelete() {
            // Given
            when(medicalServicesRequestRepository.existsById("INVALID_ID")).thenReturn(false);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalServicesRequestService.deleteMedicalServicesRequest("INVALID_ID");
            });

            assertTrue(exception.getMessage().contains("not found"));
        }
    }
}
