package com.example.ohms;

import com.example.ohms.dto.request.ScheduleRequest;
import com.example.ohms.dto.response.ScheduleResponse;
import com.example.ohms.entity.Schedule;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.ScheduleMapper;
import com.example.ohms.repository.ScheduleRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.service.ScheduleService;

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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for ScheduleService
 * 
 * Test Coverage:
 * 1. createSchedule()
 * 2. getListScheduleForDoctor()
 * 3. getWeeklyScheduleForDoctor()
 * 4. getNextWeekScheduleForDoctor()
 * 5. updateSchedule()
 * 6. deleteSchedule()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleService Test Suite")
class ScheduleServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ScheduleMapper scheduleMapper;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ScheduleService scheduleService;

    // Test data
    private User doctor;
    private Schedule schedule;
    private ScheduleRequest scheduleRequest;
    private ScheduleResponse scheduleResponse;
    private LocalDate workDate;
    private LocalTime startTime;
    private LocalTime endTime;

    @BeforeEach
    void setUp() {
        // Setup work date and time
        workDate = LocalDate.now().plusDays(1);
        startTime = LocalTime.of(9, 0);
        endTime = LocalTime.of(17, 0);

        // Setup doctor
        doctor = User.builder()
                .id("D001")
                .username("Dr. Smith")
                .email("doctor@test.com")
                .build();

        // Setup schedule
        schedule = Schedule.builder()
                .id("S001")
                .doctor(doctor)
                .workDate(workDate)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        // Setup schedule request
        scheduleRequest = ScheduleRequest.builder()
                .workDate(workDate)
                .startTime(startTime)
                .endTime(endTime)
                .build();

        // Setup schedule response (ScheduleResponse only has: workDate, startTime, endTime)  
        scheduleResponse = ScheduleResponse.builder()
                .workDate(workDate)
                .startTime(startTime)
                .endTime(endTime)
                .build();
    }

    // ==================== 1. CREATE SCHEDULE TESTS ====================

    @Nested
    @DisplayName("1. createSchedule()")
    class CreateScheduleTests {

        @Test
        @DisplayName("Should create schedule successfully")
        void shouldCreateSchedule_WhenDataIsValid() {
            // Given
            when(userRepository.findById("D001")).thenReturn(Optional.of(doctor));
            when(scheduleRepository.existsByDoctor_IdAndWorkDate("D001", workDate)).thenReturn(false);
            when(scheduleMapper.toSchedule(scheduleRequest)).thenReturn(schedule);
            when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
            when(scheduleMapper.toScheduleResponse(schedule)).thenReturn(scheduleResponse);

            // When
            ScheduleResponse response = scheduleService.createSchedule(scheduleRequest, "D001");

            // Then
            assertNotNull(response);
            assertEquals(workDate, response.getWorkDate());
            assertEquals(startTime, response.getStartTime());
            assertEquals(endTime, response.getEndTime());
            verify(scheduleRepository).save(any(Schedule.class));
        }

        @Test
        @DisplayName("Should throw exception when date is in the past")
        void shouldThrowException_WhenDateInPast() {
            // Given
            ScheduleRequest pastRequest = ScheduleRequest.builder()
                    .workDate(LocalDate.now().minusDays(1))
                    .startTime(startTime)
                    .endTime(endTime)
                    .build();

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                scheduleService.createSchedule(pastRequest, "D001");
            });

            assertEquals(ErrorCode.DATE_NOT_VAILID, exception.getErrorCode());
            verify(scheduleRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when schedule already exists for date")
        void shouldThrowException_WhenScheduleAlreadyExists() {
            // Given
            when(scheduleRepository.existsByDoctor_IdAndWorkDate("D001", workDate)).thenReturn(true);

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                scheduleService.createSchedule(scheduleRequest, "D001");
            });

            assertEquals(ErrorCode.DATE_NOT_VAILID, exception.getErrorCode());
            verify(scheduleRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception when doctor not found")
        void shouldThrowException_WhenDoctorNotFound() {
            // Given
            when(scheduleRepository.existsByDoctor_IdAndWorkDate("D001", workDate)).thenReturn(false);
            when(userRepository.findById("D001")).thenReturn(Optional.empty());

            // When & Then
            AppException exception = assertThrows(AppException.class, () -> {
                scheduleService.createSchedule(scheduleRequest, "D001");
            });

            assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        }
    }

    // ==================== 2. GET LIST SCHEDULE FOR DOCTOR TESTS ====================

    @Nested
    @DisplayName("2. getListScheduleForDoctor()")
    class GetListScheduleForDoctorTests {

        @Test
        @DisplayName("Should get all schedules for doctor")
        void shouldGetAllSchedules_ForDoctor() {
            // Given
            when(scheduleRepository.findByDoctor_Id("D001")).thenReturn(List.of(schedule));
            when(scheduleMapper.toScheduleResponse(schedule)).thenReturn(scheduleResponse);

            // When
            List<ScheduleResponse> responses = scheduleService.getListScheduleForDoctor("D001");

            // Then
            assertNotNull(responses);
            assertEquals(1, responses.size());
            assertEquals(workDate, responses.get(0).getWorkDate());
        }

        @Test
        @DisplayName("Should return empty list when doctor has no schedules")
        void shouldReturnEmptyList_WhenDoctorHasNoSchedules() {
            // Given
            when(scheduleRepository.findByDoctor_Id("D001")).thenReturn(List.of());

            // When
            List<ScheduleResponse> responses = scheduleService.getListScheduleForDoctor("D001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 3. GET WEEKLY SCHEDULE FOR DOCTOR TESTS ====================

    @Nested
    @DisplayName("3. getWeeklyScheduleForDoctor()")
    class GetWeeklyScheduleForDoctorTests {

        @Test
        @DisplayName("Should get this week's schedules for doctor")
        void shouldGetThisWeekSchedules_ForDoctor() {
            // Given
            Schedule thisWeekSchedule = Schedule.builder()
                    .id("S001")
                    .doctor(doctor)
                    .workDate(LocalDate.now().plusDays(1))
                    .startTime(startTime)
                    .endTime(endTime)
                    .build();

            when(scheduleRepository.findByDoctor_Id("D001")).thenReturn(List.of(thisWeekSchedule));
            when(scheduleMapper.toScheduleResponse(thisWeekSchedule)).thenReturn(scheduleResponse);

            // When
            List<ScheduleResponse> responses = scheduleService.getWeeklyScheduleForDoctor("D001");

            // Then
            assertNotNull(responses);
            assertFalse(responses.isEmpty());
        }

        @Test
        @DisplayName("Should filter out schedules from other weeks")
        void shouldFilterOut_SchedulesFromOtherWeeks() {
            // Given
            Schedule nextWeekSchedule = Schedule.builder()
                    .id("S002")
                    .doctor(doctor)
                    .workDate(LocalDate.now().plusWeeks(2))
                    .startTime(startTime)
                    .endTime(endTime)
                    .build();

            when(scheduleRepository.findByDoctor_Id("D001")).thenReturn(List.of(nextWeekSchedule));

            // When
            List<ScheduleResponse> responses = scheduleService.getWeeklyScheduleForDoctor("D001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 4. GET NEXT WEEK SCHEDULE FOR DOCTOR TESTS ====================

    @Nested
    @DisplayName("4. getNextWeekScheduleForDoctor()")
    class GetNextWeekScheduleForDoctorTests {

        @Test
        @DisplayName("Should get next week's schedules for doctor")
        void shouldGetNextWeekSchedules_ForDoctor() {
            // Given
            Schedule nextWeekSchedule = Schedule.builder()
                    .id("S002")
                    .doctor(doctor)
                    .workDate(LocalDate.now().plusWeeks(1).plusDays(1))
                    .startTime(startTime)
                    .endTime(endTime)
                    .build();

            when(scheduleRepository.findByDoctor_Id("D001")).thenReturn(List.of(nextWeekSchedule));
            when(scheduleMapper.toScheduleResponse(nextWeekSchedule)).thenReturn(scheduleResponse);

            // When
            List<ScheduleResponse> responses = scheduleService.getNextWeekScheduleForDoctor("D001");

            // Then
            assertNotNull(responses);
            assertFalse(responses.isEmpty());
        }

        @Test
        @DisplayName("Should filter out schedules not in next week")
        void shouldFilterOut_SchedulesNotInNextWeek() {
            // Given
            Schedule thisWeekSchedule = Schedule.builder()
                    .id("S001")
                    .doctor(doctor)
                    .workDate(LocalDate.now().plusDays(1))
                    .startTime(startTime)
                    .endTime(endTime)
                    .build();

            when(scheduleRepository.findByDoctor_Id("D001")).thenReturn(List.of(thisWeekSchedule));

            // When
            List<ScheduleResponse> responses = scheduleService.getNextWeekScheduleForDoctor("D001");

            // Then
            assertNotNull(responses);
            assertTrue(responses.isEmpty());
        }
    }

    // ==================== 5. UPDATE SCHEDULE TESTS ====================

    @Nested
    @DisplayName("5. updateSchedule()")
    class UpdateScheduleTests {

        @Test
        @DisplayName("Should update schedule successfully")
        void shouldUpdateSchedule_Successfully() {
            // Given
            when(scheduleRepository.findById("S001")).thenReturn(Optional.of(schedule));
            when(scheduleRepository.save(any(Schedule.class))).thenReturn(schedule);
            when(scheduleMapper.toScheduleResponse(schedule)).thenReturn(scheduleResponse);

            // When
            ScheduleResponse response = scheduleService.updateSchedule("S001", scheduleRequest);

            // Then
            assertNotNull(response);
            verify(scheduleRepository).save(any(Schedule.class));
        }

        @Test
        @DisplayName("Should throw exception when schedule not found for update")
        void shouldThrowException_WhenScheduleNotFoundForUpdate() {
            // Given
            when(scheduleRepository.findById("INVALID_ID")).thenReturn(Optional.empty());

            // When & Then
            assertThrows(AppException.class, () -> {
                scheduleService.updateSchedule("INVALID_ID", scheduleRequest);
            });
        }
    }

    // ==================== 6. DELETE SCHEDULE TESTS ====================

    @Nested
    @DisplayName("6. deleteSchedule()")
    class DeleteScheduleTests {

        @Test
        @DisplayName("Should delete schedule successfully")
        void shouldDeleteSchedule_Successfully() {
            // Given
            lenient().when(scheduleRepository.existsById("S001")).thenReturn(true);
            lenient().doNothing().when(scheduleRepository).deleteById("S001");

            // When
            scheduleService.deleteSchedule("S001");

            // Then
            verify(scheduleRepository).deleteById("S001");
        }

        @Test
        @DisplayName("Should throw exception when schedule not found for delete")
        void shouldThrowException_WhenScheduleNotFoundForDelete() {
            // Given
            when(scheduleRepository.existsById("INVALID_ID")).thenReturn(false);

            // When & Then
            assertThrows(AppException.class, () -> {
                scheduleService.deleteSchedule("INVALID_ID");
            });
        }
    }
}
