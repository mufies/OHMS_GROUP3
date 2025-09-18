package com.example.ohms.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
   USER_EXISTED( 1001,"user existed",HttpStatus.FOUND),
   USERNAME_INVALID(1002,"User name not vailid",HttpStatus.BAD_REQUEST),
   USERNAME_INVALIDS(1023,"User name must bigger than 6, understand?", HttpStatus.BAD_REQUEST),
   PASSWORD_INVALID(1003,"password invailid",HttpStatus.BAD_REQUEST),
   INVALID_KEY(1004,"Key error not existed",HttpStatus.BAD_REQUEST),
   USER_NOT_FOUND(2005,"User not found",HttpStatus.NOT_FOUND),
   UNKNOWN_ERROR(1006,"lỗi không xác định",HttpStatus.BAD_REQUEST),
   UNAUTHORIZED(1007,"Unauthorrize error",HttpStatus.UNAUTHORIZED),
   PERMISSION_NOT_FOUND(1010,"Permission not found",HttpStatus.NOT_FOUND),
   ROLE_NOT_FOUND(1011,"Role not found",HttpStatus.NOT_FOUND),
   EMAIL_NOT_VAILID(1008,"Email not vailid",HttpStatus.BAD_REQUEST),
   EMAIL_ERROR(1012,"Email can not send",HttpStatus.BAD_REQUEST),
   FILE_ERROR(1013,"File update error",HttpStatus.BAD_REQUEST),
   RESETCODE_ERROR(1014,"Reset code error",HttpStatus.BAD_REQUEST),
   SIGNAL_KEY_NOT_VAILID(1015,"Key error",HttpStatus.BAD_GATEWAY),
   SIGNKEY_ERROR(1016,"Parse error",HttpStatus.BAD_GATEWAY),
   API_NOT_FOUND(1017,"Wrong API !!",HttpStatus.BAD_GATEWAY),
   ILLEGAL_STATE(1018,"Illegal State",HttpStatus.BAD_REQUEST),
   FIELD_NOT_NULL(1022,"Some fields can not be null, pls recheck", HttpStatus.NOT_EXTENDED),
   TITTLE_NOT_NULL(1023,"Tittle not null",HttpStatus.BAD_REQUEST),
   IMAGE_NOT_NULL(1023,"Tittle not null",HttpStatus.BAD_REQUEST),
   NAME_NOT_NULL(1024,"Name not valid",HttpStatus.BAD_REQUEST),
   PRICE_NOT_NULL(1026,"Price not null",HttpStatus.BAD_REQUEST),
   TYPE_NOT_NULL(1029,"Type not valid",HttpStatus.BAD_REQUEST),
ROOM_CHAT_NOT_FOUND(1028,"Room chat not valid",HttpStatus.BAD_REQUEST),
MESSAGE_NOT_FOUND(1027,"Message not valid",HttpStatus.BAD_REQUEST),
MESSAGE_CANNOT_DELETE(1030,"Message must delete before 30m",HttpStatus.BAD_REQUEST),
OWNER_REUQEST_NOT_FOUND(1031,"Owner request not found",HttpStatus.BAD_REQUEST),
NOTIFICAION_NOT_FOUND(1032,"Notificaction not found", HttpStatus.BAD_REQUEST),
VALUE_ERROR(1032,"You have send this before, pls don't send twice", HttpStatus.BAD_REQUEST),
MEDICINE_EXITEDS(1033,"Medicine existed",HttpStatus.BAD_REQUEST),
MEDICINE_NOT_FOUND(1034,"Medicine not found",HttpStatus.BAD_REQUEST),
   UNAUTHENTICATED(1009,"UNAUTHENTICATED ERROR!!",HttpStatus.BAD_REQUEST);
   
   private int code;
   private String message;
   private HttpStatusCode statusCode;



}
