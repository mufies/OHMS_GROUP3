package com.example.ohms.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import com.example.ohms.entity.ScheduleChangeRequest.ChangeType;
import com.example.ohms.entity.ScheduleChangeRequest.RequestStatus;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleChangeRequestResponse {
    String id;
    ChangeType changeType;
    RequestStatus status;
    String dateChange;
    String department;
    LocalTime newStartTime;
    LocalTime newEndTime;
    String targetDoctorId;
    String targetScheduleId;
    String createdByStaffId;
    List<String> affectedDoctorIds;
    List<String> approvedDoctorIds;
    String reason;
    String rejectionNote;
    String rejectedByDoctorId;
    LocalDate createdAt;
    LocalDate updatedAt;
    LocalDate processedAt;
}
