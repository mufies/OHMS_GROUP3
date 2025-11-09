package com.example.ohms.dto.request;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class DiagnosisRequest {
    // Thông điệp người dùng (mô tả triệu chứng, hỏi bệnh,...)
    private String message;

    private Map<String, String> patientInfo;

    private List<ChatTurn> history;
    
    // Thêm patientId để lấy medical records
    private String patientId;

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

    public List<ChatTurn> getHistory() {
        return history;
    }

    public void setHistory(List<ChatTurn> history) {
        this.history = history;
    }
    
    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    /**
     * Trả về bản sao rút gọn của history, chỉ giữ lại N lượt gần nhất để tránh prompt quá dài.
     */
    public List<ChatTurn> getRecentHistory(int maxTurns) {
        if (history == null || history.isEmpty()) return Collections.emptyList();
        int n = Math.max(0, history.size() - maxTurns);
        return new ArrayList<>(history.subList(n, history.size()));
    }

    /**
     * Một lượt chat trong hội thoại.
     * sender: "user" hoặc "ai"
     */
    public static class ChatTurn {
        private String sender;
        private String text;

        public ChatTurn() {}

        public ChatTurn(String sender, String text) {
            this.sender = sender;
            this.text = text;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }
}
