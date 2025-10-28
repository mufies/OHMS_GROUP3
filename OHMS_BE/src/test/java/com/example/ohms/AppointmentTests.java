// package com.example.ohms;

// import static org.assertj.core.api.Assertions.assertThat;
// import static org.junit.jupiter.api.Assertions.*;

// import java.time.LocalDate;
// import java.time.LocalTime;
// import java.util.ArrayList;
// import java.util.List;
// import java.util.Optional;

// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
// import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
// import org.springframework.test.context.ActiveProfiles;

// import com.example.ohms.entity.Appointment;
// import com.example.ohms.entity.MedicalExamination;
// import com.example.ohms.entity.Role;
// import com.example.ohms.entity.User;
// import com.example.ohms.enums.MedicalSpecialty;
// import com.example.ohms.repository.AppointmentRepository;

// import java.util.Set;

// @DataJpaTest
// @ActiveProfiles("test")
// @DisplayName("Appointment Repository Tests")
// public class AppointmentTests {

//     @Autowired
//     private TestEntityManager entityManager;

//     @Autowired
//     private AppointmentRepository appointmentRepository;

//     private User patient;
//     private User doctor;
//     private MedicalExamination examination;
//     private LocalDate testDate;
//     private LocalTime startTime;
//     private LocalTime endTime;

//     @BeforeEach
//     void setUp() {
//         // Create test patient
//         patient = User.builder()
//                 .username("patient_test")
//                 .email("patient@test.com")
//                 .password("password123")
//                 .phone(123456789)
//                 .build();
//         entityManager.persist(patient);

//         // Create test doctor
//         doctor = User.builder()
//                 .username("doctor_test")
//                 .email("doctor@test.com")
//                 .password("password123")
//                 .phone(987654321)
//                 .medicleSpecially(Set.of(MedicalSpecialty.CARDIOLOGY))
//                 .build();
//         entityManager.persist(doctor);

//         // Create test medical examination
//         examination = MedicalExamination.builder()
//                 .name("Khám bệnh")
//                 .price(100000)
//                 .medicalSpecialty(MedicalSpecialty.CARDIOLOGY)
//                 .build();
//         entityManager.persist(examination);

//         testDate = LocalDate.now().plusDays(1);
//         startTime = LocalTime.of(9, 0);
//         endTime = LocalTime.of(9, 30);

//         entityManager.flush();
//     }

//     @Test
//     @DisplayName("Test 1: Create and save appointment successfully")
//     void testCreateAppointment() {
//         // Given
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .medicalExamnination(List.of(examination))
//                 .build();

//         // When
//         Appointment saved = appointmentRepository.save(appointment);

//         // Then
//         assertThat(saved.getId()).isNotNull();
//         assertThat(saved.getPatient()).isEqualTo(patient);
//         assertThat(saved.getDoctor()).isEqualTo(doctor);
//         assertThat(saved.getWorkDate()).isEqualTo(testDate);
//         assertThat(saved.getStatus()).isEqualTo("Scheduled");
//     }

//     @Test
//     @DisplayName("Test 2: Find appointment by patient ID")
//     void testFindByPatientId() {
//         // Given
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .build();
//         appointmentRepository.save(appointment);

//         // When
//         List<Appointment> found = appointmentRepository.findByPatientId(patient.getId());

//         // Then
//         assertThat(found).isNotEmpty();
//         assertThat(found.get(0).getPatient().getId()).isEqualTo(patient.getId());
//     }

//     @Test
//     @DisplayName("Test 3: Find appointment by doctor ID")
//     void testFindByDoctorId() {
//         // Given
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .build();
//         appointmentRepository.save(appointment);

//         // When
//         List<Appointment> found = appointmentRepository.findByDoctorId(doctor.getId());

//         // Then
//         assertThat(found).isNotEmpty();
//         assertThat(found.get(0).getDoctor().getId()).isEqualTo(doctor.getId());
//     }

//     @Test
//     @DisplayName("Test 4: Find appointment by work date")
//     void testFindByWorkDate() {
//         // Given
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .build();
//         appointmentRepository.save(appointment);

//         // When
//         List<Appointment> found = appointmentRepository.findByWorkDate(testDate);

//         // Then
//         assertThat(found).isNotEmpty();
//         assertThat(found.get(0).getWorkDate()).isEqualTo(testDate);
//     }

