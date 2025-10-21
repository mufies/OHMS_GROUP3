package com.example.ohms.service;

import java.security.SecureRandom;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.StringJoiner;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.util.CollectionUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ohms.exception.AppException;
import com.example.ohms.dto.request.AuthenticationRequest;
import com.example.ohms.dto.request.IntroSpectRequest;
import com.example.ohms.dto.response.AuthenticationResponse;
import com.example.ohms.dto.response.IntroSpectResponse;
import com.example.ohms.entity.User;
import com.example.ohms.enums.AuthProvider;
import com.example.ohms.exception.ErrorCode;
import com.example.ohms.repository.UserRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthenticationService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    @NonFinal // đánh dấu nonfinal để nó không inject vào lombok ở trên
    protected static final String SIGNAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    private static final int DEFAULT_LENGTH = 12; // độ dài password
    private static final SecureRandom random = new SecureRandom();

    public AuthenticationResponse loginUser(AuthenticationRequest authenticationRequest) {
        // log.error("aaaaaaaaaaaaaaaaaaaaaaa{}", authenticationRequest);
        User user = userRepository.findByEmailWithRoles(authenticationRequest.getEmail()) // Sửa: Dùng fetch with roles
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        boolean results = passwordEncoder.matches(authenticationRequest.getPassword(), user.getPassword());
        if (!results) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var token = generateToken(user);
        return AuthenticationResponse.builder().authenticated(results).token(token).build();
    }

    @Transactional(readOnly = true) // Thêm: Mở session để lazy load nếu cần, nhưng ưu tiên eager
    private String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);
        // claim 
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                // đại diện cho user đăng nhập 
                .subject(user.getId())
                //.issuer(name) //  xác định token được issuer từ ai, thông thường nó sẽ lấy từ domain service
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(30, ChronoUnit.DAYS).toEpochMilli()
                ))
                .claim("scope", buildScope(user))
                .claim("userId", user.getId()) // mã hóa cái thông tin mà người đăng nhập nhét vào

                .build();
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNAL_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException args) {
            throw new AppException(ErrorCode.SIGNAL_KEY_NOT_VAILID);
        }
        // kí khóa giải mã mã hóa, này dùng khóa đối xứng
    }

    public String generateTokenFromOAuth2(User user) {
        // Reload user với roles để đảm bảo eager fetch (nếu caller pass user chưa load roles)
        User loadedUser = userRepository.findByEmailWithRoles(user.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return generateToken(loadedUser);
    }

    public String buildScope(User user) { // ép
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(user.getRoles()))
            user.getRoles().forEach(role -> {
                stringJoiner.add("ROLE_" + role.getName().toLowerCase()); // Thêm prefix ROLE_ chuẩn Spring
                if (!CollectionUtils.isEmpty(role.getPermissions()))
                    role.getPermissions().forEach(permission ->
                            stringJoiner.add(permission.getName())  // 
                    );
            });
        return stringJoiner.toString();
    }

    public IntroSpectResponse introspect(IntroSpectRequest request)
            throws JOSEException, ParseException {
        String token = request.getToken();

        // Tạo verifier với secret key
        JWSVerifier verifier = new MACVerifier(SIGNAL_KEY.getBytes());

        // Parse token (Signed JWT)
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Lấy thời gian hết hạn từ payload
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        // Xác thực chữ ký
        boolean verified = signedJWT.verify(verifier);

        // Trả về kết quả introspection
        return IntroSpectResponse.builder()
                .valid(verified && expiryTime.after(new Date()))
                .build();
    }

}