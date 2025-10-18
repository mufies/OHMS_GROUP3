package com.example.ohms.service;

import com.example.ohms.dto.request.DiagnosisRequest;
import com.example.ohms.dto.response.SpecialtyRecommendationResponse;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.enums.MedicalSpecialty;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    // Có thể thay đổi giữa: gemini-2.5-flash / gemini-2.0-pro nếu cần
    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Autowired
    private UserService userService;

    @Autowired
    private MedicleExaminatioRepository medicalExaminationRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public GeminiService(RestTemplate restTemplate, UserService userService, MedicleExaminatioRepository medicalExaminationRepository) {
        this.restTemplate = (restTemplate != null ? restTemplate : new RestTemplate());
        this.userService = userService;
        this.medicalExaminationRepository = medicalExaminationRepository;
    }

    public GeminiService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateDiagnosisReply(DiagnosisRequest request) throws Exception {
        if (apiKey == null || apiKey.isEmpty())
            throw new IllegalStateException("Gemini API key chưa cấu hình");

        String prompt = buildPrompt(request);
        JsonNode payload = buildPayload(prompt, 4096); // đủ lớn để tránh cắt cụt [web:3][web:10]

        String apiURL = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;

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
        // Nối toàn bộ parts.text để không mất đoạn [web:3][web:10]
        JsonNode parts = candidate.path("content").path("parts");
        if (parts.isArray() && parts.size() > 0) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode p : parts) {
                JsonNode t = p.path("text");
                if (!t.isMissingNode()) {
                    String s = t.asText();
                    if (s != null && !s.isBlank()) {
                        sb.append(s).append("\n");
                    }
                }
            }
            String out = sb.toString().trim();
            if (!out.isBlank()) return out;
        }
        JsonNode textNode = candidate.path("content").path("text");
        if (!textNode.isMissingNode() && !textNode.asText().isBlank()) return textNode.asText();
        return "Không nhận được kết quả từ Gemini";
    }

    private JsonNode buildPayload(String prompt, int maxOutputTokens) {
        var root = mapper.createObjectNode();

        // systemInstruction ở cấp root (đúng chuẩn); KHÔNG đặt role=system trong contents [web:23][web:3]
        var sys = mapper.createObjectNode();
        var sysParts = mapper.createArrayNode();
        sysParts.add(mapper.createObjectNode().put("text",
            "Bạn là bác sĩ lâm sàng. Luôn trả lời bằng tiếng Việt chuẩn y khoa, ngắn gọn, rõ ràng. " +
            "Tên chuyên khoa phải viết bằng tiếng Việt cho người dùng. " +
            "Chỉ chèn tên enum tiếng Anh trong ngoặc ở mục (2) để hệ thống xử lý. " +
            "Giữ đúng định dạng biểu mẫu yêu cầu."));
        sys.set("parts", sysParts);
        root.set("systemInstruction", sys);

        // contents: chỉ role 'user' hoặc 'model' [web:3][web:47]
        var contents = mapper.createArrayNode();
        var userContent = mapper.createObjectNode();
        userContent.put("role", "user");
        var userParts = mapper.createArrayNode();
        userParts.add(mapper.createObjectNode().put("text", prompt));
        userContent.set("parts", userParts);
        contents.add(userContent);
        root.set("contents", contents);

        // generationConfig
        var config = mapper.createObjectNode();
        config.put("temperature", 0.3);
        config.put("topK", 20);
        config.put("topP", 0.6);
        config.put("maxOutputTokens", maxOutputTokens);
        root.set("generationConfig", config);

        return root;
    }

