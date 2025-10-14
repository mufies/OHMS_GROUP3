package com.example.ohms.exception;

import java.io.IOException;
import java.nio.file.AccessDeniedException;
import java.text.ParseException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.example.ohms.dto.response.ApiResponse;
import com.nimbusds.jose.JOSEException;

import jakarta.mail.MessagingException;

@ControllerAdvice
public class GlobalExceptionHandle {
   @ExceptionHandler(value = RuntimeException.class)
   // khi mình khai báo như này thì nó tự lấy thông tin của thằng truyền vào và nhả ra cái đẹp hơn
      ResponseEntity<ApiResponse> handlingRuntimeException(RuntimeException exception){
            ApiResponse apiResponse = new ApiResponse<>();
            apiResponse.setCode(200);
            apiResponse.setMessage("Lỗi Không Xác Định");
            return ResponseEntity.badRequest().body(apiResponse);
      }
   @ExceptionHandler(value = AppException.class)
      ResponseEntity<ApiResponse> handlingAppException(AppException exception){
            ApiResponse apiResponse = new ApiResponse<>();
            ErrorCode errorCode = exception.getErrorCode();
            // get code là ở chỗ ErroCode đấy
            apiResponse.setCode(errorCode.getCode());
            apiResponse.setMessage(errorCode.getMessage());
            return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
      }

 @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
public ResponseEntity<ApiResponse> handleAccessDenied(RuntimeException exception) {
    ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
    return ResponseEntity.status(errorCode.getStatusCode()).body(
        ApiResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .build()
    );
}


      // handle valid error và lỗi không xác định 
   @ExceptionHandler(value =  MethodArgumentNotValidException.class)
   ResponseEntity<ApiResponse> handlingMethodArgurmentException(MethodArgumentNotValidException exception){
      ApiResponse apiResponse = new ApiResponse<>();
            String enumKey = exception.getFieldError().getDefaultMessage(); 
            // chỗ này nó đang lây cái error code, chính xác thì nó lấy luôn cả cái key của error code để nhét vào
            ErrorCode errorCode = ErrorCode.UNKNOWN_ERROR;
        try {
       errorCode = ErrorCode.valueOf(enumKey);
       
    } catch (IllegalArgumentException ex) {
       errorCode = ErrorCode.UNKNOWN_ERROR; // fallback nếu không có enum tương ứng
    }
            apiResponse.setCode(errorCode.getCode());
            apiResponse.setMessage(errorCode.getMessage());
         return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
   }
   // MessagingException chỗ này tí thử xong add vào
   @ExceptionHandler(value = MessagingException.class)
   ResponseEntity<ApiResponse> handlingMessagingException(MessagingException exception){
       ErrorCode errorCode = ErrorCode.EMAIL_ERROR;
    return ResponseEntity.status(errorCode.getStatusCode()).body(
        ApiResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .build()
    );
   }
   // IOException
      @ExceptionHandler(value = IOException.class)
   ResponseEntity<ApiResponse> handlingIOException(IOException exception){
       ErrorCode errorCode = ErrorCode.EMAIL_ERROR;
    return ResponseEntity.status(errorCode.getStatusCode()).body(
        ApiResponse.builder()
            .code(errorCode.getCode())
            .message(errorCode.getMessage())
            .build()
    );
   }
   // JOSEException
   @ExceptionHandler(value = JOSEException.class)
   ResponseEntity<ApiResponse> handingJOSEException(JOSEException exception){
      ErrorCode errorCode = ErrorCode.SIGNAL_KEY_NOT_VAILID;
      return ResponseEntity.status(errorCode.getStatusCode()).body(
         ApiResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build()
      );
   }
   // ParseException
   @ExceptionHandler(value = ParseException.class)
    ResponseEntity<ApiResponse> handingParseException(ParseException exception){
      ErrorCode errorCode = ErrorCode.SIGNAL_KEY_NOT_VAILID;
      return ResponseEntity.status(errorCode.getStatusCode()).body(
         ApiResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build()
      );
   }
   // NoResourceFoundException
   @ExceptionHandler(value = NoResourceFoundException.class)
    ResponseEntity<ApiResponse> handingNoResourceFoundException(NoResourceFoundException exception){
      ErrorCode errorCode = ErrorCode.API_NOT_FOUND;
      return ResponseEntity.status(errorCode.getStatusCode()).body(
         ApiResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build()
      );
   }
   //IllegalStateException
    @ExceptionHandler(value = IllegalStateException.class)
    ResponseEntity<ApiResponse> handingIllegalStateException(IllegalStateException exception){
      ErrorCode errorCode = ErrorCode.ILLEGAL_STATE;
      return ResponseEntity.status(errorCode.getStatusCode()).body(
         ApiResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build()
      );
   }
   //ExceptionHandlerExceptionResolver
   @ExceptionHandler(value = DataIntegrityViolationException.class)
   ResponseEntity<ApiResponse> handlingExceptionHandlerExceptionResolver(DataIntegrityViolationException exception){
      ErrorCode errorCode = ErrorCode.VALUE_ERROR;
      return ResponseEntity.status(errorCode.getStatusCode()).body(
         ApiResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build()
      );
   }
   // HttpRequestMethodNotSupportedException
     @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
   ResponseEntity<ApiResponse> handlingHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException exception){
      ErrorCode errorCode = ErrorCode.METHOD_NOT_ALLOW;
      return ResponseEntity.status(errorCode.getStatusCode()).body(
         ApiResponse.builder().code(errorCode.getCode()).message(errorCode.getMessage()).build()
      );
   }
}
