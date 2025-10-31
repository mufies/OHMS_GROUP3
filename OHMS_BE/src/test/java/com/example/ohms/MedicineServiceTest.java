package com.example.ohms;

import com.example.ohms.dto.request.MedicineRequest;
import com.example.ohms.dto.response.MedicineResponse;
import com.example.ohms.entity.Medicine;
import com.example.ohms.enums.MedicineType;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.MedicineMapper;
import com.example.ohms.repository.MedicineRepository;
import com.example.ohms.service.MedicineService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for MedicineService
 * 
 * Test Coverage:
 * 1. createMedicine()
 * 2. updateMedicine()
 * 3. getDetailMedicine()
 * 4. getAllMedicine()
 * 5. deleteMedicine()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MedicineService Test Suite")
class MedicineServiceTest {

    @Mock
    private MedicineMapper medicleMapper;

    @Mock
    private MedicineRepository medicineRepository;

    @InjectMocks
    private MedicineService medicineService;

    // Test data
    private Medicine medicine;
    private MedicineRequest medicineRequest;
    private MedicineResponse medicineResponse;

    @BeforeEach
    void setUp() {
        // Setup medicine
        medicine = new Medicine();
        medicine.setId("MED001");
        medicine.setName("Paracetamol");
        medicine.setPrice(5000);
        medicine.setQuantity(100);
        medicine.setType(MedicineType.TABLET);

        // Setup medicine request
        medicineRequest = MedicineRequest.builder()
                .name("Paracetamol")
                .price(5000)
                .quantity(100)
                .type(MedicineType.TABLET)
                .build();

        // Setup medicine response
        medicineResponse = MedicineResponse.builder()
                .id("MED001")
                .name("Paracetamol")
                .quantity(100)
                .type(MedicineType.TABLET)
                .build();
    }

    // ==================== 1. CREATE MEDICINE TESTS ====================

    @Nested
    @DisplayName("1. createMedicine()")
    class CreateMedicineTests {

        @Test
        @DisplayName("Should create medicine successfully")
        void shouldCreateMedicine_Successfully() {
            // Given
            when(medicleMapper.toMedicine(medicineRequest)).thenReturn(medicine);
            when(medicineRepository.findByName("Paracetamol")).thenReturn(Optional.empty());
            when(medicineRepository.save(any(Medicine.class))).thenReturn(medicine);
            when(medicleMapper.toMedicineResponse(medicine)).thenReturn(medicineResponse);

            // When
            MedicineResponse response = medicineService.createMedicine(medicineRequest);

            // Then
            assertNotNull(response);
            assertEquals("MED001", response.getId());
            assertEquals("Paracetamol", response.getName());
            verify(medicineRepository).save(any(Medicine.class));
        }

        @Test
        @DisplayName("Should throw exception when medicine already exists")
        void shouldThrowException_WhenMedicineExists() {
            // Given
            when(medicleMapper.toMedicine(medicineRequest)).thenReturn(medicine);
            when(medicineRepository.findByName("Paracetamol")).thenReturn(Optional.of(medicine));

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                medicineService.createMedicine(medicineRequest);
            });

