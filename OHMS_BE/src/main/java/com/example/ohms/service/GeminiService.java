package com.example.ohms.service;

import com.example.ohms.dto.request.DiagnosisRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Objects;
import java.util.StringJoiner;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Autowired
    private UserService userService;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public GeminiService(RestTemplate restTemplate, UserService userService) {
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
        this.userService = userService;
    }

    public GeminiService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateDiagnosisReply(DiagnosisRequest request) throws Exception {
        if (apiKey == null || apiKey.isEmpty())
            throw new IllegalStateException("Gemini API key chưa cấu hình");

        String prompt = buildPrompt(request);
        JsonNode payload = buildPayload(prompt, 4096); // token lớn để không bị MAX_TOKENS

        String apiURL = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> httpEntity = new HttpEntity<>(mapper.writeValueAsString(payload), headers);

        ResponseEntity<String> resp = restTemplate.exchange(apiURL, HttpMethod.POST, httpEntity, String.class);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Gemini API trả về lỗi: " + resp.getStatusCodeValue() + " body: " + resp.getBody());
        }

        JsonNode root = mapper.readTree(resp.getBody());
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && candidates.size() > 0) {
            return extractText(candidates.get(0));
        }

        throw new RuntimeException("Không thể parse response từ Gemini: " + resp.getBody());
    }

    private String extractText(JsonNode candidate) {
        JsonNode content = candidate.path("content");
        JsonNode parts = content.path("parts");
        if (parts.isArray() && parts.size() > 0) {
            JsonNode textNode = parts.get(0).path("text");
            if (!textNode.isMissingNode() && !textNode.asText().isBlank()) return textNode.asText();
        }
        JsonNode textNode = content.path("text");
        if (!textNode.isMissingNode() && !textNode.asText().isBlank()) return textNode.asText();
        return "Không nhận được kết quả từ Gemini";
    }

    private JsonNode buildPayload(String prompt, int maxOutputTokens) {
        var root = mapper.createObjectNode();
        var contents = mapper.createArrayNode();
        var contentObj = mapper.createObjectNode();
        var parts = mapper.createArrayNode();
        var textPart = mapper.createObjectNode().put("text", prompt);
        parts.add(textPart);
        contentObj.set("parts", parts);
        contents.add(contentObj);
        root.set("contents", contents);

        var config = mapper.createObjectNode();
        config.put("temperature", 0.3);
        config.put("topK", 20);
        config.put("topP", 0.6);
        config.put("maxOutputTokens", maxOutputTokens);
        root.set("generationConfig", config);

        return root;
    }

    private String buildPrompt(DiagnosisRequest request) {
        StringJoiner sj = new StringJoiner("\n");
        sj.add("Bạn là bác sĩ lâm sàng có kinh nghiệm. Trả lời bằng tiếng Việt, ngắn gọn.");
        sj.add("Mục tiêu: Chẩn đoán sơ bộ dựa trên triệu chứng hiện có, kèm theo gợi ý khám/xét nghiệm và cảnh báo dấu hiệu cấp cứu.");
        sj.add("");
        sj.add("Thông tin bệnh nhân:");
        if (request.getPatientInfo() != null && !request.getPatientInfo().isEmpty()) {
            for (Map.Entry<String, String> e : request.getPatientInfo().entrySet()) {
                sj.add("- " + e.getKey() + ": " + e.getValue());
            }
        } else {
            sj.add("- Không có thông tin bổ sung.");
        }
        sj.add("");
        sj.add("Triệu chứng từ người dùng:");
        sj.add(Objects.requireNonNullElse(request.getMessage(), "Không có thông tin triệu chứng."));
       sj.add("");
        sj.add("HƯỚNG DẪN TRẢ LỜI:");
           sj.add("hỏi lại người dùng nếu chưa rõ, đề xuất những câu hỏi như, đau ở đâu, đau như nào, đau thế nào, dạo này có cảm thấy gì không, nếu cảm thấy đủ dữ kiện, ngay lập tức respose ra form dưới");
        sj.add("1) Trả lời ngay, hỏi thêm triệu chứng nếu chưa đủ.");
        sj.add("2) Trả lời theo 3 phần:");
        sj.add("   - CHẨN ĐOÁN SƠ BỘ: liệt kê 1-2 khả năng cao nhất");
        sj.add("   - ĐỀ XUẤT KHÁM/XÉT NGHIỆM: chuyên khoa, mức độ khẩn cấp");
        sj.add("   - CẦN CẤP CỨU NGAY NẾU: dấu hiệu nguy hiểm cần đi cấp cứu");
        sj.add("Trả lời ngắn gọn, súc tích, KHÔNG giải thích dài dòng, KHÔNG nối token.");
      
        return sj.toString();
    }
}
