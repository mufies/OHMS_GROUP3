package com.example.ohms.dto.request;

import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
   @RequiredArgsConstructor
   @FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class AuthenticationRequest {
   String email;
   String password;
}
