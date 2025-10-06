package com.example.ohms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ohms.dto.response.ApiResponse;
import com.example.ohms.dto.response.PaymentRespone;
import com.example.ohms.service.PaymentService;

import jakarta.servlet.http.HttpServletRequest;
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
    public ApiResponse<PaymentRespone> payCallbackHandler(HttpServletRequest request) {
        String status = request.getParameter("vnp_ResponseCode");
        if (status.equals("00")) {
            return ApiResponse.<PaymentRespone>builder()
                .code(200)
                .message("Payment successful")
                .results(new PaymentRespone("200","ok",""))
                .build();
        } else {
            return ApiResponse.<PaymentRespone>builder()
                .code(400)
                .message("Payment failed")
                .results(new PaymentRespone("200","ok",""))
                .build();
        }
    }
}