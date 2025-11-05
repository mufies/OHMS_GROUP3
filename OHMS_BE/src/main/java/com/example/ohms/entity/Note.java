package com.example.ohms.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne
@JoinColumn(name = "user_id")
private User user;

    private String date;
    private String note;
    private String time;
    private boolean completed; // "Scheduled" hoặc "Completed"


}
