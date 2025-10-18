package com.example.ohms.controller;

import java.io.IOException;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.PaymentRespone;
import com.example.ohms.service.PaymentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${spring.application.api-prefix}/payment")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    @GetMapping("/vn-pay")
    public ApiResponse<PaymentRespone> pay(HttpServletRequest request) {

        // return new Ap<>(HttpStatus.OK, "Success", paymentService.createVnPayPayment(request));
        return ApiResponse.<PaymentRespone>builder()
        .code(200)
        .results(paymentService.createVnPayPayment(request))
        .build();
    }
    @GetMapping("/vn-pay-callback")
    public void payCallbackHandler(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String status = request.getParameter("vnp_ResponseCode");
        String vnp_TxnRef = request.getParameter("vnp_TxnRef");
        String vnp_Amount = request.getParameter("vnp_Amount");
        String vnp_TransactionNo = request.getParameter("vnp_TransactionNo");
        
        // Build frontend callback URL with payment info
        String frontendCallbackUrl = "http://localhost:5173/payment-callback";
        
        if (status.equals("00")) {
            // Payment success - redirect to frontend with success params
            String redirectUrl = String.format(
                "%s?status=success&vnp_ResponseCode=%s&vnp_TxnRef=%s&vnp_Amount=%s&vnp_TransactionNo=%s",
                frontendCallbackUrl, status, vnp_TxnRef, vnp_Amount, vnp_TransactionNo
            );
            response.sendRedirect(redirectUrl);
        } else {
            // Payment failed - redirect to frontend with failure params
            String redirectUrl = String.format(
                "%s?status=failure&vnp_ResponseCode=%s",
                frontendCallbackUrl, status
            );
            response.sendRedirect(redirectUrl);
        }
    }

}