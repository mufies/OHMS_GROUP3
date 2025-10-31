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
import com.example.ohms.enums.PaymentStatus;
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
    MedicleExaminatioRepository medicleExaminatioRepository;
    RoomChatService roomChatService; // Thêm RoomChatService
    MailService mailService; // Thêm MailService để gửi email
    
    // Tạo appointment mới
    public AppointmentResponse createAppointment(AppointmentRequest request) {
        log.info("Creating appointment for patient: {} with doctor: {}", request.getPatientId(), request.getDoctorId());
        
        // Kiểm tra conflict
        if(request.getParentAppointmentId()== null)
        {
        log.info("Checking appointment conflict: doctorId={}, patientId={}, date={}, time={}-{}", 
                 request.getDoctorId(), request.getPatientId(), request.getWorkDate(), 
                 request.getStartTime(), request.getEndTime());
        
        boolean canCreate = appointmentRepository.canCreateAppointment(
            request.getDoctorId(),
            request.getPatientId(),
            request.getWorkDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (!canCreate) {
            // Log existing appointments để debug
            List<Appointment> existingAppointments = appointmentRepository.findByDoctorAndDateWithPatientDetails(
                request.getDoctorId(), request.getWorkDate()
            );
            log.error("❌ CONFLICT DETECTED!");
            log.error("Existing appointments for DOCTOR {} on {}:", request.getDoctorId(), request.getWorkDate());
            if (existingAppointments.isEmpty()) {
                log.error("  - (No doctor appointments found)");
            } else {
                for (Appointment apt : existingAppointments) {
                    log.error("  - ID: {}, Time: {}-{}, Patient: {}", 
                             apt.getId(), apt.getStartTime(), apt.getEndTime(), apt.getPatient().getUsername());
                }
            }
            
            List<Appointment> patientAppointments = appointmentRepository.findByPatientAndDate(
                request.getPatientId(), request.getWorkDate()
            );
            log.error("Existing appointments for PATIENT {} on {}:", request.getPatientId(), request.getWorkDate());
            if (patientAppointments.isEmpty()) {
                log.error("  - (No patient appointments found)");
            } else {
                for (Appointment apt : patientAppointments) {
                    log.error("  - ID: {}, Time: {}-{}, Doctor: {}", 
                             apt.getId(), apt.getStartTime(), apt.getEndTime(), 
                             apt.getDoctor() != null ? apt.getDoctor().getUsername() : "NULL");
                }
            }
            
            // Thêm query thủ công để xem appointment nào đang match
            log.error("Running manual overlap check for NEW appointment: {}-{}", request.getStartTime(), request.getEndTime());
            List<Appointment> allAppointments = appointmentRepository.findByWorkDate(request.getWorkDate());
            for (Appointment apt : allAppointments) {
                boolean doctorMatch = apt.getDoctor() != null && apt.getDoctor().getId().equals(request.getDoctorId());
                boolean patientMatch = apt.getPatient().getId().equals(request.getPatientId());
                
                if (doctorMatch || patientMatch) {
                    boolean overlap = request.getStartTime().isBefore(apt.getEndTime()) && 
                                    request.getEndTime().isAfter(apt.getStartTime());
                    log.error("  - Appointment {}: Time {}-{}, Doctor={}, Patient={}, Overlap={}", 
                             apt.getId(), apt.getStartTime(), apt.getEndTime(),
                             doctorMatch ? "MATCH" : "no", patientMatch ? "MATCH" : "no", overlap);
                }
            }
            
            throw new RuntimeException("Time slot already booked for doctor or patient!");
        }
        
        log.info("✅ No conflict, proceeding with appointment creation");
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
        
            // Xử lý parent appointment nếu có
            Appointment parentAppointment = null;
            if (request.getParentAppointmentId() != null && !request.getParentAppointmentId().isBlank()) {
                log.info("This is a service appointment with parent id: {}", request.getParentAppointmentId());
                parentAppointment = appointmentRepository.findById(request.getParentAppointmentId())
                    .orElseThrow(() -> new RuntimeException("Parent appointment not found with id: " + request.getParentAppointmentId()));
            }
        
        // Tạo appointment entity
        Appointment appointment = Appointment.builder()
            .doctor(doctor)
            .patient(patient)
            .workDate(request.getWorkDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .status("Schedule")
            .parentAppointment(parentAppointment)
            .discount(request.getDiscount() != null ? request.getDiscount() : 0)
            .deposit(request.getDeposit())
            .depositStatus(request.getDepositStatus() != null ? 
                PaymentStatus.valueOf(request.getDepositStatus()) : PaymentStatus.PENDING)
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

        // Kiểm tra nếu có dịch vụ "Tư vấn online" thì tạo chat room
        if (request.getMedicalExaminationIds() != null && !request.getMedicalExaminationIds().isEmpty()) {
            log.info("tao chat rom");
            boolean isOnlineConsult = request.getMedicalExaminationIds().stream()
                .anyMatch(id -> {
                    Optional<MedicalExamination> exam = medicleExaminatioRepository.findById(id);
                    return exam.isPresent() && "Tư vấn online".equals(exam.get().getName());
                });
            
            if (isOnlineConsult && request.getDoctorId() != null && !request.getDoctorId().isBlank()) {
                try {
                    // Tạo chat room cho patient và doctor
                    com.example.ohms.dto.request.RoomChatRequest roomChatRequest = 
                        com.example.ohms.dto.request.RoomChatRequest.builder()
                            .user(Set.of(request.getPatientId(), request.getDoctorId()))
                            .build();
                    
                    roomChatService.createRoomChat(roomChatRequest);
                    
                    log.info("✅ Chat room created for online consultation appointment: {}", savedAppointment.getId());
                } catch (Exception e) {
                    log.error("❌ Failed to create chat room for appointment: {}", savedAppointment.getId(), e);
                    // Không throw exception để không rollback appointment
                }
            }
        }
        
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
    
    // Lấy appointment của patient theo ngày cụ thể
    public List<AppointmentResponse> getPatientAppointmentsByDate(String patientId, LocalDate date) {
        log.info("Getting appointments for patient: {} on date: {}", patientId, date);
        
        List<Appointment> appointments = appointmentRepository.findByPatientAndDate(patientId, date);
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

        // boolean canUpdate = true;

        // if(request.getParentAppointmentId()== null)
        // {
        // canUpdate = appointmentRepository.canCreateAppointment(
        //     appointment.getDoctor().getId(),
        //     appointment.getPatient().getId(),
        //     request.getWorkDate(),
        //     request.getStartTime(),
        //     request.getEndTime()
        // );
        // }

        
        // if (!canUpdate) {
        //     throw new RuntimeException("New time slot conflicts with existing appointments!");
        // }
        
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
    
    // Update appointment status
    public AppointmentResponse updateAppointmentStatus(String appointmentId, String status) {
        log.info("Updating status of appointment {} to {}", appointmentId, status);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
        
        appointment.setStatus(status);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        log.info("Appointment status updated successfully: {} -> {}", appointmentId, status);
        return toAppointmentResponse(updatedAppointment);
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
    public AppointmentResponse toAppointmentResponse(Appointment appointment) {
        if (appointment == null) {
            return null;
        }
        
        AppointmentResponse.AppointmentResponseBuilder builder = AppointmentResponse.builder()
            .id(appointment.getId())
            .workDate(appointment.getWorkDate())
            .startTime(appointment.getStartTime())
            .endTime(appointment.getEndTime())
            .status(appointment.getStatus())
            .discount(appointment.getDiscount())
            .deposit(appointment.getDeposit())
            .depositStatus(appointment.getDepositStatus() != null ? 
                appointment.getDepositStatus().name() : null)
            .cancelTime(appointment.getCancelTime());
        
        // Map patient info
        if (appointment.getPatient() != null) {
            User patient = appointment.getPatient();
            builder.patientId(patient.getId())
                   .patientName(patient.getUsername())
                   .patientEmail(patient.getEmail())
                   .patientPhone(patient.getPhone() != null ? patient.getPhone().toString() : null)
                   .patientBankName(patient.getBankName())
                   .patientBankNumber(patient.getBankNumber());
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
                    .minDuration(exam.getMinDuration()) // Map minDuration
                    .build())
                .collect(Collectors.toList());
            builder.medicalExaminations(examInfos);
        }
        
        // Map parent appointment ID
        if (appointment.getParentAppointment() != null) {
            builder.parentAppointmentId(appointment.getParentAppointment().getId());
        }
        
        // Map service appointments (nếu là appointment chính)
        if (appointment.getServiceAppointments() != null && !appointment.getServiceAppointments().isEmpty()) {
            List<AppointmentResponse.ServiceAppointmentInfo> serviceInfos = appointment.getServiceAppointments()
                .stream()
                .map(serviceAppt -> {
                    // Map medical examinations của service appointment
                    List<AppointmentResponse.MedicalExaminationInfo> serviceExamInfos = null;
                    if (serviceAppt.getMedicalExamnination() != null && !serviceAppt.getMedicalExamnination().isEmpty()) {
                        serviceExamInfos = serviceAppt.getMedicalExamnination()
                            .stream()
                            .map(exam -> AppointmentResponse.MedicalExaminationInfo.builder()
                                .id(exam.getId())
                                .name(exam.getName())
                                .price(exam.getPrice())
                                .minDuration(exam.getMinDuration()) // Map minDuration for service appointments
                                .build())
                            .collect(Collectors.toList());
                    }
                    
                    return AppointmentResponse.ServiceAppointmentInfo.builder()
                        .id(serviceAppt.getId())
                        .startTime(serviceAppt.getStartTime())
                        .endTime(serviceAppt.getEndTime())
                        .status(serviceAppt.getStatus())
                        .medicalExaminations(serviceExamInfos)
                        .build();
                })
                .collect(Collectors.toList());
            builder.serviceAppointments(serviceInfos);
        }
        
        return builder.build();
    }

    // Update medical examinations for appointment - ADD only, don't remove existing ones
    public AppointmentResponse updateAppointmentMedicalExaminations(String appointmentId, List<String> medicalExaminationIds) {
        log.info("Adding medical examinations to appointment: {}", appointmentId);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
        
        // Get existing medical examinations list
        List<MedicalExamination> existingExams = appointment.getMedicalExamnination();
        if (existingExams == null) {
            existingExams = new ArrayList<>();
            appointment.setMedicalExamnination(existingExams);
        }
        
        // Add new medical examinations (only if not already present)
        if (medicalExaminationIds != null && !medicalExaminationIds.isEmpty()) {
            for (String examId : medicalExaminationIds) {
                // Check if already exists
                boolean alreadyExists = existingExams.stream()
                    .anyMatch(exam -> exam.getId().equals(examId));
                
                if (!alreadyExists) {
                    MedicalExamination examination = medicleExaminatioRepository.findById(examId)
                        .orElseThrow(() -> new RuntimeException("Medical examination not found: " + examId));
                    existingExams.add(examination);
                    log.info("Added medical examination {} to appointment {}", examination.getName(), appointmentId);
                }
            }
            
            log.info("Total {} medical examinations for appointment: {}", existingExams.size(), appointmentId);
        }
        
        appointmentRepository.save(appointment);
        return toAppointmentResponse(appointment);
    }
    
    // Helper: Tính tổng giá của các medical examinations
    public int calculateTotalPrice(List<String> medicalExaminationIds) {
        if (medicalExaminationIds == null || medicalExaminationIds.isEmpty()) {
            return 0;
        }
        
        return medicalExaminationIds.stream()
            .map(id -> medicleExaminatioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical examination not found: " + id)))
            .mapToInt(MedicalExamination::getPrice)
            .sum();
    }
    
    // Helper: Tính deposit (50% tổng giá)
    public int calculateDeposit(int totalPrice) {
        return totalPrice / 2;
    }
    
    // Helper: Tính giá sau discount
    public int calculatePriceAfterDiscount(int totalPrice, int discountPercent) {
        if (discountPercent <= 0 || discountPercent > 100) {
            return totalPrice;
        }
        return totalPrice - (totalPrice * discountPercent / 100);
    }
    
    // Cancel appointment and set cancel date
    public AppointmentResponse cancelAppointment(String appointmentId) {
        log.info("Cancelling appointment: {}", appointmentId);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
        
        // Update status to Cancelled
        appointment.setStatus("CANCELLED");
        
        // Set cancel date to current date
        appointment.setCancelTime(new java.sql.Date(System.currentTimeMillis()));
        
        Appointment cancelledAppointment = appointmentRepository.save(appointment);
        log.info("Appointment cancelled successfully: {}", appointmentId);
        
        return toAppointmentResponse(cancelledAppointment);
    }
    
    // Get all cancelled appointments with deposit info
    public List<AppointmentResponse> getCancelledAppointmentsWithDeposit() {
        log.info("Getting all cancelled appointments with deposit");
        
        List<Appointment> cancelledAppointments = appointmentRepository
            .findAll()
            .stream()
            .filter(apt -> "CANCELLED".equals(apt.getStatus()) && apt.getCancelTime() != null)
            .collect(Collectors.toList());
        
        return cancelledAppointments.stream()
            .map(this::toAppointmentResponse)
            .collect(Collectors.toList());
    }
    
    // Confirm refund - change deposit to negative value (refunded amount)
    public AppointmentResponse confirmRefund(String appointmentId, Double refundAmount) {
        log.info("Confirming refund for appointment: {} with amount: {}", appointmentId, refundAmount);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + appointmentId));
        
        // Check if already cancelled
        if (!"CANCELLED".equals(appointment.getStatus())) {
            throw new RuntimeException("Appointment is not cancelled");
        }
        
        // Update deposit to negative value (represents refunded amount)
        appointment.setDeposit(-refundAmount.intValue());
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        log.info("Refund confirmed successfully for appointment: {}", appointmentId);
        
        return toAppointmentResponse(updatedAppointment);
    }

    /**
     * Tìm appointments có doctorId = null trong khoảng thời gian cụ thể
     * Dùng để auto-assign khi tạo schedule mới
     * @param workDate Ngày
     * @param startTime Giờ bắt đầu
     * @param endTime Giờ kết thúc
     * @return Danh sách appointments chưa có doctor
     */
    public List<AppointmentResponse> getUnassignedAppointments(LocalDate workDate, LocalTime startTime, LocalTime endTime) {
        log.info("Getting unassigned appointments for date: {} time: {}-{}", workDate, startTime, endTime);
        
        List<Appointment> appointments = appointmentRepository.findUnassignedAppointmentsByDateAndTime(
            workDate, startTime, endTime
        );
        
        return appointments.stream()
            .map(this::toAppointmentResponse)
            .collect(Collectors.toList());
    }

    /**
     * Xử lý khi schedule bị thay đổi (edit hoặc delete)
     * - Chỉ unassign appointments NGOÀI time range MỚI
     * - Appointments vẫn TRONG time range MỚI thì giữ nguyên
     * - Gửi email thông báo cho patients bị unassign
     * @param doctorId ID của doctor
     * @param workDate Ngày
     * @param oldStartTime Giờ bắt đầu cũ
     * @param oldEndTime Giờ kết thúc cũ
     * @param newStartTime Giờ bắt đầu mới (null nếu delete schedule)
     * @param newEndTime Giờ kết thúc mới (null nếu delete schedule)
     * @return Số lượng appointments bị ảnh hưởng
     */
    public int handleScheduleChange(String doctorId, LocalDate workDate, 
                                   LocalTime oldStartTime, LocalTime oldEndTime,
                                   LocalTime newStartTime, LocalTime newEndTime) {
        log.info("Handling schedule change for doctor: {} on date: {} OLD: {}-{} NEW: {}-{}", 
                 doctorId, workDate, oldStartTime, oldEndTime, newStartTime, newEndTime);
        
        // 1. Lấy danh sách appointments trong OLD time range
        List<Appointment> appointmentsInOldRange = appointmentRepository.findAffectedAppointments(
            doctorId, workDate, oldStartTime, oldEndTime
        );
        
        if (appointmentsInOldRange.isEmpty()) {
            log.info("No appointments in old time range");
            return 0;
        }
        
        // 2. Filter: Chỉ unassign appointments NGOÀI NEW time range
        List<Appointment> appointmentsToUnassign = new ArrayList<>();
        
        for (Appointment apt : appointmentsInOldRange) {
            boolean isOutsideNewRange = false;
            
            // Nếu delete schedule (newStartTime = null) → unassign tất cả
            if (newStartTime == null || newEndTime == null) {
                isOutsideNewRange = true;
            } else {
                // Check nếu appointment NGOÀI khoảng NEW time range
                // Appointment ngoài nếu: endTime <= newStartTime hoặc startTime >= newEndTime
                if (apt.getEndTime().isBefore(newStartTime) || apt.getEndTime().equals(newStartTime) ||
                    apt.getStartTime().isAfter(newEndTime) || apt.getStartTime().equals(newEndTime)) {
                    isOutsideNewRange = true;
                }
            }
            
            if (isOutsideNewRange) {
                appointmentsToUnassign.add(apt);
            }
        }
        
        if (appointmentsToUnassign.isEmpty()) {
            log.info("All appointments still within new time range, no unassignment needed");
            return 0;
        }
        
        // 3. Unassign từng appointment
        User doctor = userRepository.findById(doctorId).orElse(null);
        String doctorName = doctor != null ? doctor.getUsername() : "Bác sĩ";
        int unassignedCount = 0;
        
        for (Appointment apt : appointmentsToUnassign) {
            try {
                // Unassign
                apt.setDoctor(null);
                appointmentRepository.save(apt);
                unassignedCount++;
                
                // Gửi email
                String emailContent = buildDoctorRemovedEmail(
                    apt.getPatient().getUsername(),
                    doctorName,
                    apt.getWorkDate(),
                    apt.getStartTime(),
                    apt.getEndTime(),
                    apt.getId()
                );
                
                mailService.sendMail(
                    apt.getPatient().getEmail(), 
                    "⚠️ Thông báo thay đổi lịch hẹn - OHMS", 
                    emailContent
                );
                
                log.info("Unassigned and sent email for appointment: {} (time: {}-{})", 
                         apt.getId(), apt.getStartTime(), apt.getEndTime());
            } catch (Exception e) {
                log.error("Failed to unassign/email appointment: {}", apt.getId(), e);
            }
        }
        
        log.info("Unassigned {} appointments (out of {} in old range)", 
                 unassignedCount, appointmentsInOldRange.size());
        return unassignedCount;
    }
    
    /**
     * Overload method cho delete schedule (không có new time)
     */
    public int handleScheduleChange(String doctorId, LocalDate workDate, 
                                   LocalTime oldStartTime, LocalTime oldEndTime) {
        return handleScheduleChange(doctorId, workDate, oldStartTime, oldEndTime, null, null);
    }

    /**
     * Auto-assign appointments với doctorId = null khi tạo schedule mới
     * - Tìm appointments trong time range + cùng specialty
     * - Assign doctor vào
     * - Gửi email thông báo
     * @param doctorId ID của doctor mới
     * @param workDate Ngày
     * @param startTime Giờ bắt đầu
     * @param endTime Giờ kết thúc
     * @return Số lượng appointments được assign
     */
    public int autoAssignAppointmentsOnScheduleCreate(String doctorId, LocalDate workDate, 
                                                      LocalTime startTime, LocalTime endTime) {
        log.info("Auto-assigning appointments for new schedule: doctor={} date={} time={}-{}", 
                 doctorId, workDate, startTime, endTime);
        
        // 1. Lấy doctor info để check specialty
        User doctor = userRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));
        
        if (doctor.getMedicleSpecially() == null || doctor.getMedicleSpecially().isEmpty()) {
            log.warn("Doctor {} has no specialty, cannot auto-assign", doctorId);
            return 0;
        }
        
        // 2. Tìm appointments chưa có doctor trong time range
        List<Appointment> unassignedAppointments = appointmentRepository
            .findUnassignedAppointmentsByDateAndTime(workDate, startTime, endTime);
        
        if (unassignedAppointments.isEmpty()) {
            log.info("No unassigned appointments found");
            return 0;
        }
        
        int assignedCount = 0;
        
        // 3. Filter theo specialty và assign
        for (Appointment apt : unassignedAppointments) {
            // Check nếu appointment cần specialty phù hợp
            // (Giả sử appointment lưu specialty trong medicalExamination hoặc có trường riêng)
            // Tạm thời assign tất cả appointments trong time range
            
            try {
                assignDoctorToAppointment(apt.getId(), doctorId);
                assignedCount++;
                
                // 4. Gửi email thông báo
                String emailContent = buildDoctorAssignedEmail(
                    apt.getPatient().getUsername(),
                    doctor.getUsername(),
                    apt.getWorkDate(),
                    apt.getStartTime(),
                    apt.getEndTime(),
                    apt.getId().toString()
                );
                
                mailService.sendMail(
                    apt.getPatient().getEmail(),
                    "✅ Thông báo đã có bác sĩ cho lịch hẹn - OHMS",
                    emailContent
                );
                
                log.info("Assigned doctor {} to appointment {} and sent email to {}", 
                         doctorId, apt.getId(), apt.getPatient().getEmail());
            } catch (Exception e) {
                log.error("Failed to assign doctor to appointment: {}", apt.getId(), e);
            }
        }
        
        log.info("Auto-assigned {} appointments to doctor {}", assignedCount, doctorId);
        return assignedCount;
    }

    /**
     * Email template khi doctor bị remove khỏi appointment
     */
    private String buildDoctorRemovedEmail(String patientName, String doctorName,
                                      LocalDate date, LocalTime startTime, LocalTime endTime,
                                      String appointmentId) {
    return String.format("""
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #d32f2f; margin-top: 0; font-size: 24px;">
                        ⚠️ Thông báo thay đổi lịch hẹn
                    </h2>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                        Kính gửi <strong>%s</strong>,
                    </p>
                    
                    <p style="font-size: 15px; margin-bottom: 20px;">
                        Chúng tôi xin thông báo rằng lịch hẹn của bạn đã bị thay đổi do bác sĩ <strong>%s</strong> 
                        đã điều chỉnh lịch làm việc.
                    </p>
                    
                    <div style="background-color: #fff3f3; padding: 20px; border-left: 4px solid #d32f2f; 
                                margin: 25px 0; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #d32f2f; font-size: 18px;">
                            Thông tin lịch hẹn bị ảnh hưởng:
                        </h3>
                        <ul style="list-style: none; padding: 0; margin: 10px 0;">
                            <li style="padding: 8px 0; font-size: 15px;">
                                <strong>Ngày:</strong> %s
                            </li>
                            <li style="padding: 8px 0; font-size: 15px;">
                                <strong>Giờ:</strong> %s - %s
                            </li>
                            <li style="padding: 8px 0; font-size: 15px;">
                                <strong>Bác sĩ:</strong> %s (đã bị hủy)
                            </li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 16px; margin: 25px 0 15px 0; font-weight: bold;">
                        Bạn có các lựa chọn sau:
                    </p>
                    
                    <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px 0;">
                                <a href="http://localhost:5173/appointments/%s/choose-doctor" 
                                   style="display: block; padding: 15px 20px; background-color: #4CAF50; color: white; 
                                          text-decoration: none; border-radius: 8px; text-align: center; font-weight: bold;
                                          font-size: 15px;">
                                    ✅ Chọn bác sĩ khác
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0;">
                                <a href="http://localhost:5173/appointments/%s/reschedule" 
                                   style="display: block; padding: 15px 20px; background-color: #2196F3; color: white; 
                                          text-decoration: none; border-radius: 8px; text-align: center; font-weight: bold;
                                          font-size: 15px;">
                                    📅 Chọn lịch mới
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0;">
                                <a href="http://localhost:5173/appointments/%s/refund" 
                                   style="display: block; padding: 15px 20px; background-color: #FF9800; color: white; 
                                          text-decoration: none; border-radius: 8px; text-align: center; font-weight: bold;
                                          font-size: 15px;">
                                    💰 Hủy và hoàn tiền
                                </a>
                            </td>
                        </tr>
                    </table>
                    
                    <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 25px 0;">
                        <p style="color: #1976d2; font-size: 14px; margin: 0;">
                            ⏰ <strong>Lưu ý:</strong> Nếu bạn không thực hiện lựa chọn trong vòng 24 giờ, 
                            hệ thống sẽ tự động tìm bác sĩ thay thế phù hợp.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                    
                    <div style="color: #666; font-size: 13px; line-height: 1.8;">
                        <p style="margin: 5px 0;">Trân trọng,</p>
                        <p style="margin: 5px 0; font-weight: bold; color: #333;">OHMS Healthcare System</p>
                        <p style="margin: 5px 0;">
                            Email: <a href="mailto:support@ohms.com" style="color: #2196F3;">support@ohms.com</a> | 
                            Hotline: 1900-xxxx
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """,
        patientName, doctorName,
        date, startTime, endTime, doctorName,
        appointmentId, appointmentId, appointmentId
    );
}

    /**
     * Email template khi được assign doctor mới
     */
    private String buildDoctorAssignedEmail(String patientName, String doctorName,
                                           LocalDate date, LocalTime startTime, LocalTime endTime,
                                           String appointmentId) {
        return String.format("""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <h2 style="color: #4CAF50;">✅ Thông báo đã có bác sĩ cho lịch hẹn</h2>
                    
                    <p>Kính gửi <strong>%s</strong>,</p>
                    
                    <p>Chúng tôi vui mừng thông báo rằng lịch hẹn của bạn đã được sắp xếp bác sĩ thành công!</p>
                    
                    <div style="background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Thông tin lịch hẹn:</h3>
                        <ul>
                            <li><strong>Bác sĩ:</strong> BS. %s</li>
                            <li><strong>Ngày:</strong> %s</li>
                            <li><strong>Giờ:</strong> %s - %s</li>
                        </ul>
                    </div>
                    
                    <p>Vui lòng đến đúng giờ hẹn. Nếu cần thay đổi, vui lòng liên hệ trước ít nhất 24 giờ.</p>
                    
                    <div style="margin: 20px 0;">
                        <a href="http://localhost:5173/appointments/%s" 
                           style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; 
                                  text-decoration: none; border-radius: 5px;">
                            Xem chi tiết lịch hẹn
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="color: #666; font-size: 12px;">
                        Trân trọng,<br>
                        <strong>OHMS Healthcare System</strong><br>
                        Email: support@ohms.com | Hotline: 1900-xxxx
                    </p>
                </div>
            </body>
            </html>
            """,
            patientName, doctorName, date, startTime, endTime, appointmentId
        );
    }
}