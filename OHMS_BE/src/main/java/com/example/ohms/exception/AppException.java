package com.example.ohms.exception;

public class AppException extends RuntimeException {
    public AppException(ErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
    }
    private ErrorCode errorCode;
    public ErrorCode getErrorCode() { 
        return errorCode;
    }
      public void setErrorCode(ErrorCode errorCode){
      this.errorCode = errorCode;
    }
}