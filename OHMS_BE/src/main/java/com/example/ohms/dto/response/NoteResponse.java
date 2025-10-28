package com.example.ohms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Dữ liệu trả về cho React khi gọi API /notes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse {
    private Long id;
    private String title;
    private boolean completed;

    // thông tin user gọn nhẹ (chỉ id và name)
    private String userId;
    private String userName;
}
