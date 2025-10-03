package com.example.ohms.dto.request;


import java.util.List;
import java.util.Set;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
@Data
@Builder
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class ConversationRequest {
   String message;
   String user;
   // cái này sẽ làm base 64, làm 1 list sau đó gửi tới clloudynary
 List<String> base64Datas;
}
