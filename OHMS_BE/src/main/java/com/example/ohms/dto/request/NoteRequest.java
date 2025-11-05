package com.example.ohms.dto.request;

import lombok.Data;

@Data
public class NoteRequest {
    private String date;
    private String note;
    private String time;
    private boolean completed;  // "Scheduled" hoặc "Completed"
}