//     @Test
//     @DisplayName("Test 5: Check time slot conflict - doctor already booked")
//     void testDoctorTimeSlotConflict() {
//         // Given
//         Appointment existing = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(LocalTime.of(9, 0))
//                 .endTime(LocalTime.of(10, 0))
//                 .status("Scheduled")
//                 .build();
//         appointmentRepository.save(existing);

//         // When - Try to book overlapping time
//         boolean canCreate = appointmentRepository.canCreateAppointment(
//                 doctor.getId(),
//                 patient.getId(),
//                 testDate,
//                 LocalTime.of(9, 30),
//                 LocalTime.of(10, 30)
//         );

//         // Then
//         assertThat(canCreate).isFalse();
//     }

//     @Test
//     @DisplayName("Test 6: Check time slot conflict - patient already booked")
//     void testPatientTimeSlotConflict() {
//         // Given
//         Appointment existing = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(LocalTime.of(9, 0))
//                 .endTime(LocalTime.of(10, 0))
//                 .status("Scheduled")
//                 .build();
//         appointmentRepository.save(existing);

//         User anotherDoctor = User.builder()
//                 .username("doctor2")
//                 .email("doctor2@test.com")
//                 .password("password123")
//                 .phone(999999999)
//                 .build();
//         entityManager.persist(anotherDoctor);

//         // When - Same patient tries to book with another doctor at overlapping time
//         boolean canCreate = appointmentRepository.canCreateAppointment(
//                 anotherDoctor.getId(),
//                 patient.getId(),
//                 testDate,
//                 LocalTime.of(9, 30),
//                 LocalTime.of(10, 30)
//         );

//         // Then
//         assertThat(canCreate).isFalse();
//     }

//     @Test
//     @DisplayName("Test 7: Create appointment without doctor (service appointment)")
//     void testCreateServiceAppointment() {
//         // Given
//         Appointment serviceAppointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(null) // No doctor for service appointment
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .medicalExamnination(List.of(examination))
//                 .build();

//         // When
//         Appointment saved = appointmentRepository.save(serviceAppointment);

//         // Then
//         assertThat(saved.getId()).isNotNull();
//         assertThat(saved.getDoctor()).isNull();
//         assertThat(saved.getPatient()).isNotNull();
//     }

//     @Test
//     @DisplayName("Test 8: Parent-child appointment relationship")
//     void testParentChildAppointment() {
//         // Given - Create parent appointment
//         Appointment parentAppointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(LocalTime.of(10, 0))
//                 .endTime(LocalTime.of(10, 30))
//                 .status("Scheduled")
//                 .medicalExamnination(List.of(examination))
//                 .build();
//         Appointment savedParent = appointmentRepository.save(parentAppointment);

//         // Create child appointment (service)
//         Appointment childAppointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(null)
//                 .workDate(testDate)
//                 .startTime(LocalTime.of(9, 0))
//                 .endTime(LocalTime.of(9, 30))
//                 .status("Scheduled")
//                 .parentAppointment(savedParent)
//                 .build();
//         Appointment savedChild = appointmentRepository.save(childAppointment);

//         // When
//         Optional<Appointment> foundParent = appointmentRepository.findById(savedParent.getId());
//         Optional<Appointment> foundChild = appointmentRepository.findById(savedChild.getId());

//         // Then
//         assertThat(foundParent).isPresent();
//         assertThat(foundChild).isPresent();
//         assertThat(foundChild.get().getParentAppointment()).isNotNull();
//         assertThat(foundChild.get().getParentAppointment().getId()).isEqualTo(savedParent.getId());
//     }

//     @Test
//     @DisplayName("Test 9: Find appointments by date range")
//     void testFindByDateRange() {
//         // Given
//         LocalDate date1 = LocalDate.now().plusDays(1);
//         LocalDate date2 = LocalDate.now().plusDays(3);
//         LocalDate date3 = LocalDate.now().plusDays(5);

//         appointmentRepository.save(Appointment.builder()
//                 .patient(patient).doctor(doctor)
//                 .workDate(date1)
//                 .startTime(startTime).endTime(endTime)
//                 .status("Scheduled").build());

//         appointmentRepository.save(Appointment.builder()
//                 .patient(patient).doctor(doctor)
//                 .workDate(date2)
//                 .startTime(startTime).endTime(endTime)
//                 .status("Scheduled").build());

//         appointmentRepository.save(Appointment.builder()
//                 .patient(patient).doctor(doctor)
//                 .workDate(date3)
//                 .startTime(startTime).endTime(endTime)
//                 .status("Scheduled").build());

