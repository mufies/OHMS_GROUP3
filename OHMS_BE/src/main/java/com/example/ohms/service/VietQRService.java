package com.example.ohms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class VietQRService {

    @Value("${vietqr.clientId}")
    private String clientId;

    @Value("${vietqr.clientSecret}")
    private String clientSecret;
    
    @Value("${vietqr.checksumKey}")
    private String checksumKey;

    @Value("${vietqr.createQrUrl}")
    private String createQrUrl;

    private WebClient webClient = WebClient.create();
    
    private String generateSign(String clientId, String bankCode, String bankAccount, String amount, String content) {
        try {
            // Format: clientId|bankCode|bankAccount|amount|content|checksumKey
            String data = String.format("%s|%s|%s|%s|%s|%s", 
                clientId, bankCode, bankAccount, amount, content, checksumKey.trim());
            
            log.info("Sign data: {}", data);
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            
            String sign = hexString.toString();
            log.info("Generated sign: {}", sign);
            return sign;
        } catch (Exception e) {
            log.error("Error generating sign: ", e);
            return "";
        }
    }

    public Mono<Map<String, Object>> createQR(String bankCode, String bankAccount, long amount, String content, String userBankName) {
        log.info("Creating QR - URL: {}", createQrUrl);
        log.info("Creating QR - bankCode: {}, bankAccount: {}, amount: {}, content: {}, userBankName: {}", 
                bankCode, bankAccount, amount, content, userBankName);
        
        String amountStr = String.valueOf(amount);
        String sign = generateSign(clientId, bankCode, bankAccount, amountStr, content);
        
        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountStr);
        body.put("content", content);
        body.put("bankAccount", bankAccount);
        body.put("bankCode", bankCode);
        body.put("userBankName", userBankName);
        body.put("transType", "C"); // C: giao dịch đến
        body.put("qrType", "0");
        body.put("serviceCode", clientId); // Dùng clientId làm serviceCode
        body.put("sign", sign); // Chữ ký bắt buộc
        body.put("orderId", "");
        body.put("terminalCode", "");
        body.put("subTerminalCode", "");
        body.put("note", "");
        body.put("urlLink", "");
        body.put("additionalData", "");

        log.info("Request body: {}", body);

        return webClient.post()
                .uri(createQrUrl)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .cast(Map.class)
                .map(m -> {
                    log.info("QR creation response: {}", m);
                    return (Map<String, Object>) m;
                })
                .doOnError(e -> log.error("Error creating QR: ", e));
    }
}
