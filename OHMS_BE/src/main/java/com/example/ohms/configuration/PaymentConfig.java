package com.example.ohms.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@Getter
@Setter
@ConfigurationProperties(prefix = "cas.api")
public class PaymentConfig {
    private String clientId;
    private String secretKey;
    private String baseUrl;
    private String webhookUrl;
    
}
