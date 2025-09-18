package com.example.ohms.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.ohms.dto.request.ScheduleRequest;
import com.example.ohms.dto.response.ScheduleResponse;
import com.example.ohms.entity.Schedule;
import com.example.ohms.entity.User;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.ScheduleMapper;
import com.example.ohms.repository.ScheduleRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE)
public class ScheduleService {
   ScheduleRepository scheduleRepository;
   ScheduleMapper scheduleMapper;
   UserRepository userRepository;
// tạo lịch mới, lấy id của thằng doctor để tạo;
public ScheduleResponse createSchedule(ScheduleRequest scheduleRequest,String doctorId){
   User user = userRepository.findById(doctorId).orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND));
   Schedule schedule =  scheduleMapper.toSchedule(scheduleRequest);
   schedule.setDoctor(user);
   scheduleRepository.save(schedule);
   return scheduleMapper.toScheduleResponse(schedule);
}
// lấy hết lịch làm việc của 1 thằng doctor
public List<ScheduleResponse> getListScheduleForDoctor(String doctorId){
   return scheduleRepository.findByDoctor_Id(doctorId).stream().map(scheduleMapper :: toScheduleResponse).toList();
}
// thay đổi lịch làm việc
public ScheduleResponse updateSchedule(String scheduleId, ScheduleRequest scheduleRequest ){
   Schedule schedule = scheduleRepository.findById(scheduleId).orElseThrow(()-> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
   schedule.setEndTime(scheduleRequest.getEndTime());
   schedule.setStartTime(scheduleRequest.getStartTime());
   schedule.setWorkDate(scheduleRequest.getWorkDate());
   scheduleRepository.save(schedule);
   return scheduleMapper.toScheduleResponse(schedule);
}
// xóa lịch làm việc;
// tí quay lại check relation trong bảng
public Void deleteSchedule(String scheduleId){
   scheduleRepository.deleteById(scheduleId);
   return null;
}
}
