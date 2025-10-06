package com.example.ohms.configuration;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import com.example.ohms.utils.PaymentUtils;

import lombok.Getter;
import lombok.Setter;
import jakarta.annotation.PostConstruct;

@Configuration
@Getter
@Setter
@ConfigurationProperties(prefix = "payment.vn-pay")
public class PaymentConfig {

    private String url;
    private String returnUrl;
    private String tmnCode;
    private String secretKey;
    private String version;
    private String command;
    private String orderType;
    
    @PostConstruct
    public void debugConfig() {
        System.out.println("=== PaymentConfig Debug ===");
        System.out.println("URL: " + url);
        System.out.println("TMN Code: " + tmnCode);
        System.out.println("Return URL: " + returnUrl);
        System.out.println("Version: " + version);
        System.out.println("==========================");
    }
    
    public Map<String, String> getVNPayConfig() {
    Map<String, String> vnpParamsMap = new HashMap<>();
    vnpParamsMap.put("vnp_Version", this.version);
    vnpParamsMap.put("vnp_Command", this.command);
    vnpParamsMap.put("vnp_TmnCode", this.tmnCode);
    vnpParamsMap.put("vnp_CurrCode", "VND");
    vnpParamsMap.put("vnp_TxnRef",  PaymentUtils.getRandomNumber(8));
    vnpParamsMap.put("vnp_OrderInfo", "Thanh toan don hang:" +  PaymentUtils.getRandomNumber(8));
    vnpParamsMap.put("vnp_OrderType", this.orderType);
    vnpParamsMap.put("vnp_Locale", "vn");
    vnpParamsMap.put("vnp_ReturnUrl", this.returnUrl);
    Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
    SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
    String vnpCreateDate = formatter.format(calendar.getTime());
    vnpParamsMap.put("vnp_CreateDate", vnpCreateDate);
    calendar.add(Calendar.MINUTE, 15);
    String vnp_ExpireDate = formatter.format(calendar.getTime());
    vnpParamsMap.put("vnp_ExpireDate", vnp_ExpireDate);
    return vnpParamsMap;
    }
}
