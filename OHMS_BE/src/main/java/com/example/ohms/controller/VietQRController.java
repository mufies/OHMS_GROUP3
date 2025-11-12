package com.example.ohms.controller;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.ohms.service.VietQRService;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/vietqr")
public class VietQRController {

    @Autowired
    private VietQRService vietQRService;

    @PostMapping("/create-qr")
    public ResponseEntity<?> createQR(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received VietQR request: {}", request);
            
            // Parse bankCode (bank_id trong request cũ)
            String bankCode = (String) request.getOrDefault("bank_code", "mbbank");
            if (request.containsKey("bank_id")) {
                bankCode = (String) request.get("bank_id");
            }
            
            // Parse bankAccount (account_no trong request cũ)
            String bankAccount;
            Object accNoObj = request.containsKey("bank_account") ? request.get("bank_account") : request.get("account_no");
            if (accNoObj instanceof String) {
                bankAccount = (String) accNoObj;
            } else if (accNoObj instanceof Number) {
                bankAccount = String.valueOf(accNoObj);
            } else {
                bankAccount = null;
            }
            
            // Parse amount
            final Long amount;
            Object amt = request.get("amount");
            if (amt instanceof Number) {
                amount = ((Number) amt).longValue();
            } else if (amt instanceof String) {
                Long tempAmt = null;
                try { tempAmt = Long.parseLong((String) amt); } catch (Exception ignored) {}
                amount = tempAmt;
            } else {
                amount = null;
            }
            
            // Parse content (description trong request cũ)
            String content = request.containsKey("content") ? 
                (String) request.get("content") : 
                (String) request.get("description");
            
            // Parse userBankName (tên chủ tài khoản)
            String userBankName = (String) request.getOrDefault("user_bank_name", "");

            log.info("Parsed params - bankCode: {}, bankAccount: {}, amount: {}, content: {}, userBankName: {}", 
                    bankCode, bankAccount, amount, content, userBankName);

            if (bankAccount == null || amount == null || content == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin: bankAccount, amount, content"));
            }

            log.info("Creating QR code...");
            Map<String, Object> response = vietQRService.createQR(bankCode, bankAccount, amount, content, userBankName).block();
            log.info("QR response: {}", response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating QR: ", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage(), "details", e.toString()));
        }
    }


    @PostMapping("/callback")
    public ResponseEntity<String> callback(@RequestBody Map<String, Object> callbackData) {
        System.out.println("VietQR callback data: " + callbackData);

        return ResponseEntity.ok("success");
    }
}
