package com.example.ohms.dto.response;
import java.util.Set;

import com.example.ohms.enums.MedicalSpecialty;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class OfflineUserResponse {
    String id;
    String username;
    String imageUrl;
    Set<RoleResponse> roles;
    // Set<String> reviews; // những cái mảng nó sẽ ẩn trong mapper và gán lại ở service
    Integer phone;
}
