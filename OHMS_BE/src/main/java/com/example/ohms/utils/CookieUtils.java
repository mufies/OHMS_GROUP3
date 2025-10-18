package com.example.ohms.utils;

import org.springframework.util.SerializationUtils;
import jakarta.servlet.http.Cookie;  // Thay javax -> jakarta
import jakarta.servlet.http.HttpServletRequest;  // Thay javax -> jakarta
import jakarta.servlet.http.HttpServletResponse;  // Thay javax -> jakarta
import java.util.Base64;
import java.util.Optional;

public class CookieUtils {

    /**
     * Retrieves a cookie by name from the request.
     */
    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Adds a cookie to the response with security defaults.
     * @param secure Set to true for HTTPS-only cookies.
     */
    public static void addCookie(HttpServletResponse response, String name, String value, int maxAge, boolean secure) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);  // Only send over HTTPS
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
    }

    /**
     * Deletes a cookie by name.
     */
    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    cookie.setHttpOnly(true);
                    cookie.setSecure(true);  // Match addCookie defaults
                    response.addCookie(cookie);
                }
            }
        }
    }

    /**
     * Serializes an object to Base64 URL-encoded string.
     */
    public static String serialize(Object object) {
        return Base64.getUrlEncoder()
                .encodeToString(SerializationUtils.serialize(object));
    }

    /**
     * Deserializes a cookie value to the specified class, with error handling.
     */
    public static <T> Optional<T> deserialize(Cookie cookie, Class<T> cls) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(cookie.getValue());
            Object deserialized = SerializationUtils.deserialize(decoded);
            return Optional.ofNullable(cls.cast(deserialized));
        } catch (Exception e) {
            // Log if needed: log.warn("Failed to deserialize cookie: {}", e.getMessage());
            return Optional.empty();
        }
    }
}