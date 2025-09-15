package com.example.ohms.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder // biến thằng response thành cái builder
public class ApiResponse<T> {
   private int code;
   private String message;
   private T results;
}
