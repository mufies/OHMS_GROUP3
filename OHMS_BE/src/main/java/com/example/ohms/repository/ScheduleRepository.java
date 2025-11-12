package com.example.ohms.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Schedule;

public interface ScheduleRepository extends JpaRepository<Schedule,String> {
 List<Schedule> findByDoctor_Id(String id);
 boolean existsByDoctor_IdAndWorkDate(String doctor_id, LocalDate workDate);
 List<Schedule> findByWorkDate(LocalDate workDate);
 List<Schedule> findByDoctor_IdAndWorkDate(String doctorId, LocalDate workDate);
}