//         // When
//         List<Appointment> found = appointmentRepository.findByWorkDateBetween(date1, date3);

//         // Then
//         assertThat(found).hasSize(3);
//     }

//     @Test
//     @DisplayName("Test 10: Count appointments by doctor and date")
//     void testCountByDoctorAndDate() {
//         // Given
//         for (int i = 0; i < 3; i++) {
//             appointmentRepository.save(Appointment.builder()
//                     .patient(patient)
//                     .doctor(doctor)
//                     .workDate(testDate)
//                     .startTime(LocalTime.of(9 + i, 0))
//                     .endTime(LocalTime.of(9 + i, 30))
//                     .status("Scheduled")
//                     .build());
//         }

//         // When
//         long count = appointmentRepository.countByDoctorAndDate(doctor.getId(), testDate);

//         // Then
//         assertThat(count).isEqualTo(3);
//     }

//     @Test
//     @DisplayName("Test 11: Find upcoming appointments by patient")
//     void testFindUpcomingAppointmentsByPatient() {
//         // Given
//         LocalDate futureDate = LocalDate.now().plusDays(7);
//         LocalDate pastDate = LocalDate.now().minusDays(1);

//         appointmentRepository.save(Appointment.builder()
//                 .patient(patient).doctor(doctor)
//                 .workDate(futureDate)
//                 .startTime(startTime).endTime(endTime)
//                 .status("Scheduled").build());

//         appointmentRepository.save(Appointment.builder()
//                 .patient(patient).doctor(doctor)
//                 .workDate(pastDate)
//                 .startTime(startTime).endTime(endTime)
//                 .status("Completed").build());

//         // When
//         List<Appointment> upcoming = appointmentRepository.findUpcomingAppointmentsByPatient(patient.getId());

//         // Then
//         assertThat(upcoming).isNotEmpty();
//         assertThat(upcoming.get(0).getWorkDate()).isAfterOrEqualTo(LocalDate.now());
//     }

//     @Test
//     @DisplayName("Test 12: Find past appointments by doctor")
//     void testFindPastAppointmentsByDoctor() {
//         // Given
//         LocalDate pastDate = LocalDate.now().minusDays(7);

//         appointmentRepository.save(Appointment.builder()
//                 .patient(patient).doctor(doctor)
//                 .workDate(pastDate)
//                 .startTime(startTime).endTime(endTime)
//                 .status("Completed").build());

//         // When
//         List<Appointment> past = appointmentRepository.findPastAppointmentsByDoctor(doctor.getId());

//         // Then
//         assertThat(past).isNotEmpty();
//         assertThat(past.get(0).getWorkDate()).isBefore(LocalDate.now());
//     }

//     @Test
//     @DisplayName("Test 13: Update appointment status")
//     void testUpdateAppointmentStatus() {
//         // Given
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .build();
//         Appointment saved = appointmentRepository.save(appointment);

//         // When
//         saved.setStatus("Completed");
//         Appointment updated = appointmentRepository.save(saved);

//         // Then
//         assertThat(updated.getStatus()).isEqualTo("Completed");
//     }

//     @Test
//     @DisplayName("Test 14: Delete appointment by ID")
//     void testDeleteAppointment() {
//         // Given
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(doctor)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .build();
//         Appointment saved = appointmentRepository.save(appointment);

//         // When
//         appointmentRepository.deleteById(saved.getId());

//         // Then
//         Optional<Appointment> found = appointmentRepository.findById(saved.getId());
//         assertThat(found).isEmpty();
//     }

//     @Test
//     @DisplayName("Test 15: Assign doctor to appointment")
//     void testAssignDoctorToAppointment() {
//         // Given - Create appointment without doctor
//         Appointment appointment = Appointment.builder()
//                 .patient(patient)
//                 .doctor(null)
//                 .workDate(testDate)
//                 .startTime(startTime)
//                 .endTime(endTime)
//                 .status("Scheduled")
//                 .build();
//         Appointment saved = appointmentRepository.save(appointment);

//         // When - Assign doctor
//         int updated = appointmentRepository.assignDoctorToAppointment(saved.getId(), doctor.getId());

//         // Then
//         assertThat(updated).isEqualTo(1);
//         Optional<Appointment> found = appointmentRepository.findById(saved.getId());
//         assertThat(found).isPresent();
//         assertThat(found.get().getDoctor()).isNotNull();
//         assertThat(found.get().getDoctor().getId()).isEqualTo(doctor.getId());
//     }
// }
