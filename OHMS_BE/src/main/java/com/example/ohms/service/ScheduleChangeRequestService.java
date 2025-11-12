package com.example.ohms.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ohms.dto.request.ScheduleChangeRequestRequest;
import com.example.ohms.dto.request.ScheduleRequest;
import com.example.ohms.dto.response.ScheduleChangeRequestResponse;
import com.example.ohms.entity.ScheduleChangeRequest;
import com.example.ohms.entity.Schedule;
import com.example.ohms.entity.User;
import com.example.ohms.entity.ScheduleChangeRequest.RequestStatus;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.repository.ScheduleChangeRequestRepository;
import com.example.ohms.repository.ScheduleRepository;
import com.example.ohms.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class ScheduleChangeRequestService {
    ScheduleChangeRequestRepository scheduleChangeRequestRepository;
    UserRepository userRepository;
    ScheduleRepository scheduleRepository;
    ScheduleService scheduleService;
    ObjectMapper objectMapper;
    MailService mailService;

    // Tạo yêu cầu thay đổi lịch mới với conflict detection
    public ScheduleChangeRequestResponse createScheduleChangeRequest(ScheduleChangeRequestRequest request) {
        log.info("Creating schedule change request for doctor: {}", request.getTargetDoctorId());
        
        // Validate doctor exists
        userRepository.findById(request.getTargetDoctorId())
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Validate targetScheduleId nếu là UPDATE hoặc DELETE
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.UPDATE ||
            request.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
            
            if (request.getTargetScheduleId() == null || request.getTargetScheduleId().isEmpty()) {
                throw new AppException(ErrorCode.FIELD_NOT_NULL);
            }
            
            Schedule existingSchedule = scheduleRepository.findById(request.getTargetScheduleId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
            
            // Nếu là UPDATE, kiểm tra xem thời gian có thay đổi không
            if (request.getChangeType() == ScheduleChangeRequest.ChangeType.UPDATE) {
                if (existingSchedule.getStartTime().equals(request.getNewStartTime()) &&
                    existingSchedule.getEndTime().equals(request.getNewEndTime())) {
                    // Thời gian không thay đổi, không cần tạo request
                    throw new AppException(ErrorCode.NO_TIME_CHANGE);
                }
            }
        }
        
        // Chỉ check conflict nếu là CREATE
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.CREATE) {
            checkScheduleConflict(request, null);
            checkPendingRequestConflict(request, null);
        }
        
        ScheduleChangeRequest entity = new ScheduleChangeRequest();
        entity.setId(UUID.randomUUID().toString());
        entity.setChangeType(request.getChangeType());
        entity.setStatus(RequestStatus.PENDING);
        entity.setDateChange(request.getDateChange());
        entity.setDepartment(request.getDepartment());
        entity.setNewStartTime(request.getNewStartTime());
        entity.setNewEndTime(request.getNewEndTime());
        entity.setTargetDoctorId(request.getTargetDoctorId());
        entity.setTargetScheduleId(request.getTargetScheduleId());
        entity.setCreatedByStaffId(request.getCreatedByStaffId());
        entity.setReason(request.getReason());
        entity.setCreatedAt(LocalDate.now());
        entity.setUpdatedAt(LocalDate.now());
        
        // ← CHỈ DOCTOR NÀY CẦN APPROVE - không cần tất cả doctors trong ngày
        try {
            List<String> affectedDoctors = new ArrayList<>();
            affectedDoctors.add(request.getTargetDoctorId()); // ← CHỈ 1 DOCTOR
            
            entity.setAffectedDoctorIds(objectMapper.writeValueAsString(affectedDoctors));
            entity.setApprovedDoctorIds("[]");
        } catch (Exception e) {
            log.error("Error converting lists to JSON", e);
            throw new RuntimeException("Error converting lists to JSON", e);
        }
        
        scheduleChangeRequestRepository.save(entity);
        log.info("Schedule change request created with id: {}", entity.getId());
        
        // ← GỬI EMAIL CHỈ CHO 1 DOCTOR
        sendNotificationToDoctor(entity);
        
        return convertToResponse(entity);
    }
    
    // BULK CREATE/UPDATE/DELETE: Tạo nhiều requests độc lập
    @Transactional
    public List<ScheduleChangeRequestResponse> createBulkScheduleChangeRequest(ScheduleChangeRequestRequest request) {
        log.info("Creating bulk schedule change requests for {} doctors on date: {}", 
            request.getBulkSchedules() != null ? request.getBulkSchedules().size() : 0, 
            request.getDateChange());
        
        if (request.getBulkSchedules() == null || request.getBulkSchedules().isEmpty()) {
            throw new AppException(ErrorCode.FIELD_NOT_NULL);
        }
        
        // Validate tất cả doctors exist
        List<String> allDoctorIds = request.getBulkSchedules().stream()
            .map(ScheduleChangeRequestRequest.BulkScheduleItem::getDoctorId)
            .distinct()
            .collect(Collectors.toList());
            
        for (String doctorId : allDoctorIds) {
            userRepository.findById(doctorId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        }
        
        List<ScheduleChangeRequestResponse> responses = new ArrayList<>();
        
        // ← TẠO 1 REQUEST RIÊNG CHO MỖI DOCTOR
        for (ScheduleChangeRequestRequest.BulkScheduleItem item : request.getBulkSchedules()) {
            // Validate scheduleId nếu là UPDATE hoặc DELETE
            if (request.getChangeType() == ScheduleChangeRequest.ChangeType.UPDATE ||
                request.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
                
                if (item.getScheduleId() == null || item.getScheduleId().isEmpty()) {
                    throw new AppException(ErrorCode.FIELD_NOT_NULL);
                }
                
                Schedule existingSchedule = scheduleRepository.findById(item.getScheduleId())
                    .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
                
                // Nếu là UPDATE, kiểm tra xem thời gian có thay đổi không
                if (request.getChangeType() == ScheduleChangeRequest.ChangeType.UPDATE) {
                    if (existingSchedule.getStartTime().equals(item.getStartTime()) &&
                        existingSchedule.getEndTime().equals(item.getEndTime())) {
                        // Thời gian không thay đổi, skip doctor này
                        log.info("Skipping doctor {} - no time change detected", item.getDoctorId());
                        continue;
                    }
                }
            }
            
            // Chỉ check conflict nếu là CREATE
            if (request.getChangeType() == ScheduleChangeRequest.ChangeType.CREATE) {
                ScheduleChangeRequestRequest singleRequest = ScheduleChangeRequestRequest.builder()
                    .changeType(request.getChangeType())
                    .dateChange(request.getDateChange())
                    .department(request.getDepartment())
                    .newStartTime(item.getStartTime())
                    .newEndTime(item.getEndTime())
                    .targetDoctorId(item.getDoctorId())
                    .targetScheduleId(item.getScheduleId())
                    .createdByStaffId(request.getCreatedByStaffId())
                    .reason(request.getReason())
                    .build();
                
                checkScheduleConflict(singleRequest, null);
                checkPendingRequestConflict(singleRequest, null);
            }
            
            // Tạo entity
            ScheduleChangeRequest entity = new ScheduleChangeRequest();
            entity.setId(UUID.randomUUID().toString());
            entity.setChangeType(request.getChangeType());
            entity.setStatus(RequestStatus.PENDING);
            entity.setDateChange(request.getDateChange());
            entity.setDepartment(request.getDepartment());
            entity.setNewStartTime(item.getStartTime());
            entity.setNewEndTime(item.getEndTime());
            entity.setTargetDoctorId(item.getDoctorId());
            entity.setTargetScheduleId(item.getScheduleId());
            entity.setCreatedByStaffId(request.getCreatedByStaffId());
            entity.setReason(request.getReason() != null ? request.getReason() : 
                String.format("Bulk %s schedule for %s doctors", 
                    request.getChangeType(), request.getBulkSchedules().size()));
            entity.setCreatedAt(LocalDate.now());
            entity.setUpdatedAt(LocalDate.now());
            
            // ← CHỈ DOCTOR NÀY CẦN APPROVE
            try {
                List<String> affectedDoctors = new ArrayList<>();
                affectedDoctors.add(item.getDoctorId()); // ← CHỈ 1 DOCTOR
                
                entity.setAffectedDoctorIds(objectMapper.writeValueAsString(affectedDoctors));
                entity.setApprovedDoctorIds("[]");
            } catch (Exception e) {
                log.error("Error converting lists to JSON", e);
                throw new RuntimeException("Error converting lists to JSON", e);
            }
            
            scheduleChangeRequestRepository.save(entity);
            log.info("Schedule change request created with id: {} for doctor: {}", 
                entity.getId(), item.getDoctorId());
            
            // ← GỬI EMAIL CHO TỪNG DOCTOR RIÊNG LẺ
            sendNotificationToDoctor(entity);
            
            responses.add(convertToResponse(entity));
        }
        
        return responses;
    }
    
    // Kiểm tra conflict với Schedule hiện có (CHỈ cho CREATE)
    private void checkScheduleConflict(ScheduleChangeRequestRequest request, String excludeScheduleId) {
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
            return;
        }
        
        LocalDate workDate = LocalDate.parse(request.getDateChange());
        LocalTime newStartTime = request.getNewStartTime();
        LocalTime newEndTime = request.getNewEndTime();
        
        List<Schedule> existingSchedules = scheduleRepository.findByDoctor_IdAndWorkDate(
            request.getTargetDoctorId(),
            workDate
        );
        
        for (Schedule schedule : existingSchedules) {
            LocalTime existingStart = schedule.getStartTime();
            LocalTime existingEnd = schedule.getEndTime();
            
            if (isTimeOverlap(newStartTime, newEndTime, existingStart, existingEnd)) {
                throw new AppException(ErrorCode.SCHEDULE_CONFLICT);
            }
        }
        
        log.info("No schedule conflict detected");
    }
    
    // Kiểm tra conflict với các request đang pending
    private void checkPendingRequestConflict(ScheduleChangeRequestRequest request, String excludeRequestId) {
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
            return;
        }
        
        LocalTime newStartTime = request.getNewStartTime();
        LocalTime newEndTime = request.getNewEndTime();
        
        List<ScheduleChangeRequest> pendingRequests = scheduleChangeRequestRepository
            .findByTargetDoctorIdAndDateChangeAndStatus(
                request.getTargetDoctorId(),
                request.getDateChange(),
                RequestStatus.PENDING
            );
        
        for (ScheduleChangeRequest pendingRequest : pendingRequests) {
            if (excludeRequestId != null && pendingRequest.getId().equals(excludeRequestId)) {
                continue;
            }
            
            if (pendingRequest.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
                continue;
            }
            
            LocalTime existingStart = pendingRequest.getNewStartTime();
            LocalTime existingEnd = pendingRequest.getNewEndTime();
            
            if (isTimeOverlap(newStartTime, newEndTime, existingStart, existingEnd)) {
                throw new AppException(ErrorCode.PENDING_REQUEST_CONFLICT);
            }
        }
        
        log.info("No pending request conflict detected");
    }
    
    // Helper method kiểm tra trùng giờ
    private boolean isTimeOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return (start1.isBefore(end2) && end1.isAfter(start2));
    }
    
    // Update request với conflict detection
    public ScheduleChangeRequestResponse updateRequest(String requestId, ScheduleChangeRequestRequest request) {
        log.info("Updating schedule change request: {}", requestId);
        
        ScheduleChangeRequest entity = scheduleChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        
        if (entity.getStatus() != RequestStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        
        // Validate targetScheduleId nếu là UPDATE/DELETE
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.UPDATE ||
            request.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
            
            if (request.getTargetScheduleId() == null) {
                throw new AppException(ErrorCode.FIELD_NOT_NULL);
            }
            
            scheduleRepository.findById(request.getTargetScheduleId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
        }
        
        // Chỉ check conflict nếu là CREATE
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.CREATE) {
            checkScheduleConflict(request, null);
            checkPendingRequestConflict(request, requestId);
        }
        
        entity.setChangeType(request.getChangeType());
        entity.setDateChange(request.getDateChange());
        entity.setDepartment(request.getDepartment());
        entity.setNewStartTime(request.getNewStartTime());
        entity.setNewEndTime(request.getNewEndTime());
        entity.setTargetDoctorId(request.getTargetDoctorId());
        entity.setTargetScheduleId(request.getTargetScheduleId());
        entity.setReason(request.getReason());
        entity.setUpdatedAt(LocalDate.now());
        
        try {
            List<String> affectedDoctors = new ArrayList<>();
            affectedDoctors.add(request.getTargetDoctorId());
            
            entity.setAffectedDoctorIds(objectMapper.writeValueAsString(affectedDoctors));
            entity.setApprovedDoctorIds("[]");
        } catch (Exception e) {
            log.error("Error updating request", e);
            throw new RuntimeException("Error updating request", e);
        }
        
        scheduleChangeRequestRepository.save(entity);
        log.info("Schedule change request updated: {}", requestId);
        
        return convertToResponse(entity);
    }

    // Helper method to convert entity to response
    private ScheduleChangeRequestResponse convertToResponse(ScheduleChangeRequest entity) {
        ScheduleChangeRequestResponse response = new ScheduleChangeRequestResponse();
        response.setId(entity.getId());
        response.setChangeType(entity.getChangeType());
        response.setStatus(entity.getStatus());
        response.setDateChange(entity.getDateChange());
        response.setDepartment(entity.getDepartment());
        response.setNewStartTime(entity.getNewStartTime());
        response.setNewEndTime(entity.getNewEndTime());
        response.setTargetDoctorId(entity.getTargetDoctorId());
        response.setTargetScheduleId(entity.getTargetScheduleId());
        response.setCreatedByStaffId(entity.getCreatedByStaffId());
        response.setReason(entity.getReason());
        response.setRejectionNote(entity.getRejectionNote());
        response.setRejectedByDoctorId(entity.getRejectedByDoctorId());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        response.setProcessedAt(entity.getProcessedAt());
        
        try {
            if (entity.getAffectedDoctorIds() != null) {
                response.setAffectedDoctorIds(objectMapper.readValue(
                    entity.getAffectedDoctorIds(), 
                    new TypeReference<List<String>>() {}
                ));
            }
            if (entity.getApprovedDoctorIds() != null) {
                response.setApprovedDoctorIds(objectMapper.readValue(
                    entity.getApprovedDoctorIds(), 
                    new TypeReference<List<String>>() {}
                ));
            }
        } catch (Exception e) {
            log.error("Error parsing JSON", e);
        }
        
        return response;
    }
    
    // ← GỬI EMAIL CHO 1 DOCTOR DUY NHẤT
    private void sendNotificationToDoctor(ScheduleChangeRequest request) {
        try {
            User doctor = userRepository.findById(request.getTargetDoctorId()).orElse(null);
            if (doctor != null && doctor.getEmail() != null) {
                String changeTypeText = "";
                switch (request.getChangeType()) {
                    case CREATE:
                        changeTypeText = "tạo mới";
                        break;
                    case UPDATE:
                        changeTypeText = "cập nhật";
                        break;
                    case DELETE:
                        changeTypeText = "xóa";
                        break;
                }
                
                String subject = String.format("Yêu cầu %s lịch làm việc", changeTypeText);
                String body = String.format(
                    "Kính gửi BS. %s,\n\n" +
                    "Có một yêu cầu %s lịch làm việc cho bạn:\n" +
                    "- Ngày: %s\n" +
                    "- Khoa: %s\n" +
                    "- Thời gian: %s - %s\n" +
                    "- Lý do: %s\n\n" +
                    "Vui lòng đăng nhập hệ thống để xác nhận hoặc từ chối yêu cầu này.\n\n" +
                    "Trân trọng,\n" +
                    "Hệ thống OHMS",
                    doctor.getUsername(),
                    changeTypeText,
                    request.getDateChange(),
                    request.getDepartment(),
                    request.getNewStartTime(),
                    request.getNewEndTime(),
                    request.getReason() != null ? request.getReason() : "Không có"
                );
                
                mailService.sendMail(doctor.getEmail(), subject, body);
                log.info("Notification email sent to doctor: {}", doctor.getEmail());
            }
        } catch (Exception e) {
            log.error("Error sending notification email", e);
        }
    }

    public ScheduleChangeRequestResponse approveRequestByDoctor(String requestId, String doctorId) {
        log.info("Doctor {} approving schedule change request: {}", doctorId, requestId);
        
        ScheduleChangeRequest entity = scheduleChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        
        if (entity.getStatus() != RequestStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        
        if (!entity.getTargetDoctorId().equals(doctorId)) {
            log.error("Doctor {} tried to approve request for doctor {}", doctorId, entity.getTargetDoctorId());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        
        try {
            List<String> approvedList = objectMapper.readValue(
                entity.getApprovedDoctorIds(), 
                new TypeReference<List<String>>() {}
            );
            
            if (!approvedList.contains(doctorId)) {
                approvedList.add(doctorId);
                entity.setApprovedDoctorIds(objectMapper.writeValueAsString(approvedList));
            }
            
            List<String> affectedList = objectMapper.readValue(
                entity.getAffectedDoctorIds(), 
                new TypeReference<List<String>>() {}
            );
            
            log.info("Approved: {}/{}", approvedList.size(), affectedList.size());
            
            // ← CHỈ CẦN 1 DOCTOR APPROVE (vì affectedList chỉ có 1 doctor)
            if (approvedList.size() >= affectedList.size()) {
                entity.setStatus(RequestStatus.APPROVED);
                entity.setProcessedAt(LocalDate.now());
                
                applyScheduleChange(entity);
                entity.setStatus(RequestStatus.APPLIED);
            }
            
            entity.setUpdatedAt(LocalDate.now());
            scheduleChangeRequestRepository.save(entity);
            
            log.info("Schedule change request approved by doctor: {}", doctorId);
            
        } catch (Exception e) {
            log.error("Error approving request", e);
            throw new RuntimeException("Error processing approval", e);
        }
        
        return convertToResponse(entity);
    }
    
    // Apply schedule change to Schedule table WITH RETRY MECHANISM
    @Transactional
    private void applyScheduleChange(ScheduleChangeRequest request) {
        log.info("Applying schedule change for request: {}", request.getId());
        
        int maxRetries = 3;
        int retryCount = 0;
        
        while (retryCount < maxRetries) {
            try {
                applyScheduleChangeInternal(request);
                log.info("Schedule change applied successfully after {} retries", retryCount);
                return;
                
            } catch (ObjectOptimisticLockingFailureException e) {
                retryCount++;
                log.warn("Optimistic locking failure, retry {}/{}", retryCount, maxRetries);
                
                if (retryCount >= maxRetries) {
                    log.error("Max retries exceeded for optimistic locking");
                    throw new RuntimeException("Failed to apply schedule change after " + maxRetries + " retries", e);
                }
                
                try {
                    Thread.sleep(100 * retryCount);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry", ie);
                }
                
            } catch (Exception e) {
                log.error("Error applying schedule change", e);
                throw new RuntimeException("Error applying schedule change", e);
            }
        }
    }
    
    // Internal method to actually apply the schedule change
    private void applyScheduleChangeInternal(ScheduleChangeRequest request) {
        if (request.getChangeType() == ScheduleChangeRequest.ChangeType.CREATE) {
            ScheduleRequest scheduleRequest = ScheduleRequest.builder()
                .workDate(LocalDate.parse(request.getDateChange()))
                .startTime(request.getNewStartTime())
                .endTime(request.getNewEndTime())
                .build();
            
            scheduleService.createSchedule(scheduleRequest, request.getTargetDoctorId());
            log.info("New schedule created for doctor: {}", request.getTargetDoctorId());
            
        } else if (request.getChangeType() == ScheduleChangeRequest.ChangeType.UPDATE) {
            if (request.getTargetScheduleId() == null) {
                throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
            }
            
            ScheduleRequest scheduleRequest = ScheduleRequest.builder()
                .workDate(LocalDate.parse(request.getDateChange()))
                .startTime(request.getNewStartTime())
                .endTime(request.getNewEndTime())
                .build();
            
            scheduleService.updateSchedule(request.getTargetScheduleId(), scheduleRequest);
            log.info("Schedule updated: {}", request.getTargetScheduleId());
            
        } else if (request.getChangeType() == ScheduleChangeRequest.ChangeType.DELETE) {
            if (request.getTargetScheduleId() == null) {
                throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
            }
            
            scheduleService.deleteSchedule(request.getTargetScheduleId());
            log.info("Schedule deleted: {}", request.getTargetScheduleId());
        }
    }

    // Reject request by a doctor
    public ScheduleChangeRequestResponse rejectRequestByDoctor(String requestId, String doctorId, String rejectionNote) {
        log.info("Doctor {} rejecting schedule change request: {}", doctorId, requestId);
        
        ScheduleChangeRequest entity = scheduleChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        
        if (entity.getStatus() != RequestStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        
        if (!entity.getTargetDoctorId().equals(doctorId)) {
            log.error("Doctor {} tried to reject request for doctor {}", doctorId, entity.getTargetDoctorId());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        
        entity.setStatus(RequestStatus.REJECTED);
        entity.setRejectionNote(rejectionNote);
        entity.setRejectedByDoctorId(doctorId);
        entity.setUpdatedAt(LocalDate.now());
        entity.setProcessedAt(LocalDate.now());
        
        scheduleChangeRequestRepository.save(entity);
        log.info("Schedule change request rejected by doctor: {}", doctorId);
        
        sendRejectionNotification(entity, doctorId);
        
        return convertToResponse(entity);
    }
    
    // Send rejection notification
    private void sendRejectionNotification(ScheduleChangeRequest request, String rejectedByDoctorId) {
        try {
            User rejectedDoctor = userRepository.findById(rejectedByDoctorId).orElse(null);
            if (rejectedDoctor == null) return;
            
            if (request.getCreatedByStaffId() != null) {
                User staff = userRepository.findById(request.getCreatedByStaffId()).orElse(null);
                if (staff != null && staff.getEmail() != null) {
                    String subject = "Yêu cầu thay đổi lịch làm việc bị từ chối";
                    String body = String.format(
                        "Yêu cầu thay đổi lịch làm việc đã bị từ chối bởi BS. %s\n\n" +
                        "Chi tiết:\n" +
                        "- Ngày: %s\n" +
                        "- Khoa: %s\n" +
                        "- Lý do từ chối: %s\n\n" +
                        "Vui lòng kiểm tra và tạo yêu cầu mới nếu cần.\n\n" +
                        "Trân trọng,\n" +
                        "Hệ thống OHMS",
                        rejectedDoctor.getUsername(),
                        request.getDateChange(),
                        request.getDepartment(),
                        request.getRejectionNote() != null ? request.getRejectionNote() : "Không có"
                    );
                    
                    mailService.sendMail(staff.getEmail(), subject, body);
                }
            }
        } catch (Exception e) {
            log.error("Error sending rejection notification", e);
        }
    }

    // Get all requests
    public List<ScheduleChangeRequestResponse> getAllRequests() {
        log.info("Fetching all schedule change requests");
        return scheduleChangeRequestRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }
    
    // Get request by ID
    public ScheduleChangeRequestResponse getRequestById(String requestId) {
        log.info("Fetching schedule change request: {}", requestId);
        ScheduleChangeRequest entity = scheduleChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));
        
        return convertToResponse(entity);
    }
    
    // Lấy tất cả yêu cầu của một bác sĩ
    public List<ScheduleChangeRequestResponse> getRequestsByDoctor(String doctorId) {
        log.info("Fetching schedule change requests for doctor: {}", doctorId);
        return scheduleChangeRequestRepository.findByTargetDoctorId(doctorId)
            .stream()
            .map(this::convertToResponse)
            .toList();
    }

    // Lấy yêu cầu theo status
    public List<ScheduleChangeRequestResponse> getRequestsByStatus(RequestStatus status) {
        log.info("Fetching schedule change requests with status: {}", status);
        return scheduleChangeRequestRepository.findByStatus(status)
            .stream()
            .map(this::convertToResponse)
            .toList();
    }

    // Lấy pending requests của một doctor
    public List<ScheduleChangeRequestResponse> getPendingRequestsByDoctor(String doctorId) {
        log.info("Fetching pending schedule change requests for doctor: {}", doctorId);
        return scheduleChangeRequestRepository
            .findByTargetDoctorIdAndStatusOrderByCreatedAtDesc(doctorId, RequestStatus.PENDING)
            .stream()
            .map(this::convertToResponse)
            .toList();
    }
    
    // Lấy pending requests của một doctor (CHỈ LỊCH CỦA MÌNH)
    public List<ScheduleChangeRequestResponse> getPendingRequestsForDoctor(String doctorId) {
        log.info("Fetching pending schedule change requests for doctor: {}", doctorId);
        
        List<ScheduleChangeRequest> requests = scheduleChangeRequestRepository
            .findByTargetDoctorIdAndStatus(doctorId, RequestStatus.PENDING);
        
        return requests.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    // Lấy requests theo ngày và department
    public List<ScheduleChangeRequestResponse> getRequestsByDateAndDepartment(String dateChange, String department) {
        List<ScheduleChangeRequest> requests = scheduleChangeRequestRepository
                .findByDateChangeAndDepartment(dateChange, department);
        
        return requests.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    // Lấy requests theo ngày và department với status cụ thể
    public List<ScheduleChangeRequestResponse> getRequestsByDateAndDepartmentAndStatus(
            String dateChange, String department, RequestStatus status) {
        List<ScheduleChangeRequest> requests = scheduleChangeRequestRepository
                .findByDateChangeAndDepartmentAndStatus(dateChange, department, status);
        
        return requests.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    // Lấy tất cả requests theo ngày
    public List<ScheduleChangeRequestResponse> getRequestsByDate(String dateChange) {
        List<ScheduleChangeRequest> requests = scheduleChangeRequestRepository
                .findByDateChange(dateChange);
        
        return requests.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    // Lấy tất cả requests theo department
    public List<ScheduleChangeRequestResponse> getRequestsByDepartment(String department) {
        List<ScheduleChangeRequest> requests = scheduleChangeRequestRepository
                .findByDepartment(department);
        
        return requests.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
}
