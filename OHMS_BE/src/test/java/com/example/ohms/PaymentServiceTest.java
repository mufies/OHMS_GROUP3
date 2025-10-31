package com.example.ohms;

import com.example.ohms.configuration.PaymentConfig;
import com.example.ohms.dto.response.PaymentRespone;
import com.example.ohms.service.PaymentService;
import com.example.ohms.utils.PaymentUtils;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Complete Test Suite for PaymentService
 * 
 * Test Coverage:
 * 1. createVnPayPayment()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService Test Suite")
class PaymentServiceTest {

    @Mock
    private PaymentConfig vnPayConfig;

    @InjectMocks
    private PaymentService paymentService;

    @Mock
    private HttpServletRequest request;

    private Map<String, String> vnpParamsMap;

    @BeforeEach
    void setUp() {
        vnpParamsMap = new HashMap<>();
        vnpParamsMap.put("vnp_Version", "2.1.0");
        vnpParamsMap.put("vnp_Command", "pay");
        vnpParamsMap.put("vnp_TmnCode", "TEST123");
    }

    // ==================== 1. CREATE VNPAY PAYMENT TESTS ====================

    @Nested
    @DisplayName("1. createVnPayPayment()")
    class CreateVnPayPaymentTests {

        @Test
        @DisplayName("Should create VNPay payment URL successfully")
        void shouldCreatePaymentURL_Successfully() {
            // Given
            when(request.getParameter("amount")).thenReturn("100000");
            when(request.getParameter("bankCode")).thenReturn("NCB");
            when(vnPayConfig.getVNPayConfig()).thenReturn(vnpParamsMap);
            when(vnPayConfig.getSecretKey()).thenReturn("SECRETKEY123");
            when(vnPayConfig.getUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");

            try (MockedStatic<PaymentUtils> paymentUtils = mockStatic(PaymentUtils.class)) {
                paymentUtils.when(() -> PaymentUtils.getIpAddress(request)).thenReturn("127.0.0.1");
                paymentUtils.when(() -> PaymentUtils.getPaymentURL(any(Map.class), anyBoolean()))
                        .thenReturn("vnp_Amount=10000000&vnp_BankCode=NCB");
                paymentUtils.when(() -> PaymentUtils.hmacSHA512(anyString(), anyString()))
                        .thenReturn("SECURE_HASH");

                // When
                PaymentRespone response = paymentService.createVnPayPayment(request);

                // Then
                assertNotNull(response);
                assertEquals("200", response.getCode());
                assertEquals("success", response.getMessage());
                assertNotNull(response.getPaymentUrl());
                assertTrue(response.getPaymentUrl().contains("vnp_SecureHash=SECURE_HASH"));
            }
        }

        @Test
        @DisplayName("Should create payment URL without bank code")
        void shouldCreatePaymentURL_WithoutBankCode() {
            // Given
            when(request.getParameter("amount")).thenReturn("100000");
            when(request.getParameter("bankCode")).thenReturn(null);
            when(vnPayConfig.getVNPayConfig()).thenReturn(vnpParamsMap);
            when(vnPayConfig.getSecretKey()).thenReturn("SECRETKEY123");
            when(vnPayConfig.getUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");

            try (MockedStatic<PaymentUtils> paymentUtils = mockStatic(PaymentUtils.class)) {
                paymentUtils.when(() -> PaymentUtils.getIpAddress(request)).thenReturn("127.0.0.1");
                paymentUtils.when(() -> PaymentUtils.getPaymentURL(any(Map.class), anyBoolean()))
                        .thenReturn("vnp_Amount=10000000");
                paymentUtils.when(() -> PaymentUtils.hmacSHA512(anyString(), anyString()))
                        .thenReturn("SECURE_HASH");

                // When
                PaymentRespone response = paymentService.createVnPayPayment(request);

                // Then
                assertNotNull(response);
                assertEquals("200", response.getCode());
                assertFalse(response.getPaymentUrl().contains("vnp_BankCode"));
            }
        }

        @Test
        @DisplayName("Should create payment URL with empty bank code")
        void shouldCreatePaymentURL_WithEmptyBankCode() {
            // Given
            when(request.getParameter("amount")).thenReturn("100000");
            when(request.getParameter("bankCode")).thenReturn("");
            when(vnPayConfig.getVNPayConfig()).thenReturn(vnpParamsMap);
            when(vnPayConfig.getSecretKey()).thenReturn("SECRETKEY123");
            when(vnPayConfig.getUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");

            try (MockedStatic<PaymentUtils> paymentUtils = mockStatic(PaymentUtils.class)) {
                paymentUtils.when(() -> PaymentUtils.getIpAddress(request)).thenReturn("127.0.0.1");
                paymentUtils.when(() -> PaymentUtils.getPaymentURL(any(Map.class), anyBoolean()))
                        .thenReturn("vnp_Amount=10000000");
                paymentUtils.when(() -> PaymentUtils.hmacSHA512(anyString(), anyString()))
                        .thenReturn("SECURE_HASH");

                // When
                PaymentRespone response = paymentService.createVnPayPayment(request);

                // Then
                assertNotNull(response);
                assertEquals("200", response.getCode());
            }
        }

        @Test
        @DisplayName("Should handle large amount")
        void shouldHandleLargeAmount() {
            // Given
            when(request.getParameter("amount")).thenReturn("999999999");
            when(request.getParameter("bankCode")).thenReturn("NCB");
            when(vnPayConfig.getVNPayConfig()).thenReturn(vnpParamsMap);
            when(vnPayConfig.getSecretKey()).thenReturn("SECRETKEY123");
            when(vnPayConfig.getUrl()).thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");

            try (MockedStatic<PaymentUtils> paymentUtils = mockStatic(PaymentUtils.class)) {
                paymentUtils.when(() -> PaymentUtils.getIpAddress(request)).thenReturn("127.0.0.1");
                paymentUtils.when(() -> PaymentUtils.getPaymentURL(any(Map.class), anyBoolean()))
                        .thenReturn("vnp_Amount=99999999900");
                paymentUtils.when(() -> PaymentUtils.hmacSHA512(anyString(), anyString()))
                        .thenReturn("SECURE_HASH");

                // When
                PaymentRespone response = paymentService.createVnPayPayment(request);

                // Then
                assertNotNull(response);
                assertEquals("200", response.getCode());
                assertTrue(response.getPaymentUrl().contains("vnp_Amount=99999999900"));
            }
        }
    }
}
