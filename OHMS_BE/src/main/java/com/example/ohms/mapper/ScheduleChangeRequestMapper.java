package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.ohms.dto.request.ScheduleChangeRequestRequest;
import com.example.ohms.dto.response.ScheduleChangeRequestResponse;
import com.example.ohms.entity.ScheduleChangeRequest;

@Mapper(componentModel = "spring")
public interface ScheduleChangeRequestMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "rejectionNote", ignore = true)
    @Mapping(target = "rejectedByDoctorId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "processedAt", ignore = true)
    @Mapping(target = "affectedDoctorIds", ignore = true)
    @Mapping(target = "approvedDoctorIds", ignore = true)
    ScheduleChangeRequest toScheduleChangeRequest(ScheduleChangeRequestRequest request);

    @Mapping(target = "affectedDoctorIds", ignore = true)
    @Mapping(target = "approvedDoctorIds", ignore = true)
    @Mapping(target = "targetScheduleId",ignore = true)
    ScheduleChangeRequestResponse toScheduleChangeRequestResponse(ScheduleChangeRequest entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "processedAt", ignore = true)
    @Mapping(target = "rejectionNote", ignore = true)
    @Mapping(target = "rejectedByDoctorId", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "affectedDoctorIds", ignore = true)
    @Mapping(target = "approvedDoctorIds", ignore = true)
    @Mapping(target = "targetScheduleId",ignore = true)
    void updateScheduleChangeRequest(@MappingTarget ScheduleChangeRequest entity, ScheduleChangeRequestRequest request);
}
