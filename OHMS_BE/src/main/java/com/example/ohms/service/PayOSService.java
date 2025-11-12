package com.example.ohms.service;

import com.example.ohms.dto.request.PaymentRequest;
import com.example.ohms.dto.response.PaymentResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSService {

    private final PayOS payOS;
    private final ObjectMapper objectMapper;


    public PaymentResponse createPaymentLink(PaymentRequest request) {
        try {
            long orderCode = System.currentTimeMillis() / 1000;

            long totalAmount = request.getPrice() != null ? request.getPrice() : 0;
            
            PaymentLinkItem item = null;
            if (request.getItems() != null && !request.getItems().isEmpty()) {
                // Calculate from items
                totalAmount = 0;
                var firstItem = request.getItems().get(0);
                totalAmount = firstItem.getPrice() * firstItem.getQuantity();
                item = PaymentLinkItem.builder()
                        .name(firstItem.getName())
                        .quantity(firstItem.getQuantity())
                        .price((long) firstItem.getPrice())
                        .build();
            } else {
                // Single item
                item = PaymentLinkItem.builder()
                        .name(request.getProductName() != null ? 
                              request.getProductName() : "Thanh toán")
                        .quantity(1)
                        .price(totalAmount)
                        .build();
            }

            // Build CreatePaymentLinkRequest
            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(totalAmount)
                    .description(request.getDescription() != null ? 
                            request.getDescription() : "Thanh toán đơn hàng")
                    .item(item)
                    .returnUrl(request.getReturnUrl())
                    .cancelUrl(request.getCancelUrl())
                    .build();

            log.info("Creating payment link: orderCode={}, amount={}", orderCode, totalAmount);

            // Call PayOS SDK
            CreatePaymentLinkResponse responseData = payOS.paymentRequests().create(paymentData);

            log.info("Payment link created successfully: {}", responseData.getCheckoutUrl());

            return PaymentResponse.builder()
                    .checkoutUrl(responseData.getCheckoutUrl())
                    .orderCode(orderCode)
                    .qrCode(responseData.getQrCode())
                    .status("SUCCESS")
                    .message("Payment link created successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error creating payment link", e);
            return PaymentResponse.builder()
                    .status("ERROR")
                    .message("Failed to create payment link: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Get payment link information
     */
    public PaymentLink getPaymentInfo(Long orderCode) throws Exception {
        log.info("Getting payment info for orderCode: {}", orderCode);
        return payOS.paymentRequests().get(orderCode);
    }

    /**
     * Cancel payment link
     */
    public PaymentLink cancelPayment(Long orderCode, String reason) throws Exception {
        log.info("Cancelling payment: orderCode={}, reason={}", orderCode, reason);
        return payOS.paymentRequests().cancel(orderCode, reason);
    }

    /**
     * Verify webhook from PayOS
     */
    public WebhookData verifyWebhook(Object body) throws Exception {
        log.info("Verifying webhook data...");
        
        // PayOS SDK verifies signature automatically
        WebhookData webhookData = payOS.webhooks().verify(body);
        
        log.info("Webhook verified successfully: orderCode={}", 
                webhookData.getOrderCode());
        
        return webhookData;
    }

    /**
     * Process successful payment
     */
    public void processSuccessfulPayment(WebhookData webhookData) {
        try {
            log.info("Processing successful payment:");
            log.info("Webhook data: {}", objectMapper.writeValueAsString(webhookData));
            log.info("- Order Code: {}", webhookData.getOrderCode());
            log.info("- Amount: {} VND", webhookData.getAmount());
            log.info("- Description: {}", webhookData.getDescription());
            log.info("- Reference: {}", webhookData.getReference());
            

            
        } catch (Exception e) {
            log.error("Error processing successful payment: ", e);
        }
    }
}

