package com.example.ohms.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
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
// tạo lịch mới
public ScheduleResponse createSchedule(ScheduleRequest scheduleRequest,String doctorId){
if (scheduleRequest.getWorkDate().isBefore(LocalDate.now())) {
    throw new AppException(ErrorCode.DATE_NOT_VAILID);
}
// timf theo thằng bác sĩ, có ngày đó rồi thì không cho tạo vào ngày đó nữa
   if(scheduleRepository.existsByDoctor_IdAndWorkDate(doctorId, scheduleRequest.getWorkDate())){
      throw new AppException(ErrorCode.DATE_NOT_VAILID);
   }
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

// lấy lịch làm việc trong tuần của 1 thằng doctor
public List<ScheduleResponse> getWeeklyScheduleForDoctor(String doctorId) {
    LocalDate today = LocalDate.now();
    LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
    
    return scheduleRepository.findByDoctor_Id(doctorId).stream()
        .filter(schedule -> {
            LocalDate workDate = schedule.getWorkDate();
            return !workDate.isBefore(startOfWeek) && !workDate.isAfter(endOfWeek);
        })
        .map(scheduleMapper::toScheduleResponse)
        .toList();
}

// thay đổi lịch làm việc
public ScheduleResponse updateSchedule(String scheduleId, ScheduleRequest scheduleRequest ){
   Schedule schedule = scheduleRepository.findById(scheduleId).orElseThrow(()-> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
   if (scheduleRequest.getWorkDate().isBefore(LocalDate.now())) {
    throw new AppException(ErrorCode.DATE_NOT_VAILID);
}
   if(scheduleRequest.getEndTime() != null){
 schedule.setEndTime(scheduleRequest.getEndTime());
   }
  if(scheduleRequest.getStartTime() != null){
   schedule.setStartTime(scheduleRequest.getStartTime());
  }
   if(scheduleRequest.getWorkDate() != null){
       schedule.setWorkDate(scheduleRequest.getWorkDate());
   }
   
  
   scheduleRepository.save(schedule);
   return scheduleMapper.toScheduleResponse(schedule);
}
// tí quay lại check relation trong bảng
public Void deleteSchedule(String scheduleId){
   scheduleRepository.deleteById(scheduleId);
   return null;
}
}
