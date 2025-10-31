package com.example.ohms;

import com.example.ohms.dto.request.MedicalRecordRequest;
import com.example.ohms.dto.response.MedicalRecordResponse;
import com.example.ohms.entity.Appointment;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.MedicalRecord;
import com.example.ohms.entity.Prescription;
import com.example.ohms.entity.User;
import com.example.ohms.mapper.MedicalRecordMapper;
import com.example.ohms.repository.AppointmentRepository;
import com.example.ohms.repository.MedicalRecordRepository;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.PrescriptionRepository;
import com.example.ohms.service.MedicalRecordService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for MedicalRecordService
 * 
 * Test Coverage:
 * 1. createMedicalRecord()
 * 2. getMedicalRecordById()
 * 3. getMedicalRecordsByPatient()
 * 4. getMedicalRecordsByDoctor()
 * 5. updateMedicalRecord()
 * 6. deleteMedicalRecord()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MedicalRecordService Test Suite")
class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private MedicleExaminatioRepository medicleExaminatioRepository;

    @Mock
    private MedicalRecordMapper medicalRecordMapper;

    @InjectMocks
    private MedicalRecordService medicalRecordService;

    // Test data
    private User patient;
    private User doctor;
    private Appointment appointment;
    private MedicalRecord medicalRecord;
    private MedicalRecordRequest medicalRecordRequest;
    private MedicalRecordResponse medicalRecordResponse;
    private Prescription prescription;
    private MedicalExamination examination;

    @BeforeEach
    void setUp() {
        // Setup patient
        patient = User.builder()
                .id("P001")
                .username("John Doe")
                .email("patient@test.com")
                .build();

        // Setup doctor
        doctor = User.builder()
                .id("D001")
                .username("Dr. Smith")
                .email("doctor@test.com")
                .build();

        // Setup appointment
        appointment = Appointment.builder()
                .id("A001")
                .patient(patient)
                .doctor(doctor)
                .workDate(LocalDate.now())
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status("Completed")
                .build();

        // Setup prescription
        prescription = Prescription.builder()
                .id("PR001")
                .doctor(doctor)
                .patient(patient)
                .build();

        // Setup medical examination
        examination = MedicalExamination.builder()
                .id("E001")
                .name("Blood Test")
                .price(200000)
                .build();

        // Setup medical record
        medicalRecord = MedicalRecord.builder()
                .id("MR001")
                .appointment(appointment)
                .patient(patient)
                .doctor(doctor)
                .symptoms("Fever, headache")
                .diagnosis("Common cold")
                .prescription(prescription)
                .medicalExamination(Set.of(examination))
                .build();

        // Setup medical record request
        medicalRecordRequest = MedicalRecordRequest.builder()
                .appointmentId("A001")
                .symptoms("Fever, headache")
                .diagnosis("Common cold")
                .prescriptionId("PR001")
                .medicalExaminationIds(List.of("E001"))
                .build();

        // Setup medical record response
        medicalRecordResponse = MedicalRecordResponse.builder()
                .id("MR001")
                .appointmentId("A001")
                .patientId("P001")
                .patientName("John Doe")
                .doctorId("D001")
                .doctorName("Dr. Smith")
                .symptoms("Fever, headache")
                .diagnosis("Common cold")
                .build();
    }

    // ==================== 1. CREATE MEDICAL RECORD TESTS ====================

    @Nested
    @DisplayName("1. createMedicalRecord()")
    class CreateMedicalRecordTests {

        @Test
        @DisplayName("Should create medical record successfully")
        void shouldCreateMedicalRecord_WhenDataIsValid() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicalRecordRepository.findByAppointmentId("A001")).thenReturn(null);
            when(prescriptionRepository.findById("PR001")).thenReturn(Optional.of(prescription));
            when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
            when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(medicalRecord);
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            MedicalRecordResponse response = medicalRecordService.createMedicalRecord(medicalRecordRequest);

            // Then
            assertNotNull(response);
            assertEquals("MR001", response.getId());
            assertEquals("A001", response.getAppointmentId());
            verify(medicalRecordRepository).save(any(MedicalRecord.class));
        }

        @Test
        @DisplayName("Should create medical record without prescription")
        void shouldCreateMedicalRecord_WithoutPrescription() {
            // Given
            MedicalRecordRequest requestWithoutPrescription = MedicalRecordRequest.builder()
                    .appointmentId("A001")
                    .symptoms("Fever")
                    .diagnosis("Flu")
                    .prescriptionId(null)
                    .medicalExaminationIds(List.of("E001"))
                    .build();

            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicalRecordRepository.findByAppointmentId("A001")).thenReturn(null);
            when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
            when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(medicalRecord);
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            MedicalRecordResponse response = medicalRecordService.createMedicalRecord(requestWithoutPrescription);

            // Then
            assertNotNull(response);
            verify(prescriptionRepository, never()).findById(anyString());
        }

        @Test
        @DisplayName("Should create medical record without medical examinations")
        void shouldCreateMedicalRecord_WithoutExaminations() {
            // Given
            MedicalRecordRequest requestWithoutExams = MedicalRecordRequest.builder()
                    .appointmentId("A001")
                    .symptoms("Fever")
                    .diagnosis("Flu")
                    .prescriptionId("PR001")
                    .medicalExaminationIds(null)
                    .build();

            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicalRecordRepository.findByAppointmentId("A001")).thenReturn(null);
            when(prescriptionRepository.findById("PR001")).thenReturn(Optional.of(prescription));
            when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(medicalRecord);
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            MedicalRecordResponse response = medicalRecordService.createMedicalRecord(requestWithoutExams);

            // Then
            assertNotNull(response);
            verify(medicleExaminatioRepository, never()).findById(anyString());
        }

        @Test
        @DisplayName("Should throw exception when appointment not found")
        void shouldThrowException_WhenAppointmentNotFound() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalRecordService.createMedicalRecord(medicalRecordRequest);
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
            verify(medicalRecordRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when medical record already exists")
        void shouldThrowException_WhenMedicalRecordAlreadyExists() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicalRecordRepository.findByAppointmentId("A001")).thenReturn(medicalRecord);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalRecordService.createMedicalRecord(medicalRecordRequest);
            });

            assertTrue(exception.getMessage().contains("already exists"));
            verify(medicalRecordRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when prescription not found")
        void shouldThrowException_WhenPrescriptionNotFound() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicalRecordRepository.findByAppointmentId("A001")).thenReturn(null);
            when(prescriptionRepository.findById("PR001")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalRecordService.createMedicalRecord(medicalRecordRequest);
            });

            assertTrue(exception.getMessage().contains("Prescription not found"));
        }

        @Test
        @DisplayName("Should throw exception when medical examination not found")
        void shouldThrowException_WhenExaminationNotFound() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicalRecordRepository.findByAppointmentId("A001")).thenReturn(null);
            when(prescriptionRepository.findById("PR001")).thenReturn(Optional.of(prescription));
            when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalRecordService.createMedicalRecord(medicalRecordRequest);
            });

            assertTrue(exception.getMessage().contains("Medical examination not found"));
        }
    }

    // ==================== 2. GET MEDICAL RECORD BY ID TESTS ====================

    @Nested
    @DisplayName("2. getMedicalRecordById()")
    class GetMedicalRecordByIdTests {

        @Test
        @DisplayName("Should get medical record by ID successfully")
        void shouldGetMedicalRecord_WhenIdExists() {
            // Given
            when(medicalRecordRepository.findByIdWithDetails("MR001")).thenReturn(medicalRecord);
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            MedicalRecordResponse response = medicalRecordService.getMedicalRecordById("MR001");

            // Then
            assertNotNull(response);
            assertEquals("MR001", response.getId());
            verify(medicalRecordRepository).findByIdWithDetails("MR001");
        }

        @Test
        @DisplayName("Should throw exception when medical record not found")
        void shouldThrowException_WhenMedicalRecordNotFound() {
            // Given
            when(medicalRecordRepository.findByIdWithDetails("INVALID_ID")).thenReturn(null);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                medicalRecordService.getMedicalRecordById("INVALID_ID");
            });

            assertTrue(exception.getMessage().contains("Medical record not found"));
        }
    }

    // ==================== 3. GET MEDICAL RECORDS BY PATIENT TESTS ====================

    @Nested
    @DisplayName("3. getMedicalRecordsByPatient()")
    class GetMedicalRecordsByPatientTests {

        @Test
        @DisplayName("Should get medical records by patient ID")
        void shouldGetMedicalRecords_ByPatientId() {
            // Given
            when(medicalRecordRepository.findByPatientId("P001")).thenReturn(List.of(medicalRecord));
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            List<MedicalRecordResponse> responses = medicalRecordService.getMedicalRecordsByPatient("P001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("P001", responses.get(0).getPatientId());
        }

        @Test
        @DisplayName("Should return empty list when patient has no records")
        void shouldReturnEmptyList_WhenPatientHasNoRecords() {
            // Given
            when(medicalRecordRepository.findByPatientId("P001")).thenReturn(List.of());

            // When
            List<MedicalRecordResponse> responses = medicalRecordService.getMedicalRecordsByPatient("P001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 4. GET MEDICAL RECORDS BY DOCTOR TESTS ====================

    @Nested
    @DisplayName("4. getMedicalRecordsByDoctor()")
    class GetMedicalRecordsByDoctorTests {

        @Test
        @DisplayName("Should get medical records by doctor ID")
        void shouldGetMedicalRecords_ByDoctorId() {
            // Given
            when(medicalRecordRepository.findByDoctorId("D001")).thenReturn(List.of(medicalRecord));
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            List<MedicalRecordResponse> responses = medicalRecordService.getMedicalRecordsByDoctor("D001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("D001", responses.get(0).getDoctorId());
        }
    }

    // ==================== 5. UPDATE MEDICAL RECORD TESTS ====================

    @Nested
    @DisplayName("5. updateMedicalRecord()")
    class UpdateMedicalRecordTests {

        @Test
        @DisplayName("Should update medical record successfully")
        void shouldUpdateMedicalRecord_Successfully() {
            // Given
            when(medicalRecordRepository.findById("MR001")).thenReturn(Optional.of(medicalRecord));
            // Ensure prescription is available during update
            when(prescriptionRepository.findById("PR001")).thenReturn(Optional.of(prescription));
            // Ensure medical examination is available during update
            when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
            when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(medicalRecord);
            when(medicalRecordMapper.toResponse(medicalRecord)).thenReturn(medicalRecordResponse);

            // When
            MedicalRecordResponse response = medicalRecordService.updateMedicalRecord("MR001", medicalRecordRequest);

            // Then
            assertNotNull(response);
            verify(medicalRecordRepository).save(any(MedicalRecord.class));
        }

        @Test
        @DisplayName("Should throw exception when medical record not found for update")
        void shouldThrowException_WhenMedicalRecordNotFoundForUpdate() {
            // Given
            when(medicalRecordRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            assertThrows(RuntimeException.class, () -> {
                medicalRecordService.updateMedicalRecord("INVALID_ID", medicalRecordRequest);
            });
        }
    }

    // ==================== 6. DELETE MEDICAL RECORD TESTS ====================

    @Nested
    @DisplayName("6. deleteMedicalRecord()")
    class DeleteMedicalRecordTests {

        @Test
        @DisplayName("Should delete medical record successfully")
        void shouldDeleteMedicalRecord_Successfully() {
            // Given
            when(medicalRecordRepository.existsById("MR001")).thenReturn(true);
            doNothing().when(medicalRecordRepository).deleteById("MR001");

            // When
            medicalRecordService.deleteMedicalRecord("MR001");

            // Then
            verify(medicalRecordRepository).deleteById("MR001");
        }

        @Test
        @DisplayName("Should throw exception when medical record not found for delete")
        void shouldThrowException_WhenMedicalRecordNotFoundForDelete() {
            // Given
            when(medicalRecordRepository.existsById("INVALID_ID")).thenReturn(false);

            // When & Then
            assertThrows(RuntimeException.class, () -> {
                medicalRecordService.deleteMedicalRecord("INVALID_ID");
            });
        }
    }
}
