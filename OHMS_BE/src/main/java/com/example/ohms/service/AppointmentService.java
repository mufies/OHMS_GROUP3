package com.example.ohms.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ohms.dto.request.AppointmentRequest;
import com.example.ohms.dto.response.AppointmentResponse;
import com.example.ohms.entity.Appointment;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.User;
import com.example.ohms.repository.AppointmentRepository;
import com.example.ohms.repository.MedicleExaminatioRepository;
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
public class AppointmentService {
    
    AppointmentRepository appointmentRepository;
    UserRepository userRepository;
    MedicleExaminatioRepository medicleExaminatioRepository; // Thêm dependency
    
    // Tạo appointment mới
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        log.info("Creating appointment for patient: {} with doctor: {}", request.getPatientId(), request.getDoctorId());
        
        // Kiểm tra conflict
        boolean canCreate = appointmentRepository.canCreateAppointment(
            request.getDoctorId(),
            request.getPatientId(),
            request.getWorkDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (!canCreate) {
            throw new RuntimeException("Time slot already booked for doctor or patient!");
        }
        
        // Lấy thông tin doctor và patient
        User doctor = null; // Khởi tạo doctor là null
        if (request.getDoctorId() != null && !request.getDoctorId().isBlank()) {
            log.info("Assigning doctor with id: {}", request.getDoctorId());
            doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + request.getDoctorId()));
        }
        User patient = userRepository.findById(request.getPatientId())
            .orElseThrow(() -> new RuntimeException("Patient not found with id: " + request.getPatientId()));
        
        // Tạo appointment entity
        Appointment appointment = Appointment.builder()
            .doctor(doctor)
            .patient(patient)
            .workDate(request.getWorkDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .status("Schedule")
            .build();
        
        // Handle medical examinations nếu có trong request
        if (request.getMedicalExaminationIds() != null && !request.getMedicalExaminationIds().isEmpty()) {
            List<MedicalExamination> medicalExaminations = new ArrayList<>();
            
            for (String examId : request.getMedicalExaminationIds()) {
                MedicalExamination examination = medicleExaminatioRepository.findById(examId)
                    .orElseThrow(() -> new RuntimeException("Medical examination not found: " + examId));
                medicalExaminations.add(examination);
            }
            
            // Set medical examinations - JPA sẽ tự tạo records trong bảng junction
            appointment.setMedicalExamnination(medicalExaminations);
            log.info("Added {} medical examinations to appointment", medicalExaminations.size());
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment created successfully with id: {}", savedAppointment.getId());


        
        return toAppointmentResponse(savedAppointment);
    }
    
    // Lấy appointment theo ID
    public AppointmentResponse getAppointmentById(String appointmentId) {
        log.info("Getting appointment by id: {}", appointmentId);
        
        Optional<Appointment> appointment = appointmentRepository.findByIdWithDetails(appointmentId);
        return appointment.map(this::toAppointmentResponse)
                         .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
    }
    
    // Lấy danh sách appointment của patient
    public List<AppointmentResponse> getAppointmentsByPatient(String patientId) {
        log.info("Getting appointments for patient: {}", patientId);
        
        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Lấy danh sách appointment của doctor
    public List<AppointmentResponse> getAppointmentsByDoctor(String doctorId) {
        log.info("Getting appointments for doctor: {}", doctorId);
        
        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Lấy appointment hôm nay của doctor
    public List<AppointmentResponse> getTodayAppointmentsByDoctor(String doctorId) {
        log.info("Getting today's appointments for doctor: {}", doctorId);
        
        List<Appointment> appointments = appointmentRepository.findTodayAppointmentsByDoctor(doctorId);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Lấy appointment sắp tới của patient
    public List<AppointmentResponse> getUpcomingAppointmentsByPatient(String patientId) {
        log.info("Getting upcoming appointments for patient: {}", patientId);
        
        List<Appointment> appointments = appointmentRepository.findUpcomingAppointmentsByPatient(patientId);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Lấy appointment sắp tới của doctor
    public List<AppointmentResponse> getUpcomingAppointmentsByDoctor(String doctorId) {
        log.info("Getting upcoming appointments for doctor: {}", doctorId);
        
        List<Appointment> appointments = appointmentRepository.findUpcomingAppointmentsByDoctor(doctorId);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Lấy appointment theo ngày
    public List<AppointmentResponse> getAppointmentsByDate(LocalDate date) {
        log.info("Getting appointments for date: {}", date);
        
        List<Appointment> appointments = appointmentRepository.findByWorkDate(date);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Lấy appointment của doctor theo ngày với thông tin patient
    public List<AppointmentResponse> getDoctorAppointmentsByDate(String doctorId, LocalDate date) {
        log.info("Getting appointments for doctor: {} on date: {}", doctorId, date);
        
        List<Appointment> appointments = appointmentRepository.findByDoctorAndDateWithPatientDetails(doctorId, date);
        return appointments.stream()
                          .map(this::toAppointmentResponse)
                          .collect(Collectors.toList());
    }
    
    // Cập nhật appointment
    public AppointmentResponse updateAppointment(String appointmentId, AppointmentRequest request) {
        log.info("Updating appointment: {}", appointmentId);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
        
        // Kiểm tra conflict với thời gian mới
        boolean canUpdate = appointmentRepository.canCreateAppointment(
            appointment.getDoctor().getId(),
            appointment.getPatient().getId(),
            request.getWorkDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (!canUpdate) {
            throw new RuntimeException("New time slot conflicts with existing appointments!");
        }
        
        // Update thông tin
        appointment.setWorkDate(request.getWorkDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        log.info("Appointment updated successfully: {}", appointmentId);
        
        return toAppointmentResponse(updatedAppointment);
    }
    
    // Xóa appointment
    public void deleteAppointment(String appointmentId) {
        log.info("Deleting appointment: {}", appointmentId);
        
        if (!appointmentRepository.existsById(appointmentId)) {
            throw new RuntimeException("Appointment not found with id: " + appointmentId);
        }
        
        appointmentRepository.deleteById(appointmentId);
        log.info("Appointment deleted successfully: {}", appointmentId);
    }

    // Assign doctor to appointment
    public void assignDoctorToAppointment(String appointmentId, String doctorId) {
        log.info("Assigning doctor {} to appointment {}", doctorId, appointmentId);

        // Check if appointment exists
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));

        // Check if doctor exists
        if (!userRepository.existsById(doctorId)) {
            throw new RuntimeException("Doctor not found with id: " + doctorId);
        }

        // // Check if appointment already has a doctor
        // if (appointment.getDoctor() != null) {
        //     throw new RuntimeException("Appointment already has a doctor assigned");
        // }

        // Assign doctor
        int updated = appointmentRepository.assignDoctorToAppointment(appointmentId, doctorId);
        if (updated == 0) {
            throw new RuntimeException("Failed to assign doctor to appointment");
        }

        log.info("Doctor {} assigned to appointment {} successfully", doctorId, appointmentId);
    }
    
    
    // // Lấy các khung giờ đã đặt
    // public List<String> getBookedTimeSlots(String doctorId, LocalDate date) {
    //     List<Object[]> timeSlots = appointmentRepository.findBookedTimeSlotsByDoctorAndDate(doctorId, date);
    //     return timeSlots.stream()
    //                    .map(slot -> slot[0] + " - " + slot[1])
    //                    .collect(Collectors.toList());
    // }
    
    // Convert Appointment entity sang AppointmentResponse
    private AppointmentResponse toAppointmentResponse(Appointment appointment) {
        if (appointment == null) {
            return null;
        }
        
        AppointmentResponse.AppointmentResponseBuilder builder = AppointmentResponse.builder()
            .id(appointment.getId())
            .workDate(appointment.getWorkDate())
            .startTime(appointment.getStartTime())
            .endTime(appointment.getEndTime())
            .status(appointment.getStatus()); // Default status
        
        // Map patient info
        if (appointment.getPatient() != null) {
            User patient = appointment.getPatient();
            builder.patientId(patient.getId())
                   .patientName(patient.getUsername())
                   .patientEmail(patient.getEmail())
                   .patientPhone(patient.getPhone() != null ? patient.getPhone().toString() : null);
        }
        
        // Map doctor info
        if (appointment.getDoctor() != null) {
            User doctor = appointment.getDoctor();
            builder.doctorId(doctor.getId())
                   .doctorName(doctor.getUsername());
            
            // Map specialty
            if (doctor.getMedicleSpecially() != null && !doctor.getMedicleSpecially().isEmpty()) {
                String specialties = doctor.getMedicleSpecially().toString();
                builder.doctorSpecialty(specialties);
            }
        }
        
        // Map medical examinations - Convert từ entity sang DTO
        if (appointment.getMedicalExamnination() != null && !appointment.getMedicalExamnination().isEmpty()) {
            List<AppointmentResponse.MedicalExaminationInfo> examInfos = appointment.getMedicalExamnination()
                .stream()
                .map(exam -> AppointmentResponse.MedicalExaminationInfo.builder()
                    .id(exam.getId())
                    .name(exam.getName())
                    .price(exam.getPrice())
                    .build())
                .collect(Collectors.toList());
            builder.medicalExaminations(examInfos);
        }
        
        return builder.build();
    }
}