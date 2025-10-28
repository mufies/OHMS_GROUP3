package com.example.ohms;

import com.example.ohms.dto.request.AppointmentRequest;
import com.example.ohms.dto.request.RoomChatRequest;
import com.example.ohms.dto.response.AppointmentResponse;
import com.example.ohms.entity.Appointment;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.User;
import com.example.ohms.enums.MedicalSpecialty;
import com.example.ohms.repository.AppointmentRepository;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.AppointmentService;
import com.example.ohms.service.RoomChatService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
// import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for AppointmentService
 * 
 * Test structure follows the exact method order in AppointmentService:
 * 1. createAppointment()
 * 2. getAppointmentById()
 * 3. getAppointmentsByPatient()
 * 4. getAppointmentsByDoctor()
 * 5. getTodayAppointmentsByDoctor()
 * 6. getUpcomingAppointmentsByPatient()
 * 7. getUpcomingAppointmentsByDoctor()
 * 8. getAppointmentsByDate()
 * 9. getDoctorAppointmentsByDate()
 * 10. updateAppointment()
 * 11. deleteAppointment()
 * 12. updateAppointmentStatus()
 * 13. assignDoctorToAppointment()
 * 14. updateAppointmentMedicalExaminations()
 * 
 * Coverage: 98% instructions, 90%+ branches (target)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AppointmentService Test Suite")
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MedicleExaminatioRepository medicleExaminatioRepository;

    @Mock
    private RoomChatService roomChatService;

    @InjectMocks
    private AppointmentService appointmentService;

    // Test data
    private User patient;
    private User doctor;
    private MedicalExamination examination;
    private MedicalExamination onlineConsultExam;
    private AppointmentRequest validRequest;
    private Appointment appointment;
    private LocalDate testDate;
    private LocalTime startTime;
    private LocalTime endTime;

    @BeforeEach
    void setUp() {
        // Setup test date and time
        testDate = LocalDate.now().plusDays(1);
        startTime = LocalTime.of(9, 0);
        endTime = LocalTime.of(9, 30);
        // Setup patient
        patient = User.builder()
                .id("P001")
                .username("John Doe")
                .email("patient@test.com")
                .phone(123456789)
                .build();
        // Setup doctor
        doctor = User.builder()
                .id("D001")
                .username("Dr. Smith")
                .email("doctor@test.com")
                .phone(987654321)
                .medicleSpecially(Set.of(MedicalSpecialty.CARDIOLOGY))
                .build();

        // Setup medical examination
        examination = MedicalExamination.builder()
                .id("E001")
                .name("Khám tổng quát")
                .price(200000)
                .medicalSpecialty(MedicalSpecialty.CARDIOLOGY)
                .build();

        // Setup online consultation exam
        onlineConsultExam = MedicalExamination.builder()
                .id("E002")
                .name("Tư vấn online")
                .price(100000)
                .medicalSpecialty(MedicalSpecialty.CARDIOLOGY)
                .build();

        // Setup valid request
        validRequest = new AppointmentRequest();
        validRequest.setPatientId("P001");
        validRequest.setDoctorId("D001");
        validRequest.setWorkDate(testDate);
        validRequest.setStartTime(startTime);
        validRequest.setEndTime(endTime);
        validRequest.setMedicalExaminationIds(List.of("E001"));
        // Setup appointment entity
        appointment = Appointment.builder()
                .id("A001")
                .patient(patient)
                .doctor(doctor)
                .workDate(testDate)
                .startTime(startTime)
                .endTime(endTime)
                .status("Schedule")
                .medicalExamnination(List.of(examination))
                .build();
    }

    // ==================== 1. CREATE APPOINTMENT TESTS ====================

    @Nested
    @DisplayName("1. createAppointment()")
    class CreateAppointmentTests {

        @Nested
        @DisplayName("Happy Path Tests")
        class HappyPathTests {

            @Test
            @DisplayName("Should create appointment with doctor successfully")
            void shouldCreateAppointment_WithDoctor() {
                // Given
                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
                when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                assertEquals("A001", response.getId());
                assertEquals("P001", response.getPatientId());
                assertEquals("D001", response.getDoctorId());
                assertEquals("Schedule", response.getStatus());

                verify(appointmentRepository).canCreateAppointment(anyString(), anyString(), any(), any(), any());
                verify(userRepository).findById("D001");
                verify(userRepository).findById("P001");
                verify(appointmentRepository).save(any(Appointment.class));
            }

            @Test
            @DisplayName("Should create service appointment without doctor")
            void shouldCreateAppointment_WithoutDoctor() {
                // Given
                validRequest.setDoctorId(null);
                validRequest.setParentAppointmentId("A001");

                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
                when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));

                Appointment serviceAppointment = Appointment.builder()
                        .id("A002")
                        .patient(patient)
                        .doctor(null)
                        .parentAppointment(appointment)
                        .workDate(testDate)
                        .startTime(startTime)
                        .endTime(endTime)
                        .status("Schedule")
                        .build();

                when(appointmentRepository.save(any(Appointment.class))).thenReturn(serviceAppointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                assertNull(response.getDoctorId());
                assertEquals("P001", response.getPatientId());

                verify(userRepository, never()).findById("D001");
                verify(appointmentRepository, never()).canCreateAppointment(any(), any(), any(), any(), any());
            }

            @Test
            @DisplayName("Should create appointment with multiple medical examinations")
            void shouldCreateAppointment_WithMultipleExaminations() {
                // Given
                validRequest.setMedicalExaminationIds(List.of("E001", "E002"));

                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
                when(medicleExaminatioRepository.findById("E002")).thenReturn(Optional.of(onlineConsultExam));
                when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
                when(roomChatService.createRoomChat(any(RoomChatRequest.class))).thenReturn(null);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(medicleExaminatioRepository, times(4)).findById(anyString());
                verify(appointmentRepository).save(any(Appointment.class));
            }

            @Test
            @DisplayName("Should create appointment with parent appointment")
            void shouldCreateAppointment_WithParent() {
                // Given
                validRequest.setParentAppointmentId("A001");

                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
                when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
                when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(appointmentRepository).findById("A001");
            }
        }

        @Nested
        @DisplayName("Chat Room Creation Tests")
        class ChatRoomTests {

            @Test
            @DisplayName("Should create chat room when 'Tư vấn online' is selected")
            void shouldCreateChatRoom_ForOnlineConsultation() {
                // Given
                validRequest.setMedicalExaminationIds(List.of("E002"));

                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(medicleExaminatioRepository.findById("E002")).thenReturn(Optional.of(onlineConsultExam));
                when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
                when(roomChatService.createRoomChat(any(RoomChatRequest.class))).thenReturn(null);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(roomChatService).createRoomChat(any(RoomChatRequest.class));
            }

            @Test
            @DisplayName("Should continue when chat room creation fails")
            void shouldContinue_WhenChatRoomFails() {
                // Given
                validRequest.setMedicalExaminationIds(List.of("E002"));

                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(medicleExaminatioRepository.findById("E002")).thenReturn(Optional.of(onlineConsultExam));
                when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
                doThrow(new RuntimeException("Chat service unavailable"))
                        .when(roomChatService).createRoomChat(any(RoomChatRequest.class));

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                assertEquals("A001", response.getId());
                verify(roomChatService).createRoomChat(any(RoomChatRequest.class));
            }

            @Test
            @DisplayName("Should NOT create chat room when doctorId is blank")
            void shouldNotCreateChatRoom_WhenDoctorBlank() {
                // Given
                validRequest.setDoctorId("   ");
                validRequest.setParentAppointmentId("A001");
                validRequest.setMedicalExaminationIds(List.of("E002"));

                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
                when(medicleExaminatioRepository.findById("E002")).thenReturn(Optional.of(onlineConsultExam));
                when(appointmentRepository.save(any())).thenReturn(appointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(roomChatService, never()).createRoomChat(any());
            }
        }

        @Nested
        @DisplayName("Edge Case Tests")
        class EdgeCaseTests {

            @Test
            @DisplayName("Should skip doctor when doctorId is blank")
            void shouldSkipDoctor_WhenDoctorBlank() {
                // Given
                validRequest.setDoctorId("   ");
                validRequest.setParentAppointmentId("A001");

                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
                when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
                when(appointmentRepository.save(any())).thenReturn(appointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(userRepository, never()).findById("   ");
            }

            @Test
            @DisplayName("Should skip parent when parentId is blank")
            void shouldSkipParent_WhenParentBlank() {
                // Given
                validRequest.setParentAppointmentId("   ");

                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(medicleExaminatioRepository.findById("E001")).thenReturn(Optional.of(examination));
                when(appointmentRepository.save(any())).thenReturn(appointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(appointmentRepository, never()).findById("   ");
            }

            @Test
            @DisplayName("Should handle empty medical examinations list")
            void shouldHandleEmptyExaminationsList() {
                // Given
                validRequest.setMedicalExaminationIds(List.of());

                when(appointmentRepository.canCreateAppointment(any(), any(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(appointmentRepository.save(any())).thenReturn(appointment);

                // When
                AppointmentResponse response = appointmentService.createAppointment(validRequest);

                // Then
                assertNotNull(response);
                verify(medicleExaminatioRepository, never()).findById(anyString());
                verify(roomChatService, never()).createRoomChat(any());
            }
        }

        @Nested
        @DisplayName("Error Scenario Tests")
        class ErrorTests {

            @Test
            @DisplayName("Should throw exception when patient not found")
            void shouldThrowException_WhenPatientNotFound() {
                // Given
                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.empty());

                // When & Then
                RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                    appointmentService.createAppointment(validRequest);
                });

                assertTrue(exception.getMessage().contains("Patient not found"));
                verify(appointmentRepository, never()).save(any());
            }

            @Test
            @DisplayName("Should throw exception when doctor not found")
            void shouldThrowException_WhenDoctorNotFound() {
                // Given
                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.empty());

                // When & Then
                RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                    appointmentService.createAppointment(validRequest);
                });

                assertTrue(exception.getMessage().contains("Doctor not found"));
                verify(appointmentRepository, never()).save(any());
            }

            @Test
            @DisplayName("Should throw exception when time slot conflict")
            void shouldThrowException_WhenTimeSlotConflict() {
                // Given
                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(false);

                // When & Then
                RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                    appointmentService.createAppointment(validRequest);
                });

                assertTrue(exception.getMessage().contains("Time slot already booked"));
                verify(userRepository, never()).findById(anyString());
                verify(appointmentRepository, never()).save(any());
            }

            @Test
            @DisplayName("Should throw exception when parent appointment not found")
            void shouldThrowException_WhenParentNotFound() {
                // Given
                validRequest.setParentAppointmentId("INVALID_ID");

                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(appointmentRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

                // When & Then
                RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                    appointmentService.createAppointment(validRequest);
                });

                assertTrue(exception.getMessage().contains("Parent appointment not found"));
            }

            @Test
            @DisplayName("Should throw exception when medical examination not found")
            void shouldThrowException_WhenExaminationNotFound() {
                // Given
                validRequest.setMedicalExaminationIds(List.of("INVALID_EXAM_ID"));

                when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                        .thenReturn(true);
                when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
                when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
                when(medicleExaminatioRepository.findById("INVALID_EXAM_ID")).thenReturn(Optional.empty());

                // When & Then
                RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                    appointmentService.createAppointment(validRequest);
                });

                assertTrue(exception.getMessage().contains("Medical examination not found"));
            }
        }
    }

    // ==================== 2. GET APPOINTMENT BY ID TESTS ====================

    @Nested
    @DisplayName("2. getAppointmentById()")
    class GetAppointmentByIdTests {

        @Test
        @DisplayName("Should get appointment by ID successfully")
        void shouldGetAppointment_WhenIdExists() {
            // Given
            when(appointmentRepository.findByIdWithDetails("A001")).thenReturn(Optional.of(appointment));

            // When
            AppointmentResponse response = appointmentService.getAppointmentById("A001");

            // Then
            assertNotNull(response);
            assertEquals("A001", response.getId());
            assertEquals("P001", response.getPatientId());
            assertEquals("D001", response.getDoctorId());
            verify(appointmentRepository).findByIdWithDetails("A001");
        }

        @Test
        @DisplayName("Should throw exception when appointment not found")
        void shouldThrowException_WhenAppointmentNotFound() {
            // Given
            when(appointmentRepository.findByIdWithDetails("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.getAppointmentById("INVALID_ID");
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
        }
    }

    // ==================== 3. GET APPOINTMENTS BY PATIENT TESTS ====================

    @Nested
    @DisplayName("3. getAppointmentsByPatient()")
    class GetAppointmentsByPatientTests {

        @Test
        @DisplayName("Should return list of appointments for patient")
        void shouldReturnAppointments_WhenPatientHasAppointments() {
            // Given
            List<Appointment> appointments = Arrays.asList(appointment);
            when(appointmentRepository.findByPatientId("P001")).thenReturn(appointments);

            // When
            List<AppointmentResponse> responses = appointmentService.getAppointmentsByPatient("P001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("A001", responses.get(0).getId());
            verify(appointmentRepository).findByPatientId("P001");
        }

        @Test
        @DisplayName("Should return empty list when patient has no appointments")
        void shouldReturnEmptyList_WhenPatientHasNoAppointments() {
            // Given
            when(appointmentRepository.findByPatientId("P001")).thenReturn(Collections.emptyList());

            // When
            List<AppointmentResponse> responses = appointmentService.getAppointmentsByPatient("P001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 4. GET APPOINTMENTS BY DOCTOR TESTS ====================

    @Nested
    @DisplayName("4. getAppointmentsByDoctor()")
    class GetAppointmentsByDoctorTests {

        @Test
        @DisplayName("Should return list of appointments for doctor")
        void shouldReturnAppointments_WhenDoctorHasAppointments() {
            // Given
            List<Appointment> appointments = Arrays.asList(appointment);
            when(appointmentRepository.findByDoctorId("D001")).thenReturn(appointments);

            // When
            List<AppointmentResponse> responses = appointmentService.getAppointmentsByDoctor("D001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("A001", responses.get(0).getId());
            assertEquals("D001", responses.get(0).getDoctorId());
        }

        @Test
        @DisplayName("Should return empty list when doctor has no appointments")
        void shouldReturnEmptyList_WhenDoctorHasNoAppointments() {
            // Given
            when(appointmentRepository.findByDoctorId("D001")).thenReturn(Collections.emptyList());

            // When
            List<AppointmentResponse> responses = appointmentService.getAppointmentsByDoctor("D001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 5. GET TODAY APPOINTMENTS BY DOCTOR TESTS ====================

    @Nested
    @DisplayName("5. getTodayAppointmentsByDoctor()")
    class GetTodayAppointmentsByDoctorTests {

        @Test
        @DisplayName("Should get today's appointments by doctor")
        void shouldGetTodayAppointments_WhenDoctorHasAppointments() {
            // Given
            when(appointmentRepository.findTodayAppointmentsByDoctor("D001"))
                    .thenReturn(List.of(appointment));

            // When
            List<AppointmentResponse> responses = appointmentService.getTodayAppointmentsByDoctor("D001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
        }
    }

    // ==================== 6. GET UPCOMING APPOINTMENTS BY PATIENT TESTS ====================

    @Nested
    @DisplayName("6. getUpcomingAppointmentsByPatient()")
    class GetUpcomingAppointmentsByPatientTests {

        @Test
        @DisplayName("Should get upcoming appointments by patient")
        void shouldGetUpcomingAppointments_ForPatient() {
            // Given
            when(appointmentRepository.findUpcomingAppointmentsByPatient("P001"))
                    .thenReturn(List.of(appointment));

            // When
            List<AppointmentResponse> responses = appointmentService.getUpcomingAppointmentsByPatient("P001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
        }
    }

    // ==================== 7. GET UPCOMING APPOINTMENTS BY DOCTOR TESTS ====================

    @Nested
    @DisplayName("7. getUpcomingAppointmentsByDoctor()")
    class GetUpcomingAppointmentsByDoctorTests {

        @Test
        @DisplayName("Should get upcoming appointments by doctor")
        void shouldGetUpcomingAppointments_ForDoctor() {
            // Given
            when(appointmentRepository.findUpcomingAppointmentsByDoctor("D001"))
                    .thenReturn(List.of(appointment));

            // When
            List<AppointmentResponse> responses = appointmentService.getUpcomingAppointmentsByDoctor("D001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
        }
    }

    // ==================== 8. GET APPOINTMENTS BY DATE TESTS ====================

    @Nested
    @DisplayName("8. getAppointmentsByDate()")
    class GetAppointmentsByDateTests {

        @Test
        @DisplayName("Should get appointments by date")
        void shouldGetAppointmentsByDate() {
            // Given
            when(appointmentRepository.findByWorkDate(testDate))
                    .thenReturn(List.of(appointment));

            // When
            List<AppointmentResponse> responses = appointmentService.getAppointmentsByDate(testDate);

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
        }
    }

    // ==================== 9. GET DOCTOR APPOINTMENTS BY DATE TESTS ====================

    @Nested
    @DisplayName("9. getDoctorAppointmentsByDate()")
    class GetDoctorAppointmentsByDateTests {

        @Test
        @DisplayName("Should get doctor appointments by date")
        void shouldGetDoctorAppointmentsByDate() {
            // Given
            when(appointmentRepository.findByDoctorAndDateWithPatientDetails("D001", testDate))
                    .thenReturn(List.of(appointment));

            // When
            List<AppointmentResponse> responses = appointmentService.getDoctorAppointmentsByDate("D001", testDate);

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals("D001", responses.get(0).getDoctorId());
        }
    }

    // ==================== 10. UPDATE APPOINTMENT TESTS ====================

    @Nested
    @DisplayName("10. updateAppointment()")
    class UpdateAppointmentTests {

        @Test
        @DisplayName("Should update appointment successfully")
        void shouldUpdateAppointment_WhenDataIsValid() {
            // Given
            LocalDate newDate = testDate.plusDays(1);
            LocalTime newStartTime = LocalTime.of(10, 0);
            LocalTime newEndTime = LocalTime.of(10, 30);

            validRequest.setWorkDate(newDate);
            validRequest.setStartTime(newStartTime);
            validRequest.setEndTime(newEndTime);

            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                    .thenReturn(true);
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

            // When
            AppointmentResponse response = appointmentService.updateAppointment("A001", validRequest);

            // Then
            assertNotNull(response);
            verify(appointmentRepository).findById("A001");
            verify(appointmentRepository).save(any(Appointment.class));
        }

        @Test
        @DisplayName("Should throw exception when update causes time conflict")
        void shouldThrowException_WhenUpdateCausesConflict() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(appointmentRepository.canCreateAppointment(anyString(), anyString(), any(), any(), any()))
                    .thenReturn(false);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.updateAppointment("A001", validRequest);
            });

            assertTrue(exception.getMessage().contains("conflicts"));
            verify(appointmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when appointment not found for update")
        void shouldThrowException_WhenAppointmentNotFoundForUpdate() {
            // Given
            when(appointmentRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.updateAppointment("INVALID_ID", validRequest);
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
        }
    }

    // ==================== 11. DELETE APPOINTMENT TESTS ====================

    @Nested
    @DisplayName("11. deleteAppointment()")
    class DeleteAppointmentTests {

        @Test
        @DisplayName("Should delete appointment successfully")
        void shouldDeleteAppointment_WhenIdExists() {
            // Given
            when(appointmentRepository.existsById("A001")).thenReturn(true);
            doNothing().when(appointmentRepository).deleteById("A001");

            // When
            appointmentService.deleteAppointment("A001");

            // Then
            verify(appointmentRepository).existsById("A001");
            verify(appointmentRepository).deleteById("A001");
        }

        @Test
        @DisplayName("Should throw exception when appointment not found for delete")
        void shouldThrowException_WhenAppointmentNotFoundForDelete() {
            // Given
            when(appointmentRepository.existsById("INVALID_ID")).thenReturn(false);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.deleteAppointment("INVALID_ID");
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
            verify(appointmentRepository, never()).deleteById(anyString());
        }
    }

    // ==================== 12. UPDATE APPOINTMENT STATUS TESTS ====================

    @Nested
    @DisplayName("12. updateAppointmentStatus()")
    class UpdateAppointmentStatusTests {

        @Test
        @DisplayName("Should update appointment status successfully")
        void shouldUpdateStatus_WhenDataIsValid() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

            // When
            AppointmentResponse response = appointmentService.updateAppointmentStatus("A001", "Completed");

            // Then
            assertNotNull(response);
            verify(appointmentRepository).findById("A001");
            verify(appointmentRepository).save(any(Appointment.class));
        }

        @Test
        @DisplayName("Should throw exception when appointment not found for status update")
        void shouldThrowException_WhenAppointmentNotFoundForStatusUpdate() {
            // Given
            when(appointmentRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.updateAppointmentStatus("INVALID_ID", "Completed");
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
        }
    }

    // ==================== 13. ASSIGN DOCTOR TO APPOINTMENT TESTS ====================

    @Nested
    @DisplayName("13. assignDoctorToAppointment()")
    class AssignDoctorToAppointmentTests {

        @Test
        @DisplayName("Should assign doctor to appointment successfully")
        void shouldAssignDoctor_WhenDataIsValid() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(userRepository.existsById("D001")).thenReturn(true);
            when(appointmentRepository.assignDoctorToAppointment("A001", "D001")).thenReturn(1);

            // When
            appointmentService.assignDoctorToAppointment("A001", "D001");

            // Then
            verify(appointmentRepository).findById("A001");
            verify(userRepository).existsById("D001");
            verify(appointmentRepository).assignDoctorToAppointment("A001", "D001");
        }

        @Test
        @DisplayName("Should throw exception when appointment not found for assignment")
        void shouldThrowException_WhenAppointmentNotFoundForAssignment() {
            // Given
            when(appointmentRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.assignDoctorToAppointment("INVALID_ID", "D001");
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
        }

        @Test
        @DisplayName("Should throw exception when doctor not found for assignment")
        void shouldThrowException_WhenDoctorNotFoundForAssignment() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(userRepository.existsById("INVALID_DOCTOR")).thenReturn(false);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.assignDoctorToAppointment("A001", "INVALID_DOCTOR");
            });

            assertTrue(exception.getMessage().contains("Doctor not found"));
        }

        @Test
        @DisplayName("Should throw exception when assignment fails")
        void shouldThrowException_WhenAssignmentFails() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(userRepository.existsById("D001")).thenReturn(true);
            when(appointmentRepository.assignDoctorToAppointment("A001", "D001")).thenReturn(0);

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.assignDoctorToAppointment("A001", "D001");
            });

            assertTrue(exception.getMessage().contains("Failed to assign doctor"));
        }
    }

    // ==================== 14. UPDATE APPOINTMENT MEDICAL EXAMINATIONS TESTS ====================

    @Nested
    @DisplayName("14. updateAppointmentMedicalExaminations()")
    class UpdateAppointmentMedicalExaminationsTests {

        @Test
        @DisplayName("Should add new medical examinations")
        void shouldAddMedicalExaminations_WhenValid() {
            // Given
            MedicalExamination newExam = MedicalExamination.builder()
                    .id("E003")
                    .name("X-Ray")
                    .price(150000)
                    .build();

            appointment.setMedicalExamnination(new ArrayList<>(List.of(examination)));

            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicleExaminatioRepository.findById("E003")).thenReturn(Optional.of(newExam));
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

            // When
            AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                    "A001", List.of("E003")
            );

            // Then
            assertNotNull(response);
            verify(medicleExaminatioRepository).findById("E003");
            verify(appointmentRepository).save(any(Appointment.class));
        }

        @Test
        @DisplayName("Should skip duplicate medical examinations")
        void shouldSkipDuplicateExaminations() {
            // Given
            appointment.setMedicalExamnination(new ArrayList<>(List.of(examination)));

            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

            // When
            AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                    "A001", List.of("E001")
            );

            // Then
            assertNotNull(response);
            verify(medicleExaminatioRepository, never()).findById("E001");
        }

        @Test
        @DisplayName("Should throw exception when appointment not found for exam update")
        void shouldThrowException_WhenAppointmentNotFoundForExamUpdate() {
            // Given
            when(appointmentRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.updateAppointmentMedicalExaminations("INVALID_ID", List.of("E001"));
            });

            assertTrue(exception.getMessage().contains("Appointment not found"));
        }

        @Test
        @DisplayName("Should throw exception when adding invalid medical examination")
        void shouldThrowException_WhenAddingInvalidExamination() {
            // Given
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
            when(medicleExaminatioRepository.findById("INVALID_EXAM"))
                    .thenReturn(Optional.empty());

            // When & Then
            RuntimeException exception = assertThrows(RuntimeException.class, () -> {
                appointmentService.updateAppointmentMedicalExaminations("A001", List.of("INVALID_EXAM"));
            });

            assertTrue(exception.getMessage().contains("Medical examination not found"));
        }
    @Test
    @DisplayName("Should initialize exam list when appointment has null exams")
    void shouldInitializeExamList_WhenAppointmentHasNullExams() {
        // Given - Appointment with NULL medical examinations
        appointment.setMedicalExamnination(null); // ← NULL exams (BRANCH #1)

        MedicalExamination newExam = MedicalExamination.builder()
                .id("E003")
                .name("Blood Test")
                .price(100000)
                .build();

        when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
        when(medicleExaminatioRepository.findById("E003")).thenReturn(Optional.of(newExam));
        
        // Capture the saved appointment to verify exam list was initialized
        ArgumentCaptor<Appointment> appointmentCaptor = ArgumentCaptor.forClass(Appointment.class);
        when(appointmentRepository.save(appointmentCaptor.capture())).thenReturn(appointment);

        // When
        AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                "A001", List.of("E003")
        );

        // Then
        assertNotNull(response);
        
        // Verify exam list was created and exam was added
        Appointment savedAppointment = appointmentCaptor.getValue();
        assertNotNull(savedAppointment.getMedicalExamnination());
        verify(medicleExaminatioRepository).findById("E003");
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should handle empty exam list when appointment has no exams")
    void shouldHandleEmptyExamList_WhenAppointmentHasNoExams() {
        // Given - Appointment with empty list (not null, but empty)
        appointment.setMedicalExamnination(new ArrayList<>()); // ← Empty list

        MedicalExamination newExam = MedicalExamination.builder()
                .id("E003")
                .name("CT Scan")
                .price(500000)
                .build();

        when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
        when(medicleExaminatioRepository.findById("E003")).thenReturn(Optional.of(newExam));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        // When
        AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                "A001", List.of("E003")
        );

        // Then
        assertNotNull(response);
        verify(medicleExaminatioRepository).findById("E003");
        verify(appointmentRepository).save(any(Appointment.class));
    }



    @Test
    @DisplayName("Should handle null medical examination IDs list")
    void shouldHandleNullExaminationIds() {
        // Given
        appointment.setMedicalExamnination(new ArrayList<>(List.of(examination)));

        when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        // When
        AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                "A001", null // ← NULL list
        );

        // Then
        assertNotNull(response);
        verify(medicleExaminatioRepository, never()).findById(anyString());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should handle empty medical examination IDs list")
    void shouldHandleEmptyExaminationIds() {
        // Given
        appointment.setMedicalExamnination(new ArrayList<>(List.of(examination)));

        when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        // When
        AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                "A001", List.of() // ← Empty list
        );

        // Then
        assertNotNull(response);
        verify(medicleExaminatioRepository, never()).findById(anyString());
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should add multiple new exams at once")
    void shouldAddMultipleNewExams_AtOnce() {
        // Given
        appointment.setMedicalExamnination(new ArrayList<>(List.of(examination)));

        MedicalExamination exam2 = MedicalExamination.builder()
                .id("E002")
                .name("Tư vấn online")
                .price(100000)
                .build();

        MedicalExamination exam3 = MedicalExamination.builder()
                .id("E003")
                .name("X-Ray")
                .price(150000)
                .build();

        when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
        when(medicleExaminatioRepository.findById("E002")).thenReturn(Optional.of(exam2));
        when(medicleExaminatioRepository.findById("E003")).thenReturn(Optional.of(exam3));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        // When
        AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                "A001", List.of("E002", "E003")
        );

        // Then
        assertNotNull(response);
        verify(medicleExaminatioRepository).findById("E002");
        verify(medicleExaminatioRepository).findById("E003");
        verify(appointmentRepository).save(any(Appointment.class));
    }

    @Test
    @DisplayName("Should handle mix of new and duplicate exams")
    void shouldHandleMixOfNewAndDuplicateExams() {
        // Given - Appointment already has E001
        appointment.setMedicalExamnination(new ArrayList<>(List.of(examination)));

        MedicalExamination newExam = MedicalExamination.builder()
                .id("E003")
                .name("MRI")
                .price(800000)
                .build();

        when(appointmentRepository.findById("A001")).thenReturn(Optional.of(appointment));
        when(medicleExaminatioRepository.findById("E003")).thenReturn(Optional.of(newExam));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        // When - Add E001 (duplicate) and E003 (new)
        AppointmentResponse response = appointmentService.updateAppointmentMedicalExaminations(
                "A001", List.of("E001", "E003")
        );

        // Then
        assertNotNull(response);
        verify(medicleExaminatioRepository, never()).findById("E001"); // Skipped duplicate
        verify(medicleExaminatioRepository).findById("E003"); // Added new
        verify(appointmentRepository).save(any(Appointment.class));
    }

        
    }


    // ==================== PARENT-CHILD RELATIONSHIP TESTS ====================

    @Nested
    @DisplayName("Parent-Child Appointment Relationships")
    class ParentChildRelationshipTests {

        @Test
        @DisplayName("Should create child appointment linked to parent")
        void shouldCreateChildAppointment_WhenParentExists() {
            // Given
            Appointment parentAppointment = Appointment.builder()
                    .id("A001").patient(patient).doctor(doctor).workDate(testDate).startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(10, 30)).status("Schedule")
                    .medicalExamnination(List.of(examination))
                    .build();
            AppointmentRequest childRequest = new AppointmentRequest();
            childRequest.setPatientId("P001");
            childRequest.setDoctorId(null);
            childRequest.setParentAppointmentId("A001");
            childRequest.setWorkDate(testDate);
            childRequest.setStartTime(LocalTime.of(9, 0));
            childRequest.setEndTime(LocalTime.of(9, 30));
            childRequest.setMedicalExaminationIds(List.of("E002"));

            Appointment childAppointment = Appointment.builder()
                    .id("A002").patient(patient).doctor(null).parentAppointment(parentAppointment).workDate(testDate).startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(9, 30))
                    .status("Schedule")
                    .medicalExamnination(List.of(onlineConsultExam))
                    .build();
            when(userRepository.findById("P001")).thenReturn(Optional.of(patient));
            when(appointmentRepository.findById("A001")).thenReturn(Optional.of(parentAppointment));
            when(medicleExaminatioRepository.findById("E002")).thenReturn(Optional.of(onlineConsultExam));
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(childAppointment);

            // When
            AppointmentResponse response = appointmentService.createAppointment(childRequest);

            // Then
            assertNotNull(response);
            assertEquals("A002", response.getId());
            assertEquals("A001", response.getParentAppointmentId());
            assertNull(response.getDoctorId());
            verify(appointmentRepository, never()).canCreateAppointment(any(), any(), any(), any(), any());
        }

        @Test
        @DisplayName("Should get parent with multiple child appointments")
        void shouldGetParent_WithMultipleChildren() {
            // Given
            Appointment child1 = Appointment.builder()
                    .id("A002")
                    .patient(patient)
                    .parentAppointment(appointment)
                    .workDate(testDate)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(9, 30))
                    .status("Schedule")
                    .build();

            Appointment child2 = Appointment.builder()
                    .id("A003")
                    .patient(patient)
                    .parentAppointment(appointment)
                    .workDate(testDate)
                    .startTime(LocalTime.of(9, 30))
                    .endTime(LocalTime.of(10, 0))
                    .status("Schedule")
                    .build();

            appointment.setServiceAppointments(List.of(child1, child2));

            when(appointmentRepository.findByIdWithDetails("A001"))
                    .thenReturn(Optional.of(appointment));

            // When
            AppointmentResponse response = appointmentService.getAppointmentById("A001");

            // Then
            assertNotNull(response);
            assertEquals("A001", response.getId());
            assertNotNull(response.getServiceAppointments());
            assertEquals(2, response.getServiceAppointments().size());
        }
    }
}
