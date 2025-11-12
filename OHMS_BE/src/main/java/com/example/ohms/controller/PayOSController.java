package com.example.ohms.controller;

import com.example.ohms.dto.request.PaymentRequest;
import com.example.ohms.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.core.FileDownloadResponse;
import vn.payos.exception.APIException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.v2.paymentRequests.invoices.InvoicesInfo;
import vn.payos.model.webhooks.ConfirmWebhookResponse;
import vn.payos.model.webhooks.WebhookData;

import java.util.Map;

/**
 * PayOS Controller - Handle payment operations
 * Integrated with PayOS payment gateway
 */
@RestController
@RequestMapping("/api/v1/payos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PayOSController {

    private final PayOS payOS;


    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CreatePaymentLinkResponse>> createPaymentLink(
            @RequestBody PaymentRequest request) {
        
        log.info("Creating payment link for: {}", request.getProductName());
        
        try {
            final String productName = request.getProductName();
            final String description = request.getDescription();
            final String returnUrl = request.getReturnUrl();
            final String cancelUrl = request.getCancelUrl();
            final long price = request.getPrice();
            final long orderCode = System.currentTimeMillis() / 1000;
            
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(productName)
                    .quantity(1)
                    .price(price)
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .description(description)
                    .amount(price)
                    .item(item)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .build();

            CreatePaymentLinkResponse data = payOS.paymentRequests().create(paymentData);
            
            return ResponseEntity.ok(
                ApiResponse.<CreatePaymentLinkResponse>builder()
                    .code(200)
                    .message("Payment link created successfully")
                    .results(data)
                    .build()
            );
        } catch (Exception e) {
            log.error("Error creating payment link", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.<CreatePaymentLinkResponse>builder()
                    .code(500)
                    .message("Failed to create payment link: " + e.getMessage())
                    .build()
            );
        }
    }


    @GetMapping("/{orderCode}")
    public ResponseEntity<ApiResponse<PaymentLink>> getPaymentInfo(
            @PathVariable Long orderCode) {
        
        log.info("Getting payment info for order code: {}", orderCode);
        
        try {
            PaymentLink order = payOS.paymentRequests().get(orderCode);
            return ResponseEntity.ok(
                ApiResponse.<PaymentLink>builder()
                    .code(200)
                    .message("Payment info retrieved successfully")
                    .results(order)
                    .build()
            );
        } catch (Exception e) {
            log.error("Error getting payment info", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiResponse.<PaymentLink>builder()
                    .code(400)
                    .message("Failed to get payment info: " + e.getMessage())
                    .build()
            );
        }
    }


    @PutMapping("/{orderCode}")
    public ResponseEntity<ApiResponse<PaymentLink>> cancelPayment(
            @PathVariable Long orderCode,
            @RequestParam(required = false, defaultValue = "User cancelled") String reason) {
        
        log.info("Cancelling payment for order code: {} with reason: {}", orderCode, reason);
        
        try {
            PaymentLink order = payOS.paymentRequests().cancel(orderCode, reason);
            return ResponseEntity.ok(
                ApiResponse.<PaymentLink>builder()
                    .code(200)
                    .message("Payment cancelled successfully")
                    .results(order)
                    .build()
            );
        } catch (Exception e) {
            log.error("Error cancelling payment", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiResponse.<PaymentLink>builder()
                    .code(400)
                    .message("Failed to cancel payment: " + e.getMessage())
                    .build()
            );
        }
    }

    @PostMapping("/confirm-webhook")
    public ResponseEntity<ApiResponse<ConfirmWebhookResponse>> confirmWebhook(
            @RequestBody Map<String, String> requestBody) {
        
        log.info("Confirming webhook URL: {}", requestBody.get("webhookUrl"));
        
        try {
            ConfirmWebhookResponse result = payOS.webhooks().confirm(requestBody.get("webhookUrl"));
            return ResponseEntity.ok(
                ApiResponse.<ConfirmWebhookResponse>builder()
                    .code(200)
                    .message("Webhook confirmed successfully")
                    .results(result)
                    .build()
            );
        } catch (Exception e) {
            log.error("Error confirming webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.<ConfirmWebhookResponse>builder()
                    .code(500)
                    .message("Failed to confirm webhook: " + e.getMessage())
                    .build()
            );
        }
    }


    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<WebhookData>> handleWebhook(
            @RequestBody Object body) {
        
        log.info("Received PayOS webhook");
        
        try {
            // Verify webhook using PayOS SDK
            WebhookData webhookData = payOS.webhooks().verify(body);
            
            log.info("Webhook verified. Order Code: {}, Code: {}, Desc: {}", 
                    webhookData.getOrderCode(), 
                    webhookData.getCode(),
                    webhookData.getDesc());
            
            // Process payment if successful (code "00" = success)
            if ("00".equals(webhookData.getCode())) {
                log.info("Payment successful for order: {}", webhookData.getOrderCode());

                
                return ResponseEntity.ok(
                    ApiResponse.<WebhookData>builder()
                        .code(200)
                        .message("Webhook delivered - Payment confirmed")
                        .results(webhookData)
                        .build()
                );
            } else {
                log.warn("Payment not successful. Code: {}, Desc: {}", 
                        webhookData.getCode(),
                        webhookData.getDesc());
                
                return ResponseEntity.ok(
                    ApiResponse.<WebhookData>builder()
                        .code(200)
                        .message("Webhook received - Payment not successful")
                        .results(webhookData)
                        .build()
                );
            }
        } catch (Exception e) {
            log.error("Error processing webhook: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.<WebhookData>builder()
                    .code(500)
                    .message("Error processing webhook: " + e.getMessage())
                    .build()
            );
        }
    }

    @GetMapping("/{orderCode}/invoices")
    public ResponseEntity<ApiResponse<InvoicesInfo>> retrieveInvoices(
            @PathVariable Long orderCode) {
        
        log.info("Retrieving invoices for order code: {}", orderCode);
        
        try {
            InvoicesInfo invoicesInfo = payOS.paymentRequests().invoices().get(orderCode);
            return ResponseEntity.ok(
                ApiResponse.<InvoicesInfo>builder()
                    .code(200)
                    .message("Invoices retrieved successfully")
                    .results(invoicesInfo)
                    .build()
            );
        } catch (Exception e) {
            log.error("Error retrieving invoices", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ApiResponse.<InvoicesInfo>builder()
                    .code(400)
                    .message("Failed to retrieve invoices: " + e.getMessage())
                    .build()
            );
        }
    }

    @GetMapping("/{orderCode}/invoices/{invoiceId}/download")
    public ResponseEntity<?> downloadInvoice(
            @PathVariable Long orderCode,
            @PathVariable String invoiceId) {
        
        log.info("Downloading invoice {} for order code: {}", invoiceId, orderCode);
        
        try {
            FileDownloadResponse invoiceFile = 
                    payOS.paymentRequests().invoices().download(invoiceId, orderCode);

            if (invoiceFile == null || invoiceFile.getData() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ApiResponse.builder()
                        .code(404)
                        .message("Invoice not found or empty")
                        .build()
                );
            }

            ByteArrayResource resource = new ByteArrayResource(invoiceFile.getData());

            HttpHeaders headers = new HttpHeaders();
            String contentType = invoiceFile.getContentType() == null 
                    ? MediaType.APPLICATION_PDF_VALUE 
                    : invoiceFile.getContentType();
            headers.set(HttpHeaders.CONTENT_TYPE, contentType);
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + invoiceFile.getFilename() + "\"");
            if (invoiceFile.getSize() != null) {
                headers.setContentLength(invoiceFile.getSize());
            }

            return ResponseEntity.ok().headers(headers).body(resource);
            
        } catch (APIException e) {
            log.error("API error downloading invoice", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.builder()
                    .code(500)
                    .message(e.getErrorDesc().orElse(e.getMessage()))
                    .build()
            );
        } catch (Exception e) {
            log.error("Error downloading invoice", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.builder()
                    .code(500)
                    .message("Failed to download invoice: " + e.getMessage())
                    .build()
            );
        }
    }
}
