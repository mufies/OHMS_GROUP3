package com.example.ohms.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.ohms.dto.request.BillRequest;
import com.example.ohms.dto.response.BillResponse;
import com.example.ohms.entity.Bill;

@Mapper(componentModel = "spring")
public interface BillMapper {
@Mapping(target = "id", ignore = true)
@Mapping(target = "patient", ignore = true)
@Mapping(target = "priceExamination", ignore = true)
@Mapping(target = "status", ignore = true)
@Mapping(target = "medicalExamination", ignore = true)

   Bill toBill(BillRequest billRequest);

    @Mapping(target = "user", source = "patient")
   BillResponse toBillResponse(Bill bill);
}
