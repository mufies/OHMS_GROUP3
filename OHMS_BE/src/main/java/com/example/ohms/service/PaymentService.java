package com.example.ohms.service;

import java.util.Map;
import org.springframework.stereotype.Service;

import com.example.ohms.configuration.PaymentConfig;
import com.example.ohms.dto.response.PaymentRespone;
import com.example.ohms.utils.PaymentUtils;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentConfig vnPayConfig;

    public PaymentRespone createVnPayPayment(HttpServletRequest request) {
        long amount = Integer.parseInt(request.getParameter("amount")) * 100L;
        String bankCode = request.getParameter("bankCode");
        Map<String, String> vnpParamsMap = vnPayConfig.getVNPayConfig();
        vnpParamsMap.put("vnp_Amount", String.valueOf(amount));
        if (bankCode != null && !bankCode.isEmpty()) {
            vnpParamsMap.put("vnp_BankCode", bankCode);
        }
        vnpParamsMap.put("vnp_IpAddr", PaymentUtils.getIpAddress(request));
        //build query url
        String queryUrl = PaymentUtils.getPaymentURL(vnpParamsMap, true);
        String hashData = PaymentUtils.getPaymentURL(vnpParamsMap, false);

        // log.info("hashdata: {}",hashData);
        String vnpSecureHash = PaymentUtils.hmacSHA512(vnPayConfig.getSecretKey(), hashData);
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;
        String paymentUrl = vnPayConfig.getUrl() + "?" + queryUrl;
        return PaymentRespone.builder()
                .code("200")
                .message("success")
                .paymentUrl(paymentUrl).build();
    }
    
}
