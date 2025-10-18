package com.example.ohms.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.request.ScheduleRequest;
import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.ScheduleResponse;
import com.example.ohms.service.ScheduleService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("schedule")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScheduleController {
   ScheduleService scheduleService;
// tạo lịch làm việc
@PostMapping("/{doctorId}")
public ApiResponse<ScheduleResponse> createSchedule(@RequestBody ScheduleRequest scheduleRequest,
@PathVariable("doctorId") String id){
   return ApiResponse.<ScheduleResponse>builder()
   .code(200)
   .results(scheduleService.createSchedule(scheduleRequest, id))
   .build();
}

@GetMapping("/{doctorId}")
public ApiResponse<List<ScheduleResponse>> getScheduleList(
   @PathVariable("doctorId") String doctorId 
){
   return ApiResponse.<List<ScheduleResponse>>builder()
   .code(200)
   .results(scheduleService.getListScheduleForDoctor(doctorId))
   .build();
}
@PatchMapping("/{scheduleId}")
public ApiResponse<ScheduleResponse> updateSchedule(@PathVariable("scheduleId") String scheduleId,
@RequestBody ScheduleRequest scheduleRequest
){
   return ApiResponse.<ScheduleResponse>builder()
   .results(scheduleService.updateSchedule(scheduleId, scheduleRequest))
   .build();
}
@DeleteMapping("/{scheduleId}")
public ApiResponse<Void> deleteSchedule(@PathVariable("scheduleId") String scheduleId){
   scheduleService.deleteSchedule(scheduleId);
   return ApiResponse.<Void>builder()
   .code(200)
   .message("delete successful")
   .build();
}
@GetMapping("/doctor/{doctorId}/weekly")
public ApiResponse<List<ScheduleResponse>> getWeeklyScheduleForDoctor(@PathVariable("doctorId") String doctorId){
   return ApiResponse.<List<ScheduleResponse>>builder()
   .code(200)
   .results(scheduleService.getWeeklyScheduleForDoctor(doctorId))
   .build();
}
}
