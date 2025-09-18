package com.example.ohms.service;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.example.ohms.dto.request.MedicineRequest;
import com.example.ohms.dto.response.MedicineResponse;
import com.example.ohms.entity.Medicine;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.MedicleMapper;
import com.example.ohms.repository.MedicineRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE, makeFinal = true)

public class MedicineService {
   MedicleMapper medicleMapper;
   MedicineRepository medicineRepository;
// create
// get
// update
// delete
@PreAuthorize("hasRole('ADMIN')")
public MedicineResponse createMedicine(MedicineRequest medicineRequest) {
    Medicine medicine = medicleMapper.toMedicine(medicineRequest);
    // check thuốc xem có chưa
    if (medicineRepository.findByName(medicine.getName()).isPresent()) {
        throw new AppException(ErrorCode.MEDICINE_EXITEDS);
    }
    medicineRepository.save(medicine);
    return medicleMapper.toMedicineResponse(medicine);
}

// update thì chắc lấy tên củ
public MedicineResponse updateMedicine(MedicineRequest medicineRequest,String id){
   Medicine medicine  = medicineRepository.findById(id).orElseThrow(()->new AppException(ErrorCode.MEDICINE_NOT_FOUND)); 
   if(medicineRequest.getName() != null){
    medicine.setName(medicineRequest.getName());
   }
   // kiểu int trong spring không thể = null nên mình phải set nó mặc định= 0 nha
     if(medicineRequest.getPrice() != 0){
    medicine.setPrice(medicineRequest.getPrice());
   }
     if(medicineRequest.getQuantity() != 0){
    medicine.setQuantity(medicineRequest.getQuantity());
   }
     if(medicineRequest.getType() != null){
    medicine.setType(medicineRequest.getType());
   }
   medicineRepository.save(medicine);
   return medicleMapper.toMedicineResponse(medicine);
}
// lấy chi tiết của thuốc
public MedicineResponse getDetailMedicine(String id){
    Medicine medicine = medicineRepository.findById(id).orElseThrow(()-> new AppException(ErrorCode.MEDICINE_NOT_FOUND));
    return medicleMapper.toMedicineResponse(medicine);
}
// get all thuốc
public List<MedicineResponse> getAllMedicine() {
    return medicineRepository.findAll()
            .stream()
            .map(medicleMapper::toMedicineResponse)
            .toList();
}
// xóa thuốc mình làm sau để chắc chắn ràng buộc ấy
public Void deleteMedicine(String id){
    medicineRepository.deleteById(id);
    return null;
}
}
