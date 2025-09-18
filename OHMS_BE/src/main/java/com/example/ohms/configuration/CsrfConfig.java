package com.example.ohms.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration // lớp cấu hình
public class CsrfConfig { 
// này handle cái cokkie, đề phòng bên thằng chrome bắt lỗi cokkie nó không request được
// còn dùng cốc cốc thì không có lỗi này
    @Bean
    public CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repo.setCookieName("XSRF-TOKEN");
        repo.setSecure(true); 
        return repo;
    }
}