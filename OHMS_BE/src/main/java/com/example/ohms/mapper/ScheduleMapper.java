package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.ScheduleRequest;
import com.example.ohms.dto.response.ScheduleResponse;
import com.example.ohms.entity.Schedule;

@Mapper(componentModel = "spring")
public interface ScheduleMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "doctor", ignore = true)
    Schedule toSchedule(ScheduleRequest scheduleRequest);

    ScheduleResponse toScheduleResponse(Schedule schedule);
}
