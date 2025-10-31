package com.example.ohms.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
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
   AppointmentService appointmentService; // Inject AppointmentService
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
   
   // Auto-assign appointments có doctorId = null vào schedule mới này
   int assignedCount = appointmentService.autoAssignAppointmentsOnScheduleCreate(
       doctorId,
       scheduleRequest.getWorkDate(),
       scheduleRequest.getStartTime(),
       scheduleRequest.getEndTime()
   );
   
   if (assignedCount > 0) {
       // Log để debug
       System.out.println("Auto-assigned " + assignedCount + " appointments to doctor " + doctorId);
   }
   
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

//get doctor next week schedule
public List<ScheduleResponse> getNextWeekScheduleForDoctor(String doctorId)
{
    LocalDate today = LocalDate.now();
    // Tìm thứ 2 tuần sau
    LocalDate nextMonday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
    // Tìm chủ nhật tuần sau
    LocalDate nextSunday = nextMonday.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
    
    return scheduleRepository.findByDoctor_Id(doctorId).stream()
        .filter(schedule -> {
            LocalDate workDate = schedule.getWorkDate();
            return !workDate.isBefore(nextMonday) && !workDate.isAfter(nextSunday);
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
   
   // Lưu thông tin cũ để check appointments bị ảnh hưởng
   String doctorId = schedule.getDoctor().getId();
   LocalDate oldDate = schedule.getWorkDate();
   LocalTime oldStartTime = schedule.getStartTime();
   LocalTime oldEndTime = schedule.getEndTime();
   
   // Check nếu thay đổi time range → unassign appointments
   boolean timeChanged = false;
   LocalTime newStartTime = oldStartTime;
   LocalTime newEndTime = oldEndTime;
   
   if (scheduleRequest.getStartTime() != null && !scheduleRequest.getStartTime().equals(oldStartTime)) {
       newStartTime = scheduleRequest.getStartTime();
       schedule.setStartTime(newStartTime);
       timeChanged = true;
   }
   if (scheduleRequest.getEndTime() != null && !scheduleRequest.getEndTime().equals(oldEndTime)) {
       newEndTime = scheduleRequest.getEndTime();
       schedule.setEndTime(newEndTime);
       timeChanged = true;
   }
   if (scheduleRequest.getWorkDate() != null && !scheduleRequest.getWorkDate().equals(oldDate)) {
       schedule.setWorkDate(scheduleRequest.getWorkDate());
       timeChanged = true;
   }
   
   // Nếu time range thay đổi → handle appointments với NEW time range
   if (timeChanged) {
       int unassignedCount = appointmentService.handleScheduleChange(
           doctorId,
           oldDate,
           oldStartTime,
           oldEndTime,
           newStartTime,  // Truyền NEW start time
           newEndTime     // Truyền NEW end time
       );
       
       if (unassignedCount > 0) {
           System.out.println("Unassigned " + unassignedCount + " appointments (outside new time range)");
       } else {
           System.out.println("All appointments still within new time range, kept doctor assignment");
       }
   }
   
   scheduleRepository.save(schedule);
   return scheduleMapper.toScheduleResponse(schedule);
}
// tí quay lại check relation trong bảng
public Void deleteSchedule(String scheduleId){
    // Verify schedule exists before deleting to provide clear error when it does not
    Schedule schedule = scheduleRepository.findById(scheduleId)
        .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
    
    // Unassign tất cả appointments trong time range của schedule này
    int unassignedCount = appointmentService.handleScheduleChange(
        schedule.getDoctor().getId(),
        schedule.getWorkDate(),
        schedule.getStartTime(),
        schedule.getEndTime()
    );
    
    if (unassignedCount > 0) {
        System.out.println("Unassigned " + unassignedCount + " appointments due to schedule deletion");
    }
    
    scheduleRepository.deleteById(scheduleId);
    return null;
}
}
