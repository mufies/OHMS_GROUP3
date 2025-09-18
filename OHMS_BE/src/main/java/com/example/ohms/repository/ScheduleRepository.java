package com.example.ohms.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.ohms.entity.Schedule;

public interface ScheduleRepository extends JpaRepository<Schedule,String> {
 List<Schedule> findByDoctor_Id(String id);
}
