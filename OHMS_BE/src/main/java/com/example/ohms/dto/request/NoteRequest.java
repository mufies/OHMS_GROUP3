package com.example.ohms.dto.request;

import lombok.Data;

/**
 * DTO dùng để nhận dữ liệu từ client khi tạo hoặc cập nhật Task.
 */
@Data
public class NoteRequest {
    private String userId;   // ID của User gán cho Task
    private String title;  // Tiêu đề công việc
    private boolean completed; // Trạng thái hoàn thành
}
