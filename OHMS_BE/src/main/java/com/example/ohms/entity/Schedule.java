package com.example.ohms.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
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
// lịch làm việc phân theo mỗi ngày
public class Schedule {
   @Id
   @GeneratedValue(strategy = GenerationType.UUID)
   String id; // hide
   @ManyToOne
   User doctor; //ẩn doctor, thay thành ddoctor_id rồi set trong mapper
   LocalDate workDate;
   LocalTime startTime;
   LocalTime endTime;
}
