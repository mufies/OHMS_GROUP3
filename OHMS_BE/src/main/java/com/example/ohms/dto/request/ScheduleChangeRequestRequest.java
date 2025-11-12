package com.example.ohms.dto.request;

import java.time.LocalTime;
import java.util.List;

import com.example.ohms.entity.ScheduleChangeRequest.ChangeType;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScheduleChangeRequestRequest {
    ChangeType changeType; // CREATE, UPDATE, DELETE
    String dateChange; // Ngày thay đổi (format: yyyy-MM-dd)
    String department; // Khoa
    LocalTime newStartTime; // Giờ bắt đầu mới
    LocalTime newEndTime; // Giờ kết thúc mới
    String targetDoctorId; // ID bác sĩ được yêu cầu
    String createdByStaffId; // ID staff tạo request
    List<String> affectedDoctorIds; // Danh sách doctor cần approve
    String reason; // Lý do thay đổi
    String targetScheduleId;
    // Thêm field cho bulk create schedules
    List<BulkScheduleItem> bulkSchedules; // Danh sách lịch cần tạo cùng lúc
    
    @Data
    @Builder
    @RequiredArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
    public static class BulkScheduleItem {
        String doctorId;
        String scheduleId; // ID của schedule cần update (null nếu là CREATE)
        LocalTime startTime;
        LocalTime endTime;
    }
}
