package com.example.ohms.utils;

import org.springframework.util.SerializationUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Base64;
import java.util.Optional;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CookieUtils {

    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                log.debug("Found cookie: {} (value length: {})", name, cookie.getValue() != null ? cookie.getValue().length() : 0);
                return Optional.of(cookie);
            }
        }
        log.debug("No cookie: {}", name);
        return Optional.empty();
    }

    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge, boolean secure) {
        if (response == null) {
            log.warn("Cannot add cookie: No response");
            return;
        }
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setDomain("localhost");  // Fix: Explicit domain
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
        log.debug("Added cookie: {} (secure={}, maxAge={})", name, secure, maxAge);
    }

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        if (response == null) {
            log.warn("Cannot delete cookie {}: No response", name);
            return;
        }
        boolean secure = request.isSecure();  // Match add: false cho localhost
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (name.equals(cookie.getName())) {
                    // Fix: Value null, secure match, domain explicit
                    Cookie clearCookie = new Cookie(name, null);
                    clearCookie.setPath("/");
                    clearCookie.setDomain("localhost");
                    clearCookie.setHttpOnly(true);
                    clearCookie.setSecure(secure);
                    clearCookie.setMaxAge(0);
                    response.addCookie(clearCookie);
                    log.debug("Deleted cookie: {} (secure={})", name, secure);
                    return;
                }
            }
        }
        log.debug("No cookie to delete: {}", name);
    }

    public static String serialize(Object object) {
        if (object == null) return null;
        return Base64.getUrlEncoder().encodeToString(SerializationUtils.serialize(object));
    }

    public static <T> Optional<T> deserialize(Cookie cookie, Class<T> cls) {
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isEmpty()) {
            log.warn("Invalid cookie for deserialize: null/empty");
            return Optional.empty();
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(cookie.getValue());
            Object deserialized = SerializationUtils.deserialize(decoded);
            T result = cls.cast(deserialized);
            log.debug("Deserialized to: {}", cls.getSimpleName());
            return Optional.of(result);
        } catch (Exception e) {
            log.warn("Deserialize failed for {}: {}", cookie.getName(), e.getMessage());
            return Optional.empty();
        }
    }
}