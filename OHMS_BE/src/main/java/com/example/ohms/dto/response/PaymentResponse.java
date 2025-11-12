package com.example.ohms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String checkoutUrl;
    private Long orderCode;
    private String qrCode;
    private String paymentLinkId;
    private String status;
    private String message;
}
