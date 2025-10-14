package com.example.ohms.configuration;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Slf4j
@Component
//  cái này sẽ check log http request xem nó có gọi đến không ấy
public class LoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {

        String url = request.getRequestURI();      // vd: /api/users
        String query = request.getQueryString();   // vd: name=abc&age=20

        if (query != null) {
            log.info("Incoming request: {} {}?{}", request.getMethod(), url, query);
        } else {
            log.info("Incoming request: {} {}", request.getMethod(), url);
        }

        return true; // cho phép tiếp tục xử lý
    }
}
