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
import com.example.ohms.repository.PrescriptionRepository;
import com.example.ohms.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE)
public class PrescriptionService {
    private PrescriptionRepository prescriptionRepository;
    private PrescriptionMapper prescriptionMapper;
    private UserRepository userRepository;
    private MedicineRepository medicineRepository;
// đọc code rồi thử request mẫu này nha  
// chưa trừ số lượng thuốc trong kho,
// sau khi làm thanh toán xong nhớ làm phần trừ thuốc trong kho khi thanh toán xong
//  {
//     "medicinePrescription": [
//         {
//             "medicineId": "med1",
//             "amount": 10
//         },
//         {
//             "medicineId": "med2",
//             "amount": 5
//         }
//     ]
// }
    @PostAuthorize("hasRole('DOCTOR')")
    public PrescriptionResponse createPrescription(Authentication authentication, PrescriptionRequest prescriptionRequest, String patientId) {
        if (!(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String userId = jwt.getClaimAsString("sub");
        User doctor = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

       User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    Set<String> medicineIds = prescriptionRequest.getMedicinePrescription().stream()
                .map(PrescriptionMedicineRequest::getMedicineId)
                .collect(Collectors.toSet());

        Set<Medicine> medicines = medicineRepository.findAllById(medicineIds);
        if (medicines.size() != medicineIds.size()) {
            throw new AppException(ErrorCode.MEDICINE_NOT_FOUND);
        }

   
        Set<PrescriptionMedicine> prescriptionMedicines = prescriptionRequest.getMedicinePrescription().stream()
                .map(request -> {
                    Medicine medicine = medicines.stream()
                            .filter(m -> m.getId().equals(request.getMedicineId()))
                            .findFirst()
                            .orElseThrow(() -> new AppException(ErrorCode.MEDICINE_NOT_FOUND));
                    PrescriptionMedicine prescriptionMedicine = new PrescriptionMedicine();
                    prescriptionMedicine.setMedicine(medicine);
                    prescriptionMedicine.setAmount(request.getAmount());
                    return prescriptionMedicine;
                })
                .collect(Collectors.toSet());
        double totalPrice = prescriptionMedicines.stream()
                .mapToDouble(prescriptionMedicine -> {
                    Medicine medicine = prescriptionMedicine.getMedicine();
                    if (medicine.getPrice() == null || prescriptionMedicine.getAmount() == null) {
                        throw new AppException(ErrorCode.MEDICINE_NOT_FOUND);
                    }
                    return medicine.getPrice() * prescriptionMedicine.getAmount();
                })
                .sum();
        Prescription prescription = new Prescription();
        prescription.setDoctor(doctor);
        prescription.setPatient(patient);
        prescription.setMedicinePrescription(prescriptionMedicines);
        prescription.setAmount((int) totalPrice);
        prescription.setStatus(PaymentStatus.PENDING);
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        return prescriptionMapper.toPrescriptionResponse(savedPrescription);
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