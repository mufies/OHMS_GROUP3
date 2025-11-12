package com.example.ohms.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Configuration
public class PayOSConfig {

    @Value("${vietqr.clientId}")
    private String clientId;

    @Value("${vietqr.clientSecret}")
    private String apiKey;

    @Value("${vietqr.checksumKey}")
    private String checksumKey;

    @Bean
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}