private String buildPrompt(DiagnosisRequest request) {
    // Chuẩn bị map chuyên khoa
    String specialtiesInfo = buildSpecialtiesInfo();

    StringJoiner sj = new StringJoiner("\n");
    sj.add("Bạn là bác sĩ lâm sàng có kinh nghiệm. Trả lời bằng tiếng Việt chuẩn y khoa, ngắn gọn.");

    // Nhúng lịch sử hội thoại gần đây (tối đa 10 lượt)
    List<DiagnosisRequest.ChatTurn> recent = request.getRecentHistory(10);
    if (recent != null && !recent.isEmpty()) {
        sj.add("");
        sj.add("=== NGỮ CẢNH HỘI THOẠI GẦN ĐÂY ===");
        for (DiagnosisRequest.ChatTurn turn : recent) {
            String role = "Người dùng";
            if ("ai".equalsIgnoreCase(turn.getSender())) role = "AI";
            String text = (turn.getText() == null ? "" : turn.getText())
                    .replace("---START---", "")
                    .replace("---END---", "")
                    .trim();
            if (!text.isEmpty()) {
                sj.add(role + ": " + text);
            }
        }
    }

    sj.add("");
    sj.add("=== CÁC CHUYÊN KHOA CÓ SẴN ===");
    sj.add(specialtiesInfo);

    sj.add("");
    sj.add("=== THÔNG TIN BỆNH NHÂN ===");
    if (request.getPatientInfo() != null && !request.getPatientInfo().isEmpty()) {
        for (Map.Entry<String, String> e : request.getPatientInfo().entrySet()) {
            sj.add(e.getKey() + ": " + e.getValue());
        }
    } else {
        sj.add("(Không có thông tin bổ sung)");
    }

    sj.add("");
    sj.add("=== TRIỆU CHỨNG HIỆN TẠI ===");
    sj.add(Objects.requireNonNullElse(request.getMessage(), "Không có thông tin triệu chứng."));

    sj.add("");
    sj.add("=== HƯỚNG DẪN ===");
    sj.add("1. Xem xét lịch sử khám bệnh trước đó và các dịch vụ khám đã được thực hiện của bệnh nhân.");
    sj.add("2. Nếu DỮ KIỆN CHƯA ĐỦ (triệu chứng không rõ, chưa biết thời gian, vị trí, mức độ, hoặc cần biết thêm về các triệu chứng liên quan) thì hỏi 1-2 câu ngắn gọn.");
    sj.add("");
    sj.add("3. Nếu DỮ KIỆN ĐỦ thì TUÂN THỀ ĐÚNG FORMAT sau (bắt buộc), mỗi mục một dòng, có khoảng cách dòng giữa các mục:");
    sj.add("---START---");
    sj.add("Chẩn đoán sơ bộ: <ví dụ: Viêm họng cấp (có thể do virus hoặc vi khuẩn)>");
    sj.add("Đề xuất đăng ký: <ví dụ: Nội khoa>");
    sj.add("Mức độ nghiêm trọng: <Bình thường|Khẩn cấp|Cấp cứu>");
    sj.add("Đề xuất dịch vụ: <ví dụ: Khám họng, sờ hạch cổ; có thể test nhanh liên cầu hoặc cấy dịch họng nếu nghi ngờ vi khuẩn>");
    sj.add("Cảnh báo cần nhập viện: <ví dụ: Khó thở, khó nuốt tăng dần, chảy nước dãi, sốt cao kèm rét run, đau họng dữ dội một bên; hoặc 'Không'>");
    sj.add("SPECIALTY_ENUM: <TÊN ENUM CHUẨN, ví dụ: INTERNAL_MEDICINE>");
    sj.add("BOOKING_LINK: <in đúng link theo mẫu http://localhost:5173/booking-schedule-new?specialty=ENUM_TUONG_UNG>");
    sj.add("---END---");
    sj.add("");
    sj.add("LƯU Ý:");
    sj.add("- Toàn bộ nội dung hiển thị phải bằng tiếng Việt.");
    sj.add("- Chỉ dòng SPECIALTY_ENUM dùng enum tiếng Anh cho hệ thống xử lý.");
    sj.add("- Luôn in BOOKING_LINK theo đúng mẫu, dùng giá trị từ SPECIALTY_ENUM.");

    return sj.toString();
}


    /**
     * Xây dựng thông tin các chuyên khoa khám bệnh có sẵn: "Tên Việt (ENUM)" để AI nắm đúng mapping.
     */
    private String buildSpecialtiesInfo() {
        Map<MedicalSpecialty, String> specialtyNames = buildSpecialtyMap();
        StringJoiner sj = new StringJoiner("\n");
        for (MedicalSpecialty specialty : MedicalSpecialty.values()) {
            String vietnameseName = specialtyNames.get(specialty);
            sj.add("- " + vietnameseName + " (" + specialty.name() + ")");
        }
        return sj.toString();
    }

    /**
     * Gợi ý dịch vụ khám bệnh dựa trên chuyên khoa được AI chọn
     */
    public List<MedicalExamination> suggestMedicalExaminations(String symptom, String specialty) throws Exception {
        try {
            MedicalSpecialty medicalSpecialty = MedicalSpecialty.valueOf(specialty.toUpperCase());
            List<MedicalExamination> examinations = medicalExaminationRepository.findAllByMedicalSpecialty(medicalSpecialty);
            if (examinations.isEmpty()) return Collections.emptyList();
            return examinations;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Chuyên khoa không hợp lệ: " + specialty, e);
        }
    }

    /**
     * Parse response từ Gemini và tạo SpecialtyRecommendationResponse
     */
    public SpecialtyRecommendationResponse parseAIResponse(String aiResponse, DiagnosisRequest request) throws Exception {
        SpecialtyRecommendationResponse response = SpecialtyRecommendationResponse.builder().build();
        
        System.out.println("=== AI Response ===");
        System.out.println(aiResponse);
        System.out.println("=== End AI Response ===");
        
        // Kiểm tra nếu có format chuẩn (---START--- ... ---END---)
        if (!aiResponse.contains("---START---")) {
            // Nếu không có format chuẩn = cần thêm dữ kiện
            response.setNeedMoreInfo(true);
            response.setFollowUpQuestion(aiResponse);
            response.setDiagnosis(aiResponse);
            return response;
        }
        
        // Extract nội dung giữa ---START--- và ---END---
        int startIdx = aiResponse.indexOf("---START---") + "---START---".length();
        int endIdx = aiResponse.indexOf("---END---");
        if (endIdx == -1) endIdx = aiResponse.length();
        
        String content = aiResponse.substring(startIdx, endIdx).trim();
        
        // Parse các field
        String diagnosis = extractField(content, "Chẩn đoán sơ bộ");
        String urgency = extractField(content, "Mức độ nghiêm trọng");
        String specialtyEnum = extractField(content, "SPECIALTY_ENUM");
        
        System.out.println("Extracted diagnosis: " + diagnosis);
        System.out.println("Extracted urgency: " + urgency);
        System.out.println("Extracted specialtyEnum: " + specialtyEnum);
        
        response.setDiagnosis(diagnosis);
        response.setNeedMoreInfo(false);
        response.setUrgencyLevel(urgency);
        
        // Nếu có enum chuyên khoa
        if (specialtyEnum != null && !specialtyEnum.isEmpty()) {
            try {
                MedicalSpecialty specialty = MedicalSpecialty.valueOf(specialtyEnum.trim().toUpperCase());
                response.setRecommendedSpecialty(specialtyEnum.trim());
                response.setSpecialtyNameVi(getSpecialtyNameVi(specialty));
                
                // Lấy danh sách dịch vụ khám
                List<MedicalExamination> examinations = medicalExaminationRepository.findAllByMedicalSpecialty(specialty);
                response.setSuggestedExaminations(examinations);
                
                // Tạo URL đặt lịch
                String bookingUrl = buildBookingUrl(specialtyEnum.trim());
                response.setBookingUrl(bookingUrl);
                
                System.out.println("Booking URL set to: " + bookingUrl);
            } catch (IllegalArgumentException ignore) {
                // Specialty không hợp lệ, bỏ qua
                System.out.println("Invalid specialty enum: " + specialtyEnum);
            }
        }
        
        return response;
    }
    
    /**
     * Trích giá trị từ field trong response
     */
    private String extractField(String response, String fieldName) {
        String pattern = fieldName + ":";
        int startIdx = response.indexOf(pattern);
        if (startIdx == -1) return null;
        
        startIdx += pattern.length();
        int endIdx = response.indexOf("\n", startIdx);
        if (endIdx == -1) endIdx = response.indexOf("---", startIdx);
        if (endIdx == -1) endIdx = response.length();
        
        return response.substring(startIdx, endIdx).trim();
    }
    
    /**
     * Lấy tên tiếng Việt của chuyên khoa
     */
    private String getSpecialtyNameVi(MedicalSpecialty specialty) {
        Map<MedicalSpecialty, String> specialtyNames = buildSpecialtyMap();
        return specialtyNames.getOrDefault(specialty, specialty.name());
    }
    
    /**
     * Build map từ enum sang tên Việt
     */
    private Map<MedicalSpecialty, String> buildSpecialtyMap() {
        Map<MedicalSpecialty, String> map = new HashMap<>();
        map.put(MedicalSpecialty.INTERNAL_MEDICINE, "Nội khoa");
        map.put(MedicalSpecialty.SURGERY, "Ngoại khoa");
        map.put(MedicalSpecialty.CARDIOLOGY, "Tim mạch");
        map.put(MedicalSpecialty.PEDIATRICS, "Nhi khoa");
        map.put(MedicalSpecialty.DERMATOLOGY, "Da liễu");
        map.put(MedicalSpecialty.OBSTETRICS_GYNECOLOGY, "Sản phụ khoa");
        map.put(MedicalSpecialty.GASTROENTEROLOGY, "Tiêu hóa");
        map.put(MedicalSpecialty.ORTHOPEDICS, "Cơ xương khớp");
        map.put(MedicalSpecialty.ALLERGY_IMMUNOLOGY, "Dị ứng - miễn dịch");
        map.put(MedicalSpecialty.ANESTHESIOLOGY, "Gây mê hồi sức");
        map.put(MedicalSpecialty.OTOLARYNGOLOGY, "Tai - mũi - họng");
        map.put(MedicalSpecialty.ONCOLOGY, "Ung bướu");
        map.put(MedicalSpecialty.GERIATRICS, "Lão khoa");
        map.put(MedicalSpecialty.TRAUMA_ORTHOPEDICS, "Chấn thương chỉnh hình");
        map.put(MedicalSpecialty.EMERGENCY_MEDICINE, "Hồi sức cấp cứu");
        map.put(MedicalSpecialty.GENERAL_SURGERY, "Ngoại tổng quát");
        map.put(MedicalSpecialty.PREVENTIVE_MEDICINE, "Y học dự phòng");
        map.put(MedicalSpecialty.DENTISTRY, "Răng - Hàm - Mặt");
        map.put(MedicalSpecialty.INFECTIOUS_DISEASE, "Truyền nhiễm");
        map.put(MedicalSpecialty.NEPHROLOGY, "Nội thận");
        map.put(MedicalSpecialty.ENDOCRINOLOGY, "Nội tiết");
        map.put(MedicalSpecialty.PSYCHIATRY, "Tâm thần");
        map.put(MedicalSpecialty.PULMONOLOGY, "Hô hấp");
        map.put(MedicalSpecialty.LABORATORY_MEDICINE, "Xét nghiệm");
        map.put(MedicalSpecialty.HEMATOLOGY, "Huyết học");
        map.put(MedicalSpecialty.PSYCHOLOGY, "Tâm lý");
        map.put(MedicalSpecialty.NEUROLOGY, "Nội thần kinh");
        map.put(MedicalSpecialty.SPEECH_THERAPY, "Ngôn ngữ trị liệu");
        map.put(MedicalSpecialty.PHYSICAL_THERAPY, "Phục hồi chức năng - Vật lý trị liệu");
        map.put(MedicalSpecialty.REPRODUCTIVE_MEDICINE, "Vô sinh hiếm muộn");
        map.put(MedicalSpecialty.TRADITIONAL_MEDICINE, "Y học cổ truyền");
        map.put(MedicalSpecialty.TUBERCULOSIS, "Lao - bệnh phổi");
        return map;
    }
    
    /**
     * Dựng URL đặt lịch khám từ enum chuyên khoa
     */
    private String buildBookingUrl(String enumName) {
        String encoded = URLEncoder.encode(enumName, StandardCharsets.UTF_8);
        return "http://localhost:5173/booking-schedule-new?specialty=" + encoded;
    }
}
