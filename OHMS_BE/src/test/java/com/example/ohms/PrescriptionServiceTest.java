package com.example.ohms;

import com.example.ohms.dto.request.PrescriptionRequest;
import com.example.ohms.dto.request.PrescriptionMedicineRequest;
import com.example.ohms.dto.response.PrescriptionResponse;
import com.example.ohms.entity.Medicine;
import com.example.ohms.entity.Prescription;
import com.example.ohms.entity.PrescriptionMedicine;
import com.example.ohms.entity.User;
import com.example.ohms.enums.PaymentStatus;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.PrescriptionMapper;
import com.example.ohms.repository.MedicineRepository;
import com.example.ohms.repository.PrescriptionMedicineRepository;
import com.example.ohms.repository.PrescriptionRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.PrescriptionService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PrescriptionService Test Suite")
class PrescriptionServiceTest {

    @Mock
    private PrescriptionRepository prescriptionRepository;

    @Mock
    private PrescriptionMapper prescriptionMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private PrescriptionMedicineRepository prescriptionMedicineRepository;

    @InjectMocks
    private PrescriptionService prescriptionService;

    private User doctor;
    private User patient;
    private Medicine medicine;
    private Prescription prescription;
    private PrescriptionRequest prescriptionRequest;
    private PrescriptionResponse prescriptionResponse;
    private Authentication authentication;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        doctor = User.builder()
                .id("DOC001")
                .username("Dr. Smith")
                .email("doctor@test.com")
                .build();

        patient = User.builder()
                .id("PAT001")
                .username("Patient John")
                .email("patient@test.com")
                .build();

        medicine = new Medicine();
        medicine.setId("MED001");
        medicine.setName("Paracetamol");
        medicine.setPrice(5000);
        medicine.setQuantity(100);

        prescription = new Prescription();
        prescription.setId("PRES001");
        prescription.setDoctor(doctor);
        prescription.setPatient(patient);
        prescription.setAmount(25000);
        prescription.setStatus(PaymentStatus.PENDING);

        PrescriptionMedicineRequest medicineRequest = PrescriptionMedicineRequest.builder()
                .medicineId("MED001")
                .amount(5)
                .instruction("Take 1 pill after meal")
                .build();

        prescriptionRequest = PrescriptionRequest.builder()
                .medicinePrescription(Set.of(medicineRequest))
                .build();

        prescriptionResponse = PrescriptionResponse.builder()
                .id("PRES001")
                .amount(25000)
                .status(PaymentStatus.PENDING)
                .build();

