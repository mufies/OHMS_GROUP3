package com.example.ohms.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.ohms.dto.request.BillRequest;
import com.example.ohms.dto.response.BillResponse;
import com.example.ohms.entity.Bill;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.User;
import com.example.ohms.enums.PaymentStatus;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.BillMapper;
import com.example.ohms.mapper.UserMapper;
import com.example.ohms.repository.BillRepository;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.UserRepository;
@Service
@RequiredArgsConstructor
@FieldDefaults(level =  AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class BillService {
   BillMapper billMapper;
   BillRepository billRepository;
   MedicleExaminatioRepository medicleExaminatioRepository;
   UserRepository userRepository;
// create bill
// view bill 
// delete bill
   public BillResponse createBill(String patientsId, BillRequest billRequest){
      log.info("aaaaaaaaaaaaa{}",billRequest);
      Bill bill = billMapper.toBill(billRequest);
      User patients = userRepository.findById(patientsId).orElseThrow(()-> new AppException(ErrorCode.USER_NOT_FOUND));
      List<MedicalExamination> services = medicleExaminatioRepository.findAllByIdIn(billRequest.getMedicalExamination());

      // nếu không tìm thấy dịch vụ nào thì ném exception
      if (services.isEmpty()) {
         throw new AppException(ErrorCode.MEDICLE_NOT_FOUND);
      }
      
      bill.setMedicalExamination(new HashSet<>(services));
      Integer totalPrice = services.stream()
            .mapToInt(MedicalExamination::getPrice) 
            .sum();
      bill.setPriceExamination(totalPrice);
      bill.setStatus(PaymentStatus.PENDING);
      bill.setPatient(patients);
      
      return billMapper.toBillResponse(billRepository.save(bill));
   }
   // lấy tất cả bill
   public List<BillResponse> getListBill(){
      return billRepository.findAll().stream().map(billMapper :: toBillResponse).toList();
   }
   // lấy bill của từng thằng patients
   // vãi cặc có rồi tưởng chưa có
   public List<BillResponse> getBillByPatients(String patientId){
      return billRepository.findByPatient_Id(patientId).stream().map(billMapper :: toBillResponse).toList();
   }
   // delete
   public void deleteBill(String billId){
      billRepository.deleteById(billId);
   }
   // get detail
   public BillResponse getBillId(String billId){
      return billMapper.toBillResponse( billRepository.findById(billId).orElseThrow(()-> new AppException(ErrorCode.BILL_NOTFOUND)));
   }
}