            assertEquals(ErrorCode.MEDICINE_EXITEDS, exception.getErrorCode());
            verify(medicineRepository, never()).save(any());
        }
    }

    // ==================== 2. UPDATE MEDICINE TESTS ====================

    @Nested
    @DisplayName("2. updateMedicine()")
    class UpdateMedicineTests {

        @Test
        @DisplayName("Should update all medicine fields")
        void shouldUpdateAllFields_Successfully() {
            // Given
            MedicineRequest updateRequest = MedicineRequest.builder()
                    .name("Paracetamol Updated")
                    .price(6000)
                    .quantity(150)
                    .type(MedicineType.SYRUP)
                    .build();

            when(medicineRepository.findById("MED001")).thenReturn(Optional.of(medicine));
            when(medicineRepository.save(any(Medicine.class))).thenReturn(medicine);
            when(medicleMapper.toMedicineResponse(medicine)).thenReturn(medicineResponse);

            // When
            MedicineResponse response = medicineService.updateMedicine(updateRequest, "MED001");

            // Then
            assertNotNull(response);
            verify(medicineRepository).save(any(Medicine.class));
        }

        @Test
        @DisplayName("Should update only name field")
        void shouldUpdateOnlyName() {
            // Given
            MedicineRequest updateRequest = MedicineRequest.builder()
                    .name("New Name")
                    .price(0)
                    .quantity(0)
                    .build();

            when(medicineRepository.findById("MED001")).thenReturn(Optional.of(medicine));
            when(medicineRepository.save(any(Medicine.class))).thenReturn(medicine);
            when(medicleMapper.toMedicineResponse(medicine)).thenReturn(medicineResponse);

            // When
            medicineService.updateMedicine(updateRequest, "MED001");

            // Then
            verify(medicineRepository).save(argThat(med -> 
                "New Name".equals(med.getName())
            ));
        }

        @Test
        @DisplayName("Should update only price field")
        void shouldUpdateOnlyPrice() {
            // Given
            MedicineRequest updateRequest = MedicineRequest.builder()
                    .price(7000)
                    .quantity(0)
                    .build();

            when(medicineRepository.findById("MED001")).thenReturn(Optional.of(medicine));
            when(medicineRepository.save(any(Medicine.class))).thenReturn(medicine);
            when(medicleMapper.toMedicineResponse(medicine)).thenReturn(medicineResponse);

            // When
            medicineService.updateMedicine(updateRequest, "MED001");

            // Then
            verify(medicineRepository).save(argThat(med -> 
                med.getPrice() == 7000
            ));
        }

        @Test
        @DisplayName("Should throw exception when medicine not found for update")
        void shouldThrowException_WhenMedicineNotFoundForUpdate() {
            // Given
            when(medicineRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                medicineService.updateMedicine(medicineRequest, "INVALID_ID");
            });

            assertEquals(ErrorCode.MEDICINE_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 3. GET DETAIL MEDICINE TESTS ====================

    @Nested
    @DisplayName("3. getDetailMedicine()")
    class GetDetailMedicineTests {

        @Test
        @DisplayName("Should get medicine detail successfully")
        void shouldGetMedicineDetail_Successfully() {
            // Given
            when(medicineRepository.findById("MED001")).thenReturn(Optional.of(medicine));
            when(medicleMapper.toMedicineResponse(medicine)).thenReturn(medicineResponse);

            // When
            MedicineResponse response = medicineService.getDetailMedicine("MED001");

            // Then
            assertNotNull(response);
            assertEquals("MED001", response.getId());
            assertEquals("Paracetamol", response.getName());
        }

        @Test
        @DisplayName("Should throw exception when medicine not found")
        void shouldThrowException_WhenMedicineNotFound() {
            // Given
            when(medicineRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                medicineService.getDetailMedicine("INVALID_ID");
            });

            assertEquals(ErrorCode.MEDICINE_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 4. GET ALL MEDICINE TESTS ====================

    @Nested
    @DisplayName("4. getAllMedicine()")
    class GetAllMedicineTests {

        @Test
        @DisplayName("Should get all medicines successfully")
        void shouldGetAllMedicines_Successfully() {
            // Given
            Medicine medicine2 = new Medicine();
            medicine2.setId("MED002");
            medicine2.setName("Ibuprofen");

            MedicineResponse response2 = MedicineResponse.builder()
                    .id("MED002")
                    .name("Ibuprofen")
                    .build();

            when(medicineRepository.findAll()).thenReturn(List.of(medicine, medicine2));
            when(medicleMapper.toMedicineResponse(medicine)).thenReturn(medicineResponse);
            when(medicleMapper.toMedicineResponse(medicine2)).thenReturn(response2);

            // When
            List<MedicineResponse> responses = medicineService.getAllMedicine();

            // Then
            assertNotNull(responses);
            assertEquals(2, responses.size());
            assertEquals("MED001", responses.get(0).getId());
            assertEquals("MED002", responses.get(1).getId());
        }

        @Test
        @DisplayName("Should return empty list when no medicines")
        void shouldReturnEmptyList_WhenNoMedicines() {
            // Given
            when(medicineRepository.findAll()).thenReturn(List.of());

            // When
            List<MedicineResponse> responses = medicineService.getAllMedicine();

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 5. DELETE MEDICINE TESTS ====================

    @Nested
    @DisplayName("5. deleteMedicine()")
    class DeleteMedicineTests {

        @Test
        @DisplayName("Should delete medicine successfully")
        void shouldDeleteMedicine_Successfully() {
            // Given
            doNothing().when(medicineRepository).deleteById("MED001");

            // When
            medicineService.deleteMedicine("MED001");

            // Then
            verify(medicineRepository).deleteById("MED001");
        }

        @Test
        @DisplayName("Should handle deleting non-existent medicine")
        void shouldHandle_DeletingNonExistentMedicine() {
            // Given
            doNothing().when(medicineRepository).deleteById("INVALID_ID");

            // When
            medicineService.deleteMedicine("INVALID_ID");

            // Then
            verify(medicineRepository).deleteById("INVALID_ID");
        }
    }
}
