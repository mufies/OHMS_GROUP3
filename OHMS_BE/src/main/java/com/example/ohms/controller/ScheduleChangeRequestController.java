package com.example.ohms.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.ScheduleChangeRequestRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.ScheduleChangeRequestResponse;
import com.example.ohms.entity.ScheduleChangeRequest.RequestStatus;
import com.example.ohms.service.ScheduleChangeRequestService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/schedule-change-requests")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScheduleChangeRequestController {
    ScheduleChangeRequestService scheduleChangeRequestService;

    // Tạo yêu cầu thay đổi lịch mới
    @PostMapping
    public ApiResponse<ScheduleChangeRequestResponse> createRequest(
            @RequestBody ScheduleChangeRequestRequest request) {
        return ApiResponse.<ScheduleChangeRequestResponse>builder()
                .code(200)
                .message("Schedule change request created successfully")
                .results(scheduleChangeRequestService.createScheduleChangeRequest(request))
                .build();
    }
    
    // Tạo nhiều yêu cầu lịch cùng lúc (bulk create)
    @PostMapping("/bulk")
    public ApiResponse<List<ScheduleChangeRequestResponse>> createBulkRequests(
            @RequestBody ScheduleChangeRequestRequest request) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .message("Bulk schedule change requests created successfully")
                .results(scheduleChangeRequestService.createBulkScheduleChangeRequest(request))
                .build();
    }

    // Lấy tất cả yêu cầu
    @GetMapping
    public ApiResponse<List<ScheduleChangeRequestResponse>> getAllRequests() {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .results(scheduleChangeRequestService.getAllRequests())
                .build();
    }

    // Lấy yêu cầu theo ID
    @GetMapping("/{requestId}")
    public ApiResponse<ScheduleChangeRequestResponse> getRequestById(
            @PathVariable("requestId") String requestId) {
        return ApiResponse.<ScheduleChangeRequestResponse>builder()
                .code(200)
                .results(scheduleChangeRequestService.getRequestById(requestId))
                .build();
    }

    // Lấy yêu cầu theo doctor ID
    @GetMapping("/doctor/{doctorId}")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getRequestsByDoctor(
            @PathVariable("doctorId") String doctorId) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .results(scheduleChangeRequestService.getRequestsByDoctor(doctorId))
                .build();
    }

    // Lấy pending requests của doctor
    @GetMapping("/doctor/{doctorId}/pending")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getPendingRequestsByDoctor(
            @PathVariable("doctorId") String doctorId) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .results(scheduleChangeRequestService.getPendingRequestsByDoctor(doctorId))
                .build();
    }

    // Lấy yêu cầu theo status
    @GetMapping("/status/{status}")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getRequestsByStatus(
            @PathVariable("status") RequestStatus status) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .results(scheduleChangeRequestService.getRequestsByStatus(status))
                .build();
    }

    // Update yêu cầu (chỉ khi PENDING)
    @PatchMapping("/{requestId}")
    public ApiResponse<ScheduleChangeRequestResponse> updateRequest(
            @PathVariable("requestId") String requestId,
            @RequestBody ScheduleChangeRequestRequest request) {
        return ApiResponse.<ScheduleChangeRequestResponse>builder()
                .code(200)
                .message("Schedule change request updated successfully")
                .results(scheduleChangeRequestService.updateRequest(requestId, request))
                .build();
    }

    // Approve yêu cầu bởi doctor
    @PostMapping("/{requestId}/approve/doctor/{doctorId}")
    public ApiResponse<ScheduleChangeRequestResponse> approveRequestByDoctor(
            @PathVariable("requestId") String requestId,
            @PathVariable("doctorId") String doctorId) {
        return ApiResponse.<ScheduleChangeRequestResponse>builder()
                .code(200)
                .message("Schedule change request approved successfully")
                .results(scheduleChangeRequestService.approveRequestByDoctor(requestId, doctorId))
                .build();
    }

    // Reject yêu cầu bởi doctor
    @PostMapping("/{requestId}/reject/doctor/{doctorId}")
    public ApiResponse<ScheduleChangeRequestResponse> rejectRequestByDoctor(
            @PathVariable("requestId") String requestId,
            @PathVariable("doctorId") String doctorId,
            @RequestParam(value = "note", required = false) String rejectionNote) {
        return ApiResponse.<ScheduleChangeRequestResponse>builder()
                .code(200)
                .message("Schedule change request rejected")
                .results(scheduleChangeRequestService.rejectRequestByDoctor(requestId, doctorId, rejectionNote))
                .build();
    }
    
    // Lấy pending requests cho doctor
    @GetMapping("/doctor/{doctorId}/pending-for-approval")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getPendingRequestsForDoctor(
            @PathVariable("doctorId") String doctorId) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .results(scheduleChangeRequestService.getPendingRequestsForDoctor(doctorId))
                .build();
    }
    
    // Lấy requests theo ngày và department
    @GetMapping("/date/{dateChange}/department/{department}")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getRequestsByDateAndDepartment(
            @PathVariable String dateChange,
            @PathVariable String department) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .message("Retrieved requests by date and department successfully")
                .results(scheduleChangeRequestService.getRequestsByDateAndDepartment(dateChange, department))
                .build();
    }
    
    // Lấy requests theo ngày, department và status
    @GetMapping("/date/{dateChange}/department/{department}/status/{status}")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getRequestsByDateAndDepartmentAndStatus(
            @PathVariable String dateChange,
            @PathVariable String department,
            @PathVariable RequestStatus status) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .message("Retrieved requests successfully")
                .results(scheduleChangeRequestService.getRequestsByDateAndDepartmentAndStatus(dateChange, department, status))
                .build();
    }
    
    // Lấy requests theo ngày
    @GetMapping("/date/{dateChange}")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getRequestsByDate(
            @PathVariable String dateChange) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .message("Retrieved requests by date successfully")
                .results(scheduleChangeRequestService.getRequestsByDate(dateChange))
                .build();
    }
    
    // Lấy requests theo department
    @GetMapping("/department/{department}")
    public ApiResponse<List<ScheduleChangeRequestResponse>> getRequestsByDepartment(
            @PathVariable String department) {
        return ApiResponse.<List<ScheduleChangeRequestResponse>>builder()
                .code(200)
                .message("Retrieved requests by department successfully")
                .results(scheduleChangeRequestService.getRequestsByDepartment(department))
                .build();
    }
}
