package com.example.ohms.dto.request;
import java.util.Map;

public class DiagnosisRequest {
    // Thông điệp người dùng (mô tả triệu chứng, hỏi bệnh,...)
    private String message;

    // Thông tin bệnh nhân tuỳ chọn (tuổi, giới tính, bệnh nền, thuốc đang dùng,...)
    private Map<String, String> patientInfo;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, String> getPatientInfo() {
        return patientInfo;
    }

    public void setPatientInfo(Map<String, String> patientInfo) {
        this.patientInfo = patientInfo;
    }
}