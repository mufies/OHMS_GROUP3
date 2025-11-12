package com.example.ohms.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;      // ← THÊM DÒNG NÀY
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class ScheduleChangeRequest {
    
    @Id
    String id;
    
    @Enumerated(EnumType.ORDINAL)    
    ChangeType changeType; // CREATE, UPDATE, DELETE
    
    @Enumerated(EnumType.ORDINAL)
    @Builder.Default
    RequestStatus status = RequestStatus.PENDING; 
    
    String dateChange; // Ngày thay đổi (yyyy-MM-dd)
    String department; // Khoa
    
    // Thông tin lịch mới (nếu CREATE hoặc UPDATE)
    LocalTime newStartTime;
    LocalTime newEndTime;
    
    // Bác sĩ chủ yêu cầu (staff tạo cho doctor này)
    String targetDoctorId;
    
    //Schedule Id can update
    String targetScheduleId;

    // Staff tạo request
    String createdByStaffId;
    
    @Column(columnDefinition = "TEXT")
    String affectedDoctorIds; // JSON: ["doctorId1", "doctorId2", ...]
    
    // Danh sách doctor đã approve (JSON string array)
    @Column(columnDefinition = "TEXT")
    String approvedDoctorIds; // JSON: ["doctorId1", ...]
    
    // Lý do (nếu có)
    String reason;
    
    // Ghi chú từ chối (nếu có doctor từ chối)
    String rejectionNote;
    
    // Doctor ID của người reject
    String rejectedByDoctorId;
    
    // Timestamps
    LocalDate createdAt;
    LocalDate updatedAt;
    LocalDate processedAt;
    
    public enum ChangeType {
        CREATE,
        UPDATE,
        DELETE
    }
    
    public enum RequestStatus {
        PENDING,      // Chờ xác nhận
        APPROVED,     // Tất cả đã xác nhận
        REJECTED,     // Có người từ chối
        APPLIED       // Đã áp dụng thành công
    }
    
}
