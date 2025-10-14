package com.example.ohms.service;

import com.example.ohms.dto.request.PrescriptionRequest;
import com.example.ohms.dto.request.PrescriptionMedicineRequest;
import com.example.ohms.dto.response.PrescriptionResponse;
import com.example.ohms.entity.Medicine;
import com.example.ohms.entity.Prescription;
import com.example.ohms.entity.PrescriptionMedicine;
import com.example.ohms.entity.User;
import com.example.ohms.enums.PaymentStatus;
import com.example.ohms.exception.AppException;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.mapper.PrescriptionMapper;
import com.example.ohms.repository.MedicineRepository;
import com.example.ohms.repository.PrescriptionMedicineRepository;
import com.example.ohms.repository.PrescriptionRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE)
@Slf4j
public class PrescriptionService {
    private PrescriptionRepository prescriptionRepository;
    private PrescriptionMapper prescriptionMapper;
    private UserRepository userRepository;
    private MedicineRepository medicineRepository;
    PrescriptionMedicineRepository prescriptionMedicineRepository; 
@PostAuthorize("hasRole('DOCTOR')")
public PrescriptionResponse createPrescription(Authentication authentication, 
PrescriptionRequest prescriptionRequest,
 String patientId) {
    if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
    log.info("Đang tạo đơn thuốc: {}", prescriptionRequest);
    String userId = jwt.getClaimAsString("sub");

    // Tìm bác sĩ
    User doctor = userRepository.findById(userId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    // Tìm bệnh nhân
    User patient = userRepository.findById(patientId)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    // tìm thuốc, 
    // prescription request là mảng prescription, lôi cái đó ra xử lí tìm thuốc với trừ số lượng thuốc
int totalPrice = prescriptionRequest.getMedicinePrescription().stream()
    .mapToInt(request -> {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
            .orElseThrow(() -> new AppException(ErrorCode.MEDICINE_NOT_FOUND));

        if (medicine.getQuantity() < request.getAmount()) {
            throw new AppException(ErrorCode.MEDICLE_NOT_FOUND);
        }

        // Trừ số lượng thuốc
        medicine.setQuantity(medicine.getQuantity() - request.getAmount());
        medicineRepository.save(medicine);

        log.info("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA{}", medicine.getQuantity() - request.getAmount());
        // Trả về tiền thuốc cho đơn này
        return medicine.getPrice() * request.getAmount();
    })
    .sum(); // cộng dồn tất cả
// xử lí bill
   Prescription prescription = new Prescription();
prescription.setDoctor(doctor);
prescription.setPatient(patient);
prescription.setAmount(totalPrice);
prescription.setStatus(PaymentStatus.PENDING);

Set<PrescriptionMedicine> setPrescriptionMedicine = new HashSet<>();

prescriptionRequest.getMedicinePrescription().forEach(request -> {
    Medicine medicine = medicineRepository.findById(request.getMedicineId())
        .orElseThrow(() -> new AppException(ErrorCode.MEDICINE_NOT_FOUND));

    PrescriptionMedicine pm = new PrescriptionMedicine();
    pm.setMedicine(medicine);
    pm.setAmount(request.getAmount());
    prescriptionMedicineRepository.save(pm);
    log.error("AAAAAAAAAAAAAA{}",pm);
    setPrescriptionMedicine.add(pm);
    prescriptionMedicineRepository.save(pm); // save từng cái
});

// gán vào prescription
prescription.setMedicinePrescription(setPrescriptionMedicine);
log.info("RRRRRRRRRRRRRRRRRRRRR{}", prescription);
// Lưu vào DB
Prescription saved = prescriptionRepository.save(prescription);

// Trả về response DTO
return prescriptionMapper.toPrescriptionResponse(saved);

}
// view đơn thuốc từng dùng của từng bệnh nhân
// cái này khi kết hợp với lịch sử khám bệnh sẽ trở thành history =)))
  public List<PrescriptionResponse> viewListPrescriptionForPatients(String patientId) {
    if (patientId == null || patientId.isEmpty()) {
        throw new AppException(ErrorCode.USER_NOT_FOUND);
    }
    List<Prescription> prescriptions = prescriptionRepository.findAllByPatientId(patientId);
    if (prescriptions.isEmpty()) {
        throw new AppException(ErrorCode.PRESCRIP_NOT_FOUND);
    }
    return prescriptions.stream()
            .map(prescriptionMapper::toPrescriptionResponse)
            .toList();
}

}