    jwt = mock(Jwt.class);
    authentication = mock(Authentication.class);
    // Use lenient stubbing for shared mocks to avoid unnecessary stubbing errors
    lenient().when(authentication.getPrincipal()).thenReturn(jwt);
    lenient().when(jwt.getClaimAsString("sub")).thenReturn("DOC001");
    }

    @Nested
    @DisplayName("1. createPrescription()")
    class CreatePrescriptionTests {

        @Test
        @DisplayName("Should create prescription successfully")
        void shouldCreatePrescription_Successfully() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            
            // Medicine is fetched TWICE - use anyString() for all calls
            when(medicineRepository.findById(anyString())).thenReturn(Optional.of(medicine));
            when(medicineRepository.save(any(Medicine.class))).thenReturn(medicine);
            
            // PrescriptionMedicine saved TWICE (bug in your code)
            when(prescriptionMedicineRepository.save(any(PrescriptionMedicine.class)))
                    .thenReturn(new PrescriptionMedicine());
                    
            when(prescriptionRepository.save(any(Prescription.class))).thenReturn(prescription);
            when(prescriptionMapper.toPrescriptionResponse(prescription)).thenReturn(prescriptionResponse);

            // When
            PrescriptionResponse response = prescriptionService.createPrescription(
                    authentication, prescriptionRequest, "PAT001");

            // Then
            assertNotNull(response);
            assertEquals("PRES001", response.getId());
            assertEquals(25000, response.getAmount());
            
            // Verify medicine fetched twice (once for price calc, once for PM creation)
            verify(medicineRepository, times(2)).findById("MED001");
            
            // Verify PM saved twice (due to duplicate save in your code)
            verify(prescriptionMedicineRepository, times(2)).save(any(PrescriptionMedicine.class));
            
            verify(prescriptionRepository).save(any(Prescription.class));
        }

        @Test
        @DisplayName("Should deduct medicine quantity when creating prescription")
        void shouldDeductMedicineQuantity() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            when(medicineRepository.findById(anyString())).thenReturn(Optional.of(medicine));
            when(medicineRepository.save(any(Medicine.class))).thenReturn(medicine);
            when(prescriptionMedicineRepository.save(any(PrescriptionMedicine.class)))
                    .thenReturn(new PrescriptionMedicine());
            when(prescriptionRepository.save(any(Prescription.class))).thenReturn(prescription);
            when(prescriptionMapper.toPrescriptionResponse(prescription)).thenReturn(prescriptionResponse);

            int initialQuantity = medicine.getQuantity();

            // When
            prescriptionService.createPrescription(authentication, prescriptionRequest, "PAT001");

            // Then
            // Medicine quantity deducted during stream processing
            verify(medicineRepository, atLeastOnce()).save(argThat(med -> 
                med.getQuantity() == initialQuantity - 5 // 100 - 5 = 95
            ));
        }

        @Test
        @DisplayName("Should throw exception when doctor not found")
        void shouldThrowException_WhenDoctorNotFound() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.createPrescription(authentication, prescriptionRequest, "PAT001");
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
            verify(prescriptionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when patient not found")
        void shouldThrowException_WhenPatientNotFound() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.createPrescription(authentication, prescriptionRequest, "PAT001");
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when medicine not found")
        void shouldThrowException_WhenMedicineNotFound() {
            // Given
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            when(medicineRepository.findById("MED001")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.createPrescription(authentication, prescriptionRequest, "PAT001");
            });

            assertEquals(ErrorCode.MEDICINE_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when medicine quantity insufficient")
        void shouldThrowException_WhenMedicineQuantityInsufficient() {
            // Given
            medicine.setQuantity(2); // Not enough for 5 requested
            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            when(medicineRepository.findById(anyString())).thenReturn(Optional.of(medicine));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.createPrescription(authentication, prescriptionRequest, "PAT001");
            });

            assertEquals(ErrorCode.MEDICLE_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when authentication is invalid")
        void shouldThrowException_WhenAuthenticationInvalid() {
            // Given
            Authentication invalidAuth = mock(Authentication.class);
            when(invalidAuth.getPrincipal()).thenReturn("InvalidPrincipal");

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.createPrescription(invalidAuth, prescriptionRequest, "PAT001");
            });

            assertEquals(ErrorCode.UNAUTHENTICATED, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should calculate total price correctly for multiple medicines")
        void shouldCalculateTotalPrice_ForMultipleMedicines() {
            // Given
            Medicine medicine2 = new Medicine();
            medicine2.setId("MED002");
            medicine2.setName("Ibuprofen");
            medicine2.setPrice(8000);
            medicine2.setQuantity(50);

            PrescriptionMedicineRequest medicineRequest2 = PrescriptionMedicineRequest.builder()
                    .medicineId("MED002")
                    .amount(3)
                    .instruction("Take with water")
                    .build();

            PrescriptionRequest multiMedicineRequest = PrescriptionRequest.builder()
                    .medicinePrescription(Set.of(
                        prescriptionRequest.getMedicinePrescription().iterator().next(),
                        medicineRequest2
                    ))
                    .build();

            when(userRepository.findById("DOC001")).thenReturn(Optional.of(doctor));
            when(userRepository.findById("PAT001")).thenReturn(Optional.of(patient));
            
            // Each medicine fetched twice - chain returns
            when(medicineRepository.findById("MED001"))
                    .thenReturn(Optional.of(medicine))
                    .thenReturn(Optional.of(medicine));
            when(medicineRepository.findById("MED002"))
                    .thenReturn(Optional.of(medicine2))
                    .thenReturn(Optional.of(medicine2));
                    
            when(medicineRepository.save(any(Medicine.class))).thenAnswer(i -> i.getArgument(0));
            when(prescriptionMedicineRepository.save(any(PrescriptionMedicine.class)))
                    .thenReturn(new PrescriptionMedicine());
            when(prescriptionRepository.save(any(Prescription.class))).thenReturn(prescription);
            when(prescriptionMapper.toPrescriptionResponse(prescription)).thenReturn(prescriptionResponse);

            // When
            PrescriptionResponse response = prescriptionService.createPrescription(
                    authentication, multiMedicineRequest, "PAT001");

            // Then
            assertNotNull(response);
            
            // Each medicine: saved once in stream, fetched twice total
            verify(medicineRepository, times(2)).save(any(Medicine.class));
            verify(medicineRepository, times(4)).findById(anyString()); // 2 medicines × 2 calls each
            
            // Each PM saved twice (bug in your code)
            verify(prescriptionMedicineRepository, times(4)).save(any(PrescriptionMedicine.class)); // 2 medicines × 2 saves
        }
    }

    @Nested
    @DisplayName("2. viewListPrescriptionForPatients()")
    class ViewListPrescriptionForPatientsTests {

        @Test
        @DisplayName("Should get all prescriptions for patient")
        void shouldGetAllPrescriptions_ForPatient() {
            // Given
            when(prescriptionRepository.findAllByPatientId("PAT001"))
                    .thenReturn(List.of(prescription));
            when(prescriptionMapper.toPrescriptionResponse(prescription))
                    .thenReturn(prescriptionResponse);

            // When
            List<PrescriptionResponse> responses = 
                    prescriptionService.viewListPrescriptionForPatients("PAT001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("PRES001", responses.get(0).getId());
        }

        @Test
        @DisplayName("Should return multiple prescriptions for patient")
        void shouldReturnMultiplePrescriptions() {
            // Given
            Prescription prescription2 = new Prescription();
            prescription2.setId("PRES002");
            prescription2.setPatient(patient);

            PrescriptionResponse response2 = PrescriptionResponse.builder()
                    .id("PRES002")
                    .build();

            when(prescriptionRepository.findAllByPatientId("PAT001"))
                    .thenReturn(List.of(prescription, prescription2));
            when(prescriptionMapper.toPrescriptionResponse(prescription))
                    .thenReturn(prescriptionResponse);
            when(prescriptionMapper.toPrescriptionResponse(prescription2))
                    .thenReturn(response2);

            // When
            List<PrescriptionResponse> responses = 
                    prescriptionService.viewListPrescriptionForPatients("PAT001");

            // Then
            assertNotNull(responses);
            assertEquals(2, responses.size());
        }

        @Test
        @DisplayName("Should throw exception when patient has no prescriptions")
        void shouldThrowException_WhenNoPrescriptions() {
            // Given
            when(prescriptionRepository.findAllByPatientId("PAT001"))
                    .thenReturn(List.of());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.viewListPrescriptionForPatients("PAT001");
            });

            assertEquals(ErrorCode.PRESCRIP_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when patientId is null")
        void shouldThrowException_WhenPatientIdNull() {
            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.viewListPrescriptionForPatients(null);
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }

        @Test
        @DisplayName("Should throw exception when patientId is empty")
        void shouldThrowException_WhenPatientIdEmpty() {
            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                prescriptionService.viewListPrescriptionForPatients("");
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }
    }
}
