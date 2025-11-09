package com.example.ohms.service;

import com.example.ohms.dto.request.DiagnosisRequest;
import com.example.ohms.dto.response.SpecialtyRecommendationResponse;
import com.example.ohms.entity.MedicalExamination;
import com.example.ohms.entity.MedicalRecord;
import com.example.ohms.entity.User;
import com.example.ohms.entity.Appointment;
import com.example.ohms.entity.Schedule;
import com.example.ohms.enums.MedicalSpecialty;
import com.example.ohms.repository.MedicleExaminatioRepository;
import com.example.ohms.repository.MedicalRecordRepository;
import com.example.ohms.repository.AppointmentRepository;
import com.example.ohms.repository.UserRepository;
import com.example.ohms.repository.ScheduleRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Autowired
    private UserService userService;

    @Autowired
    private MedicleExaminatioRepository medicalExaminationRepository;
    
    @Autowired
    private MedicalRecordRepository medicalRecordRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    public GeminiService(RestTemplate restTemplate, UserService userService, 
                        MedicleExaminatioRepository medicalExaminationRepository,
                        MedicalRecordRepository medicalRecordRepository,
                        AppointmentRepository appointmentRepository,
                        UserRepository userRepository,
                        ScheduleRepository scheduleRepository) {
        this.restTemplate = (restTemplate != null ? restTemplate : new RestTemplate());
        this.userService = userService;
        this.medicalExaminationRepository = medicalExaminationRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
    }

    public GeminiService() {
        this.restTemplate = new RestTemplate();
    }

    public String generateDiagnosisReply(DiagnosisRequest request) throws Exception {
        if (apiKey == null || apiKey.isEmpty())
            throw new IllegalStateException("Gemini API key chưa cấu hình");

        String prompt = buildPrompt(request);
        JsonNode payload = buildPayload(prompt, 4096);

        String apiURL = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> httpEntity = new HttpEntity<>(mapper.writeValueAsString(payload), headers);

        // Retry logic for transient errors
        int maxRetries = 2;
        Exception lastException = null;
        
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> resp = restTemplate.exchange(apiURL, HttpMethod.POST, httpEntity, String.class);
                if (!resp.getStatusCode().is2xxSuccessful()) {
                    throw new RuntimeException("Gemini API trả về lỗi: " + resp.getStatusCode().value() + " body: " + resp.getBody());
                }

                String responseBody = resp.getBody();
                if (responseBody == null || responseBody.isBlank()) {
                    throw new RuntimeException("Gemini API trả về response rỗng");
                }

                JsonNode root = mapper.readTree(responseBody);
                
                // Check for API errors
                if (root.has("error")) {
                    JsonNode error = root.get("error");
                    String errorMessage = error.has("message") ? error.get("message").asText() : "Unknown error";
                    int errorCode = error.has("code") ? error.get("code").asInt() : 0;
                    
                    // Don't retry for client errors (4xx)
                    if (errorCode >= 400 && errorCode < 500) {
                        throw new RuntimeException("Gemini API error [" + errorCode + "]: " + errorMessage);
                    }
                    
                    throw new RuntimeException("Gemini API error [" + errorCode + "]: " + errorMessage);
                }
                
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    return extractText(candidates.get(0));
                }

                // Log the full response for debugging
                System.err.println("⚠️ No candidates in response: " + responseBody);
                throw new RuntimeException("Gemini không trả về kết quả. Vui lòng thử lại.");
                
            } catch (Exception e) {
                lastException = e;
                if (attempt < maxRetries) {
                    System.err.println("⚠️ Attempt " + (attempt + 1) + " failed: " + e.getMessage() + ". Retrying...");
                    Thread.sleep(1000 * (attempt + 1)); // Exponential backoff
                } else {
                    System.err.println("❌ All attempts failed. Throwing exception.");
                }
            }
        }
        
        throw lastException != null ? lastException : new RuntimeException("Failed to get response from Gemini after retries");
    }

    private String extractText(JsonNode candidate) {
        // Check if response was blocked
        JsonNode finishReason = candidate.path("finishReason");
        if (!finishReason.isMissingNode()) {
            String reason = finishReason.asText();
            if ("SAFETY".equals(reason) || "BLOCKED".equals(reason)) {
                return "Xin lỗi, câu trả lời bị chặn do vi phạm chính sách an toàn. Vui lòng thử lại với nội dung khác.";
            }
            if ("MAX_TOKENS".equals(reason)) {
                return "Câu trả lời quá dài. Vui lòng hỏi ngắn gọn hơn.";
            }
        }
        
        // Try to extract text from parts
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
        
        // Try alternative path
        JsonNode textNode = candidate.path("content").path("text");
        if (!textNode.isMissingNode() && !textNode.asText().isBlank()) {
            return textNode.asText();
        }
        
        // Log the candidate structure for debugging
        System.err.println("⚠️ Cannot extract text from candidate: " + candidate.toString());
        return "Xin lỗi, tôi không thể tạo câu trả lời lúc này. Vui lòng thử lại.";
    }

    private JsonNode buildPayload(String prompt, int maxOutputTokens) {
        var root = mapper.createObjectNode();
        var sys = mapper.createObjectNode();
        var sysParts = mapper.createArrayNode();
        sysParts.add(mapper.createObjectNode().put("text",
            "Bạn là trợ lý y tế thông minh. Bạn có thể tư vấn y tế cho người bệnh dựa vào triệu chứng và có thể đặt lịch khám. " +
           " Người dùng sẽ chat với bạn để đặt lịch khám từng bước tự nhiên, KHÔNG cần bấm nút. " +
            "Luôn trả lời bằng tiếng Việt chuẩn y khoa, ngắn gọn, rõ ràng. " +
            "Chat tự nhiên theo từng bước, hỏi rõ ràng, giải thích chi tiết. " +
            "Nếu thông tin chưa đủ, hỏi lại thay vì đoán. " +
            "KHÔNG sử dụng format ---START--- hay ---END---. " +
            "Cuối cùng, tóm tắt đầy đủ trước khi hướng dẫn thanh toán."));
        sys.set("parts", sysParts);
        root.set("systemInstruction", sys);

        var contents = mapper.createArrayNode();
        var userContent = mapper.createObjectNode();
        userContent.put("role", "user");
        var userParts = mapper.createArrayNode();
        userParts.add(mapper.createObjectNode().put("text", prompt));
        userContent.set("parts", userParts);
        contents.add(userContent);
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
        String specialtiesInfo = buildSpecialtiesInfo();
        String medicalHistory = "";
        if (request.getPatientId() != null && !request.getPatientId().isEmpty()) {
            medicalHistory = buildMedicalHistoryInfo(request.getPatientId());
        }
        String servicesInfo = buildServicesInfo();
        String doctorsInfo = buildDoctorsInfo(request);

        StringJoiner sj = new StringJoiner("\n");
        
        sj.add("=== HƯỚNG DẪN TRỢ LÝ Y TẾ ===");
        sj.add("Bạn là trợ lý y tế thông minh. Người dùng sẽ chat với bạn để");
        sj.add("đặt lịch khám từng bước tự nhiên, không cần bấm nút.");
        sj.add("");

        sj.add("HAI HÌNH THỨC ĐẶT LỊCH:");
        sj.add("");
        sj.add("1. ĐẶT LỊCH KHÁM BÁC SĨ");
        sj.add("   - Luôn có appointment chính = Khám bác sĩ (bắt buộc)");
        sj.add("   - Có thể thêm dịch vụ xét nghiệm/chẩn đoán");
        sj.add("   - Cần chọn bác sĩ (hoặc tự động gán)");
        sj.add("   - bookingType: CONSULTATION_ONLY hoặc SERVICE_AND_CONSULTATION");
        sj.add("");
        sj.add("2. ĐẶT DỊCH VỤ DỰ PHÒNG");
        sj.add("   - Không cần bác sĩ (do điều dưỡng thực hiện)");
        sj.add("   - Ví dụ: Tiêm chủng, đo huyết áp, kiểm tra sức khỏe");
        sj.add("   - Chỉ cần chọn dịch vụ + thời gian (8h-17h, trừ CN)");
        sj.add("   - bookingType: PREVENTIVE_SERVICE");
        sj.add("");

        sj.add("QUY TRÌNH CHAT TỰ NHIÊN:");
        sj.add("");
        sj.add("BƯỚC 1: HỎI CHUYÊN KHOA");
        sj.add("Nếu user không biết khoa nào → Hỏi triệu chứng cụ thể");
        sj.add("Sau đó → Gợi ý chuyên khoa phù hợp");
        sj.add("Nếu user hỏi dịch vụ cụ thể → Xác định PREVENTIVE_SERVICE → Bỏ qua bước chọn bác sĩ");
        sj.add("");

        sj.add("BƯỚC 2: LIỆT KÊ DỊCH VỤ (nếu khám bác sĩ)");
        sj.add("");
        sj.add("⚠️ PHÂN LOẠI SERVICE QUAN TRỌNG:");
        sj.add("SERVICE KHÁM (chỉ chọn 1, BẮT BUỘC):");
        sj.add("  - Tên có từ 'Khám': Khám nhi tổng quát, Khám bệnh đường hô hấp, Khám tim mạch...");
        sj.add("  - Thời gian: 10-20 phút");
        sj.add("  - Giá: 50,000 - 300,000 VNĐ");
        sj.add("");
        sj.add("SERVICE PHỤ (có thể chọn nhiều, TÙY CHỌN):");
        sj.add("  - Xét nghiệm: máu, nước tiểu, phân...");
        sj.add("  - Chẩn đoán hình ảnh: Siêu âm, X-quang, CT, MRI...");
        sj.add("  - Thủ thuật: Tiêm chủng, đo điện tim...");
        sj.add("  - Tư vấn: Tư vấn dinh dưỡng, tư vấn tâm lý...");
        sj.add("  - Thời gian: 15-60 phút");
        sj.add("");
        sj.add("1. NẾU USER CHỈ CHỌN 1 SERVICE KHÁM:");
        sj.add("   → bookingType = CONSULTATION_ONLY");
        sj.add("   → Hỏi: 'Bạn có muốn thêm dịch vụ xét nghiệm/chẩn đoán không?'");
        sj.add("");
        sj.add("2. NẾU USER CHỌN NHIỀU SERVICE:");
        sj.add("   a) Nếu có 1 service khám + các service khác:");
        sj.add("      → TỰ ĐỘNG xác định: service có 'Khám' = KHÁM CHÍNH");
        sj.add("      → Các service khác = SERVICE PHỤ");
        sj.add("      → bookingType = SERVICE_AND_CONSULTATION");
        sj.add("      → KHÔNG hỏi lại user!");
        sj.add("");
        sj.add("   b) Nếu có 2+ service khám (VD: 'Khám A' + 'Khám B'):");
        sj.add("      → TỰ ĐỘNG chọn service khám ĐẦU TIÊN user nhắc");
        sj.add("      → Thông báo: 'Tôi sẽ đặt lịch [Tên service khám]. Các dịch vụ khác...'");
        sj.add("      → KHÔNG hỏi lại user!");
        sj.add("");
        sj.add("   c) Nếu KHÔNG có service khám nào (chỉ service phụ):");
        sj.add("      → Hỏi: 'Bạn muốn chọn loại khám nào?' + liệt kê service khám");
        sj.add("");
        sj.add("VÍ DỤ XỬ LÝ:");
        sj.add("User: 'Tôi muốn khám đường hô hấp và tư vấn dinh dưỡng'");
        sj.add("AI: ✅ 'Dạ, tôi sẽ đặt lịch Khám bệnh đường hô hấp cho bạn.");
        sj.add("     Tư vấn dinh dưỡng trẻ em sẽ là dịch vụ bổ sung.");
        sj.add("     Bạn muốn khám với bác sĩ nào?'");
        sj.add("AI: ❌ KHÔNG: 'Mỗi lượt khám chỉ chọn 1... Bạn chọn cái nào?'");
        sj.add("");
        sj.add("User: 'Khám tim mạch và khám gan'");
        sj.add("AI: ✅ 'Dạ, tôi sẽ đặt lịch Khám tim mạch cho bạn.");
        sj.add("     Khám gan có thể đặt lịch riêng sau ạ. Bạn chọn bác sĩ tim mạch nào?'");
        sj.add("");
        sj.add("3. LƯU Ý:");
        sj.add("   - LUÔN tự động xử lý, KHÔNG hỏi user chọn lại");
        sj.add("   - Ưu tiên service khám user nhắc TRƯỚC");
        sj.add("   - Giải thích ngắn gọn những gì đã chọn");
        sj.add("   - KHÔNG HIỂN THỊ ID CỦA SERVICE");
        sj.add("");

        sj.add("BƯỚC 3: LIỆT KÊ BÁC SĨ (nếu khám bác sĩ)");
        sj.add("");
        sj.add("1. Hiển thị danh sách bác sĩ của chuyên khoa:");
        sj.add("BS. Nguyễn Văn Minh");
        sj.add("ID: 673cd90ce9eadc754cf85258");
        sj.add("Chuyên khoa: Nhi khoa");
        sj.add("Kinh nghiệm: 10 năm");
        sj.add("");
        sj.add("LỊCH LÀM VIỆC (CHỈ CÁC NGÀY TỪ HÔM NAY TRỞ ĐI):");
        sj.add("");
        sj.add("📅 TUẦN NÀY:");
        sj.add("• Thứ 3, 12/11/2025: 8:00 - 12:00");
        sj.add("• Thứ 4, 13/11/2025: 9:00 - 17:00");
        sj.add("• Thứ 5, 14/11/2025: 8:00 - 12:00, 14:00 - 17:00");
        sj.add("");
        sj.add("📅 TUẦN SAU:");
        sj.add("• Thứ 2, 18/11/2025: 8:00 - 17:00");
        sj.add("• Thứ 3, 19/11/2025: 9:00 - 12:00");
        sj.add("");
        sj.add("2. QUAN TRỌNG:");
        sj.add("   ✅ CHỈ hiển thị các ngày TỪ HÔM NAY (08/11/2025) trở đi");
        sj.add("   ✅ Bỏ qua tất cả ngày đã qua (07/11 trở về trước)");
        sj.add("   ✅ CHỈ hiển thị KHUNG GIỜ LÀM VIỆC của bác sĩ (từ Schedule)");
        sj.add("   ✅ KHÔNG nói trước slot nào 'Bận' hay 'Trống'");
        sj.add("   ✅ Phải lấy ĐÚNG doctorId thật từ database (24 ký tự hex)");
        sj.add("");
        sj.add("3. Hỏi user:");
        sj.add("   'Bạn chọn bác sĩ nào? Bạn muốn đặt lịch vào ngày và giờ nào?'");
        sj.add("");
        sj.add("4. KHI USER CHỌN GIỜ:");
        sj.add("   ⚠️ CHỈ CHECK TIME CONFLICT CHO KHÁM BÁC SĨ (appointment chính)");
        sj.add("   ⚠️ KHÔNG check conflict cho service phụ (xét nghiệm, siêu âm...)");
        sj.add("");
        sj.add("   PHÂN BIỆT 2 TRƯỜNG HỢP:");
        sj.add("");
        sj.add("   📌 TRƯỜNG HỢP 1: User nói 'Khám lúc [giờ]'");
        sj.add("      → Giờ này là GIỜ KHÁM BÁC SĨ");
        sj.add("      → Service phụ sẽ làm TRƯỚC giờ này");
        sj.add("      → Check conflict cho giờ khám này");
        sj.add("      ");
        sj.add("      VD: 'Tôi muốn xét nghiệm máu và khám lúc 5h chiều'");
        sj.add("      → Giờ khám: 17:00-17:10");
        sj.add("      → Xét nghiệm: 16:30-17:00 (làm trước)");
        sj.add("      → CHECK CONFLICT cho slot 17:00-17:10");
        sj.add("");
        sj.add("   📌 TRƯỜNG HỢP 2: User nói 'Bắt đầu lúc [giờ]' hoặc 'Đến lúc [giờ]'");
        sj.add("      → Giờ này là GIỜ BẮT ĐẦU");
        sj.add("      → Làm service phụ trước, sau đó khám");
        sj.add("      → TÍNH toán giờ khám = giờ bắt đầu + tổng thời gian service");
        sj.add("      → Check conflict cho giờ khám đã tính");
        sj.add("      ");
        sj.add("      VD: 'Tôi muốn đến khám lúc 3h chiều, có xét nghiệm máu'");
        sj.add("      → Bắt đầu: 15:00");
        sj.add("      → Xét nghiệm: 15:00-15:30");
        sj.add("      → Giờ khám: 15:30-15:40 (tính toán)");
        sj.add("      → CHECK CONFLICT cho slot 15:30-15:40");
        sj.add("");
        sj.add("   a) CONSULTATION_ONLY:");
        sj.add("      - Check slot khám có trống không");
        sj.add("      - Nếu BẬN → Suggest slot khác (cách 10-20 phút)");
        sj.add("      - Nếu TRỐNG → Xác nhận và tiếp tục");
        sj.add("");
        sj.add("   b) SERVICE_AND_CONSULTATION - Xử lý CONFLICT:");
        sj.add("      1. Tính giờ khám (theo 2 trường hợp trên)");
        sj.add("      2. Check conflict cho giờ khám");
        sj.add("      3. Nếu BẬN:");
        sj.add("         Option A: Dời LỊCH KHÁM lên trước (nếu có thời gian nghỉ)");
        sj.add("         - VD: Khám 9:00 bận → Dời lên 8:50 (nghỉ 10 phút)");
        sj.add("         - Service sẽ điều chỉnh theo: 8:20-8:50");
        sj.add("         ");
        sj.add("         Option B: Dời LỊCH KHÁM xuống sau (nếu có khoảng trống)");
        sj.add("         - VD: Khám 9:00 bận → Dời xuống 9:10");
        sj.add("         - Service giữ nguyên");
        sj.add("         ");
        sj.add("         Option C: Đề xuất khung giờ khác hoàn toàn");
        sj.add("         - Nếu không dời được → Suggest 3-5 khung giờ khác");
        sj.add("      4. Hỏi user chọn");
        sj.add("");
        sj.add("5. LOGIC CHECK CONFLICT:");
        sj.add("   • CHỈ check appointments trong khung giờ KHÁM BÁC SĨ");
        sj.add("   • Lấy tất cả appointments của bác sĩ trong ngày user chọn");
        sj.add("   • Mỗi slot khám: startTime < appointment.endTime && endTime > appointment.startTime → BẬN");
        sj.add("   • CHỈ check parent appointments (parentAppointmentId = null)");
        sj.add("   • Bỏ qua appointments có status = CANCELLED");
        sj.add("");
        sj.add("6. XỬ LÝ CONFLICT - CÁC OPTION:");
        sj.add("   a) Tìm khoảng trống trước/sau:");
        sj.add("      - Chia lịch thành slots 10 phút");
        sj.add("      - Tìm slot trống gần nhất (trước hoặc sau)");
        sj.add("      - Kiểm tra đủ thời gian cho cả service + khám");
        sj.add("   ");
        sj.add("   b) Đề xuất thông minh:");
        sj.add("      - 'Dạ, giờ khám 9:00 đã có lịch.'");
        sj.add("      - 'Tôi có thể:'");
        sj.add("      - '  1. Dời lên 8:50 (xét nghiệm 8:20-8:50, khám 8:50-9:00)'");
        sj.add("      - '  2. Dời xuống 9:10 (xét nghiệm 8:40-9:10, khám 9:10-9:20)'");
        sj.add("      - '  3. Chọn khung giờ khác: 10:00, 14:00, 15:30'");
        sj.add("      - 'Bạn chọn phương án nào ạ?'");
        sj.add("");
        sj.add("VÍ DỤ HỘI THOẠI 1 - User nói 'KHÁM LÚC':");
        sj.add("User: 'Tôi muốn xét nghiệm máu và khám lúc 5h chiều'");
        sj.add("AI: [Hiểu: Giờ khám = 17:00]");
        sj.add("    [Tính: Xét nghiệm 30p → Bắt đầu 16:30]");
        sj.add("    [Check conflict cho 17:00-17:10]");
        sj.add("    → Nếu TRỐNG: 'Dạ, lịch trình: 16:30-17:00 xét nghiệm, 17:00-17:10 khám'");
        sj.add("    → Nếu BẬN: 'Giờ khám 17:00 đã có lịch. Tôi có thể:'");
        sj.add("                '1. Dời lên 16:50 (xét nghiệm 16:20-16:50, khám 16:50-17:00)'");
        sj.add("                '2. Dời xuống 17:10 (xét nghiệm 16:30-17:00, khám 17:10-17:20)'");
        sj.add("");
        sj.add("VÍ DỤ HỘI THOẠI 2 - User nói 'BẮT ĐẦU LÚC':");
        sj.add("User: 'Tôi muốn đến lúc 3h chiều, làm xét nghiệm máu và khám'");
        sj.add("AI: [Hiểu: Bắt đầu = 15:00]");
        sj.add("    [Tính: 15:00-15:30 xét nghiệm, 15:30-15:40 khám]");
        sj.add("    [Check conflict cho 15:30-15:40]");
        sj.add("    → Nếu TRỐNG: 'Dạ, lịch trình: 15:00-15:30 xét nghiệm, 15:30-15:40 khám'");
        sj.add("    → Nếu BẬN: 'Giờ khám 15:30 đã có lịch. Tôi có thể:'");
        sj.add("                '1. Dời khám lên 15:20 (xét nghiệm 14:50-15:20, khám 15:20-15:30)'");
        sj.add("                '2. Dời khám xuống 15:40 (xét nghiệm 15:00-15:30, khám 15:40-15:50)'");
        sj.add("                '3. Chọn khung giờ khác'");


        sj.add("BƯỚC 4: CHỌN NGÀY GIỜ");
        sj.add("User nói: 'Tôi muốn khám vào 9h thứ 3 tuần này'");
        sj.add("Bạn: KIỂM TRA LỊCH, xác nhận hoặc đề xuất giờ khác");
        sj.add("Nếu SERVICE_AND_CONSULTATION:");
        sj.add("  - Sắp xếp dịch vụ TRƯỚC (nhanh tuần tự)");
        sj.add("  - Khám bác sĩ SAU (10 phút)");
        sj.add("  - VD: 8h-8h30 (Xét nghiệm), 8h30-9h (Khám bác sĩ)");
        sj.add("");

        sj.add("BƯỚC 5: TÓM TẮT VÀ TRẢ VỀ JSON");
        sj.add("Tóm tắt thông tin:");
        sj.add("THÔNG TIN ĐẶT LỊCH KHÁM");
        sj.add("Loại: Khám bác sĩ");
        sj.add("Chuyên khoa: Nhi khoa");
        sj.add("Bác sĩ: BS. Minh");
        sj.add("Ngày khám: Thứ 3, 12/11/2025");
        sj.add("");
        sj.add("LỊCH TRÌNH:");
        sj.add("• 9:00 - 9:30: Xét nghiệm máu (service phụ)");
        sj.add("• 9:30 - 9:40: Khám nhi tổng quát (service khám mà user đã chọn)");
        sj.add("");
        sj.add("⚠️ LƯU Ý QUAN TRỌNG:");
        sj.add("- Hiển thị ĐÚNG TÊN service khám mà user đã chọn");
        sj.add("- KHÔNG tự động thay đổi thành 'Khám tổng quát'");
        sj.add("- VD: User chọn 'Khám bệnh đường hô hấp' → Hiển thị 'Khám bệnh đường hô hấp'");
        sj.add("- VD: User chọn 'Khám chuyên sâu' → Hiển thị 'Khám chuyên sâu'");
        sj.add("");
        sj.add("CHI PHÍ:");
        sj.add("• Tổng tiền: 350,000đ");
        sj.add("• Giảm giá (10%): -35,000đ");
        sj.add("• Sau giảm giá: 315,000đ");
        sj.add("• Cần đặt cọc: 157,500đ");
        sj.add("• Thanh toán sau: 157,500đ");
        sj.add("");
        sj.add("SAU ĐÓ, bạn PHẢI TRẢ VỀ JSON OBJECT:");
        sj.add("");
        
        sj.add("⚠️ QUY TẮC QUAN TRỌNG:");
        sj.add("1. doctorId: Phải lấy ĐÚNG ID thật của bác sĩ từ danh sách (24 ký tự hex)");
        sj.add("   - Ví dụ ID thật: \"673cd90ce9eadc754cf85258\"");
        sj.add("   - KHÔNG tự bịa: \"doc_12345\", \"doc_minh\"");
        sj.add("");
        sj.add("2. medicalExaminationIds:");
        sj.add("   - LUÔN LUÔN phải có 1 service 'Đặt khám' của chuyên khoa (BẮT BUỘC)");
        sj.add("   - Service 'Đặt khám' = APPOINTMENT CHÍNH");
        sj.add("   - Các service khác (xét nghiệm, siêu âm...) = APPOINTMENT PHỤ");
        sj.add("   - Ví dụ: [\"exam_nhi_khoa_001\", \"service_xet_nghiem_mau\"]");
        sj.add("            ↑ Đặt khám Nhi    ↑ Service phụ");
        sj.add("");
        sj.add("3. serviceSlots:");
        sj.add("   - CHỈ chứa các service PHỤ (xét nghiệm, siêu âm...)");
        sj.add("   - KHÔNG chứa service 'Đặt khám'");
        sj.add("");
        sj.add("4. Field names:");
        sj.add("   - Dùng: depositAmount, depositStatus (KHÔNG dùng deposit)");
        sj.add("");

        sj.add("📋 CẤU TRÚC JSON THEO LOẠI BOOKING:");
        sj.add("");
        sj.add("1️⃣ CONSULTATION_ONLY (chỉ khám bác sĩ, không có service phụ):");
        sj.add("{");
        sj.add("  \"ready\": true,");
        sj.add("  \"bookingType\": \"CONSULTATION_ONLY\",");
        sj.add("  \"doctorId\": \"673cd90ce9eadc754cf85258\",  // ← ID THẬT!");
        sj.add("  \"doctorName\": \"BS. Minh\",");
        sj.add("  \"workDate\": \"2025-11-12\",");
        sj.add("  \"startTime\": \"09:00:00\",");
        sj.add("  \"endTime\": \"09:10:00\",");
        sj.add("  \"medicalExaminationIds\": [\"exam_nhi_khoa_001\"],  // ← CHỈ có service Đặt khám");
        sj.add("  \"totalPrice\": 200000,");
        sj.add("  \"discountedPrice\": 180000,");
        sj.add("  \"depositAmount\": 90000,");
        sj.add("  \"depositStatus\": \"PENDING\",  // ← THÊM field này");
        sj.add("  \"discount\": 10");
        sj.add("}");
        sj.add("");
        
        sj.add("2️⃣ SERVICE_AND_CONSULTATION (có dịch vụ phụ + khám bác sĩ):");
        sj.add("CẤU TRÚC: 1 appointment CHA (khám bác sĩ) + N appointment CON (các dịch vụ)");
        sj.add("⚠️ QUAN TRỌNG: medicalExaminationIds CHỈ chứa 1 service 'Đặt khám' của chuyên khoa");
        sj.add("               Các service phụ (xét nghiệm, siêu âm...) CHỈ nằm trong serviceSlots");
        sj.add("{");
        sj.add("  \"ready\": true,");
        sj.add("  \"bookingType\": \"SERVICE_AND_CONSULTATION\",");
        sj.add("  \"doctorId\": \"673cd90ce9eadc754cf85258\",  // ← ID THẬT!");
        sj.add("  \"doctorName\": \"BS. Minh\",");
        sj.add("  \"workDate\": \"2025-11-12\",");
        sj.add("  \"serviceSlots\": [  // ← CHỈ chứa service PHỤ (xét nghiệm, siêu âm...)");
        sj.add("    {");
        sj.add("      \"serviceId\": \"service_xet_nghiem_mau\",");
        sj.add("      \"startTime\": \"09:00:00\",");
        sj.add("      \"endTime\": \"09:30:00\"");
        sj.add("    },");
        sj.add("    {");
        sj.add("      \"serviceId\": \"service_sieu_am\",");
        sj.add("      \"startTime\": \"09:30:00\",");
        sj.add("      \"endTime\": \"09:50:00\"");
        sj.add("    }");
        sj.add("  ],");
        sj.add("  \"consultationSlot\": {  // ← Thời gian khám bác sĩ");
        sj.add("    \"startTime\": \"09:50:00\",");
        sj.add("    \"endTime\": \"10:00:00\"");
        sj.add("  },");
        sj.add("  \"medicalExaminationIds\": [");
        sj.add("    \"exam_nhi_khoa_001\"           // ← CHỈ có 1 service Đặt khám, user tự chọn từ danh sách");
        sj.add("  ],                                // ← KHÔNG bao gồm service phụ ở đây");
        sj.add("  \"totalPrice\": 500000,");
        sj.add("  \"discountedPrice\": 450000,");
        sj.add("  \"depositAmount\": 225000,");
        sj.add("  \"depositStatus\": \"PENDING\",  // ← THÊM field này");
        sj.add("  \"discount\": 10");
        sj.add("}");
        sj.add("");
        
        sj.add("3️⃣ PREVENTIVE_SERVICE (dịch vụ dự phòng, không cần bác sĩ):");
        sj.add("{");
        sj.add("  \"ready\": true,");
        sj.add("  \"bookingType\": \"PREVENTIVE_SERVICE\",");
        sj.add("  \"workDate\": \"2025-11-12\",");
        sj.add("  \"startTime\": \"09:00:00\",");
        sj.add("  \"endTime\": \"09:30:00\",");
        sj.add("  \"medicalExaminationIds\": [\"service_tiem_chung\"],  // ← Service dự phòng");
        sj.add("  \"totalPrice\": 150000,");
        sj.add("  \"discountedPrice\": 135000,");
        sj.add("  \"depositAmount\": 67500,");
        sj.add("  \"depositStatus\": \"PENDING\",");
        sj.add("  \"discount\": 10");
        sj.add("}");
        sj.add("");
        sj.add("Kết thúc bằng: 'Vui lòng nhấn nút ĐẶT LỊCH KHÁM để thanh toán đặt cọc và hoàn tất.'");
        sj.add("");

        sj.add("LƯU Ý QUAN TRỌNG:");
        sj.add("- Hiển thị lịch: TUẦN NÀY + TUẦN SAU (không phải 3 ngày)");
        sj.add("- Tuần này: Từ thứ 2 đến thứ 7 (bỏ chủ nhật)");
        sj.add("- Tuần sau: 7 ngày tiếp theo (thứ 2-7, bỏ chủ nhật)");
        sj.add("- Khung giờ: Lấy từ database schedule của từng bác sĩ");
        sj.add("- ⚠️ CHỈ hiển thị KHUNG GIỜ LÀM VIỆC, KHÔNG nói trước 'Bận' hay 'Trống'");
        sj.add("- ⚠️ CHỈ khi user CHỌN GIỜ CỤ THỂ thì mới check và báo bận/trống");
        sj.add("- ⚠️ Nếu bác sĩ có lịch 14h-17h và chỉ có 1 appointment, KHÔNG nói 'Bận cả ngày'");
        sj.add("- ⚠️ Check từng slot 10 phút để xem có conflict không");
        sj.add("");

        sj.add("QUY TẮC CHAT:");
        sj.add("- LUÔN trả lời tiếng Việt chuẩn y khoa");
        sj.add("- Chat tự nhiên TỪNG BƯỚC");
        sj.add("- Nếu thông tin chưa đủ → HỎI LẠI");
        sj.add("- Phân biệt 3 loại booking: CONSULTATION_ONLY, SERVICE_AND_CONSULTATION, PREVENTIVE_SERVICE");
        sj.add("- Tính toán: Total - 10% = Discounted, Deposit = 50% Discounted");
        sj.add("- PHẢI LUÔN trả JSON object với \"ready\": true");
        sj.add("- KHÔNG dùng format ---START---, ---END---");
        sj.add("- KHÔNG bỏ qua JSON");
        sj.add("- ⚠️ medicalExaminationIds CHỈ chứa service 'Đặt khám' mà user đã CHỌN");
        sj.add("- ⚠️ Trong SERVICE_AND_CONSULTATION: medicalExaminationIds CHỈ có 1 service khám");
        sj.add("- ⚠️ serviceSlots CHỈ chứa service PHỤ (xét nghiệm, siêu âm), KHÔNG chứa service 'Đặt khám'");
        sj.add("- ⚠️ doctorId phải là ID THẬT từ database (24 ký tự hex)");
        sj.add("");

        // Chỉ lấy 5 message gần nhất để giảm token
        List<DiagnosisRequest.ChatTurn> recent = request.getRecentHistory(5);
        if (recent != null && !recent.isEmpty()) {
            sj.add("HỘI THOẠI GẦN ĐÂY:");
            for (DiagnosisRequest.ChatTurn turn : recent) {
                String role = "Người dùng";
                if ("ai".equalsIgnoreCase(turn.getSender())) role = "AI";
                String text = (turn.getText() == null ? "" : turn.getText()).trim();
                // Chỉ hiển thị message có nội dung thực sự (> 2 ký tự)
                if (!text.isEmpty() && text.length() > 2) {
                    sj.add(role + ": " + text);
                }
            }
            sj.add("");
        }
        
        if (!medicalHistory.isEmpty()) {
            sj.add("LỊCH SỬ KHÁM BỆNH CỦA NGƯỜI DÙNG:");
            sj.add(medicalHistory);
            sj.add("");
        }

        sj.add("DANH SÁCH CHUYÊN KHOA:");
        sj.add(specialtiesInfo);
        sj.add("");
        
        sj.add("DANH SÁCH DỊCH VỤ KHÁM BỆNH:");
        sj.add(servicesInfo);
        sj.add("");
        
        sj.add("DANH SÁCH BÁC SĨ:");
        sj.add(doctorsInfo);
        sj.add("");

        sj.add("THÔNG TIN NGƯỜI DÙNG:");
        if (request.getPatientInfo() != null && !request.getPatientInfo().isEmpty()) {
            for (Map.Entry<String, String> e : request.getPatientInfo().entrySet()) {
                sj.add("• " + e.getKey() + ": " + e.getValue());
            }
        } else {
            sj.add("(Chưa có thông tin bổ sung)");
        }
        sj.add("");

        sj.add("CÂU HỎI/YÊU CẦU HIỆN TẠI:");
        sj.add(Objects.requireNonNullElse(request.getMessage(), "Không có thông tin"));

        return sj.toString();
    }

    
    private String buildSpecialtiesInfo() {
        Map<MedicalSpecialty, String> specialtyNames = buildSpecialtyMap();
        StringJoiner sj = new StringJoiner("\n");
        for (MedicalSpecialty specialty : MedicalSpecialty.values()) {
            String vietnameseName = specialtyNames.get(specialty);
            sj.add("- " + vietnameseName + " (" + specialty.name() + ")");
        }
        return sj.toString();
    }
    
    private String buildMedicalHistoryInfo(String patientId) {
        try {
            List<MedicalRecord> records = medicalRecordRepository.findByPatientId(patientId);
            if (records == null || records.isEmpty()) {
                return "(Bệnh nhân chưa có lịch sử khám bệnh)";
            }
            
            StringJoiner sj = new StringJoiner("\n");
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            
            // Chỉ lấy 3 lần khám gần nhất để giảm data
            int count = Math.min(3, records.size());
            for (int i = 0; i < count; i++) {
                MedicalRecord record = records.get(records.size() - 1 - i);
                sj.add("─────────────────────────────────");
                sj.add("Ngày: " + record.getCreatedAt().format(dateFormatter));
                sj.add("Chẩn đoán: " + (record.getDiagnosis() != null ? record.getDiagnosis() : "Chưa có"));
                
                // Chỉ hiển thị thông tin quan trọng
                if (record.getAppointment() != null && record.getAppointment().getDoctor() != null) {
                    sj.add("Bác sĩ: " + record.getAppointment().getDoctor().getUsername());
                }
            }
            
            if (records.size() > 3) {
                sj.add("─────────────────────────────────");
                sj.add("(Còn " + (records.size() - 3) + " lần khám khác...)");
            }
            
            return sj.toString();
        } catch (Exception e) {
            return "(Không thể lấy lịch sử khám bệnh: " + e.getMessage() + ")";
        }
    }
    
    private String buildServicesInfo() {
        try {
            List<MedicalExamination> allExams = medicalExaminationRepository.findAll();
            if (allExams == null || allExams.isEmpty()) {
                return "(Chưa có dịch vụ khám bệnh)";
            }
            
            Map<MedicalSpecialty, List<MedicalExamination>> groupedExams = new HashMap<>();
            for (MedicalExamination exam : allExams) {
                groupedExams.computeIfAbsent(exam.getMedicalSpecialty(), k -> new ArrayList<>()).add(exam);
            }
            
            StringJoiner sj = new StringJoiner("\n");
            Map<MedicalSpecialty, String> specialtyNames = buildSpecialtyMap();
            
            for (Map.Entry<MedicalSpecialty, List<MedicalExamination>> entry : groupedExams.entrySet()) {
                MedicalSpecialty specialty = entry.getKey();
                List<MedicalExamination> exams = entry.getValue();
                
                sj.add("─────────────────────────────────");
                sj.add("Chuyên khoa: " + specialtyNames.get(specialty));
                
                for (MedicalExamination exam : exams) {
                    String price = exam.getPrice() > 0 ? String.format("%,d VNĐ", exam.getPrice()) : "Liên hệ";
                    String duration = exam.getMinDuration() != null ? exam.getMinDuration() + " phút" : "";
                    sj.add("  • " + exam.getName() + " (ID: " + exam.getId() + ") - " + price + (duration.isEmpty() ? "" : " (" + duration + ")"));
                }
            }
            
            return sj.toString();
        } catch (Exception e) {
            return "(Không thể lấy danh sách dịch vụ: " + e.getMessage() + ")";
        }
    }

    private String buildDoctorsInfo(DiagnosisRequest request) {
        try {
            List<User> allDoctors = userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && 
                               user.getRoles().stream().anyMatch(role -> "DOCTOR".equalsIgnoreCase(role.getName())))
                .collect(Collectors.toList());
            
            if (allDoctors == null || allDoctors.isEmpty()) {
                return "(Chưa có thông tin bác sĩ)";
            }
            
            Map<MedicalSpecialty, List<User>> groupedDoctors = new HashMap<>();
            for (User doctor : allDoctors) {
                if (doctor.getMedicleSpecially() != null) {
                    for (MedicalSpecialty specialty : doctor.getMedicleSpecially()) {
                        groupedDoctors.computeIfAbsent(specialty, k -> new ArrayList<>()).add(doctor);
                    }
                }
            }
            
            StringJoiner sj = new StringJoiner("\n");
            Map<MedicalSpecialty, String> specialtyNames = buildSpecialtyMap();
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy (EEEE)", new java.util.Locale("vi", "VN"));
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.DayOfWeek dayOfWeek = today.getDayOfWeek();
            
            java.time.LocalDate mondayThisWeek = today.minusDays(dayOfWeek.getValue() - 1);
            java.time.LocalDate saturdayThisWeek = mondayThisWeek.plusDays(5);
            java.time.LocalDate mondayNextWeek = mondayThisWeek.plusDays(7);
            java.time.LocalDate saturdayNextWeek = mondayNextWeek.plusDays(5);
            
            for (Map.Entry<MedicalSpecialty, List<User>> entry : groupedDoctors.entrySet()) {
                MedicalSpecialty specialty = entry.getKey();
                List<User> doctors = entry.getValue();
                
                sj.add("┌─ " + specialtyNames.get(specialty).toUpperCase() + " ─────────────────────────────────────┐");
                
                for (User doctor : doctors) {
                    sj.add("│");
                    sj.add("│  👨‍⚕️  " + doctor.getUsername() + " (ID: " + doctor.getId() + ")");
                    if (doctor.getExperience() != null && doctor.getExperience() > 0) {
                        sj.add("│     Kinh nghiệm: " + doctor.getExperience() + " năm");
                    }
                    if (doctor.getDescription() != null && !doctor.getDescription().isEmpty()) {
                        sj.add("│     " + doctor.getDescription());
                    }
                    
                    try {
                        List<Schedule> schedules = scheduleRepository.findByDoctor_Id(doctor.getId());
                        
                        if (schedules != null && !schedules.isEmpty()) {
                            sj.add("│");
                            sj.add("│  📅 LỊCH LÀM VIỆC (CHỈ HIỂN THỊ KHUNG GIỜ):");
                            sj.add("│");
                            sj.add("│  📅 TUẦN NÀY:");
                            
                            Map<java.time.LocalDate, List<Schedule>> schedulesByDate = schedules.stream()
                                .filter(s -> s.getWorkDate() != null && 
                                           !s.getWorkDate().isBefore(today) &&
                                           !s.getWorkDate().isBefore(mondayThisWeek) && 
                                           !s.getWorkDate().isAfter(saturdayThisWeek))
                                .collect(Collectors.groupingBy(Schedule::getWorkDate));
                            
                            for (java.time.LocalDate date = mondayThisWeek; !date.isAfter(saturdayThisWeek); date = date.plusDays(1)) {
                                if (date.isBefore(today)) continue; // Bỏ qua ngày đã qua
                                
                                if (schedulesByDate.containsKey(date)) {
                                    sj.add("│    • " + date.format(dateFormatter));
                                    List<Schedule> daySchedules = schedulesByDate.get(date);
                                    
                                    for (Schedule sch : daySchedules) {
                                        String timeRange = sch.getStartTime().format(timeFormatter) + " - " + sch.getEndTime().format(timeFormatter);
                                        // CHỈ hiển thị khung giờ, KHÔNG hiển thị trạng thái
                                        sj.add("│      " + timeRange);
                                    }
                                }
                            }
                            
                            sj.add("│");
                            sj.add("│  📅 TUẦN SAU:");
                            
                            Map<java.time.LocalDate, List<Schedule>> schedulesByDateNext = schedules.stream()
                                .filter(s -> s.getWorkDate() != null && 
                                           !s.getWorkDate().isBefore(mondayNextWeek) && 
                                           !s.getWorkDate().isAfter(saturdayNextWeek))
                                .collect(Collectors.groupingBy(Schedule::getWorkDate));
                            
                            for (java.time.LocalDate date = mondayNextWeek; !date.isAfter(saturdayNextWeek); date = date.plusDays(1)) {
                                if (schedulesByDateNext.containsKey(date)) {
                                    sj.add("│    • " + date.format(dateFormatter));
                                    List<Schedule> daySchedules = schedulesByDateNext.get(date);
                                    
                                    for (Schedule sch : daySchedules) {
                                        String timeRange = sch.getStartTime().format(timeFormatter) + " - " + sch.getEndTime().format(timeFormatter);
                                        // CHỈ hiển thị khung giờ, KHÔNG hiển thị trạng thái
                                        sj.add("│      " + timeRange);
                                    }
                                }
                            }
                        } else {
                            sj.add("│     Lịch: Chưa có lịch cố định");
                        }
                    } catch (Exception scheduleEx) {
                        sj.add("│     Lịch: Không thể truy xuất");
                    }
                    sj.add("│");
                }
                
                sj.add("└─────────────────────────────────────────────────────────────┘");
                sj.add("");
            }
            
            return sj.toString();
        } catch (Exception e) {
            return "(Không thể lấy danh sách bác sĩ: " + e.getMessage() + ")";
        }
    }

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

    public SpecialtyRecommendationResponse parseAIResponse(String aiResponse, DiagnosisRequest request) throws Exception {
        SpecialtyRecommendationResponse response = SpecialtyRecommendationResponse.builder().build();
        
        System.out.println("=== AI Response ===");
        System.out.println(aiResponse);
        System.out.println("=== End AI Response ===");
        
        try {
            int jsonStart = aiResponse.indexOf('{');
            int jsonEnd = aiResponse.lastIndexOf('}');

            if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                String jsonStr = aiResponse.substring(jsonStart, jsonEnd + 1);
                System.out.println("=== Extracted JSON ===");
                System.out.println(jsonStr);
                System.out.println("=== End JSON ===");

                JsonNode bookingNode = mapper.readTree(jsonStr);

                if (bookingNode.has("ready") && bookingNode.get("ready").asBoolean(false)) {
                    response.setReady(true);
                    response.setNeedMoreInfo(false);

                    if (bookingNode.has("bookingType") && !bookingNode.get("bookingType").isNull()) {
                        response.setBookingType(bookingNode.get("bookingType").asText());
                    }

                    if (bookingNode.has("doctorId") && !bookingNode.get("doctorId").isNull()) {
                        response.setDoctorId(bookingNode.get("doctorId").asText());
                    }
                    if (bookingNode.has("doctorName") && !bookingNode.get("doctorName").isNull()) {
                        response.setDoctorName(bookingNode.get("doctorName").asText());
                    }

                    if (bookingNode.has("workDate") && !bookingNode.get("workDate").isNull()) {
                        response.setWorkDate(bookingNode.get("workDate").asText());
                    }
                    if (bookingNode.has("startTime") && !bookingNode.get("startTime").isNull()) {
                        response.setStartTime(bookingNode.get("startTime").asText());
                    }
                    if (bookingNode.has("endTime") && !bookingNode.get("endTime").isNull()) {
                        response.setEndTime(bookingNode.get("endTime").asText());
                    }

                    if (bookingNode.has("medicalExaminationIds") && bookingNode.get("medicalExaminationIds").isArray()) {
                        List<String> examIds = new ArrayList<>();
                        for (JsonNode n : bookingNode.get("medicalExaminationIds")) {
                            if (!n.isNull()) examIds.add(n.asText());
                        }
                        response.setMedicalExaminationIds(examIds);
                    }

                    if (bookingNode.has("totalPrice") && bookingNode.get("totalPrice").isNumber()) {
                        response.setTotalPrice(bookingNode.get("totalPrice").asDouble());
                    }
                    if (bookingNode.has("discountedPrice") && bookingNode.get("discountedPrice").isNumber()) {
                        response.setDiscountedPrice(bookingNode.get("discountedPrice").asDouble());
                    }
                    
                    // Support both "deposit" and "depositAmount"
                    if (bookingNode.has("depositAmount") && bookingNode.get("depositAmount").isNumber()) {
                        response.setDepositAmount(bookingNode.get("depositAmount").asDouble());
                    } else if (bookingNode.has("deposit") && bookingNode.get("deposit").isNumber()) {
                        response.setDepositAmount(bookingNode.get("deposit").asDouble());
                    }
                    
                    if (bookingNode.has("discount") && bookingNode.get("discount").canConvertToInt()) {
                        response.setDiscount(bookingNode.get("discount").asInt());
                    }

                    if (bookingNode.has("serviceSlots") && bookingNode.get("serviceSlots").isArray()) {
                        List<SpecialtyRecommendationResponse.ServiceSlotDto> serviceSlots = new ArrayList<>();
                        for (JsonNode s : bookingNode.get("serviceSlots")) {
                            String serviceId = s.has("serviceId") && !s.get("serviceId").isNull() ? s.get("serviceId").asText() : null;
                            String sStart = s.has("startTime") && !s.get("startTime").isNull() ? s.get("startTime").asText() : null;
                            String sEnd = s.has("endTime") && !s.get("endTime").isNull() ? s.get("endTime").asText() : null;
                            SpecialtyRecommendationResponse.ServiceSlotDto slot = SpecialtyRecommendationResponse.ServiceSlotDto.builder()
                                    .serviceId(serviceId)
                                    .startTime(sStart)
                                    .endTime(sEnd)
                                    .build();
                            serviceSlots.add(slot);
                        }
                        response.setServiceSlots(serviceSlots);
                    }

                    if (bookingNode.has("consultationSlot") && bookingNode.get("consultationSlot").isObject()) {
                        JsonNode cs = bookingNode.get("consultationSlot");
                        String cStart = cs.has("startTime") && !cs.get("startTime").isNull() ? cs.get("startTime").asText() : null;
                        String cEnd = cs.has("endTime") && !cs.get("endTime").isNull() ? cs.get("endTime").asText() : null;
                        SpecialtyRecommendationResponse.TimeSlotDto consultation = SpecialtyRecommendationResponse.TimeSlotDto.builder()
                                .startTime(cStart)
                                .endTime(cEnd)
                                .build();
                        response.setConsultationSlot(consultation);
                    }

                    String diagnosis = aiResponse.substring(0, jsonStart).trim();
                    response.setDiagnosis(cleanAIResponse(diagnosis));

                    System.out.println("=== Parsed Booking Response ===");
                    System.out.println("Ready: true");
                    System.out.println("BookingType: " + response.getBookingType());
                    System.out.println("DoctorId: " + response.getDoctorId());
                    System.out.println("WorkDate: " + response.getWorkDate());
                    System.out.println("=== End Parsed Booking ===");

                    return response;
                }
            }
        } catch (Exception e) {
            System.out.println("Failed to parse JSON booking data: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Fallback logic...
        response.setNeedMoreInfo(true);
        String cleanResponse = cleanAIResponse(aiResponse);
        response.setFollowUpQuestion(cleanResponse);
        response.setDiagnosis(cleanResponse);
        
        return response;
    }

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
    
    private String cleanAIResponse(String text) {
        if (text == null) return "";
        
        return text
            .replaceAll("(?m)^SPECIALTY_ENUM:.*$", "")
            .replaceAll("(?m)^BOOKING_LINK:.*$", "")
            .replaceAll("(?m)^Đề xuất đăng ký:.*$", "")
            .replaceAll("(?m)^Mức độ nghiêm trọng:.*$", "")
            .replaceAll("(?m)^Cảnh báo cần nhập viện:.*$", "")
            .replaceAll("(?m)^Đề xuất dịch vụ:.*$", "")
            .replaceAll("---START---", "")
            .replaceAll("---END---", "")
            .replaceAll("(?m)^\\s*$[\n\r]{1,}", "\n")
            .trim();
    }
    
    private String getSpecialtyNameVi(MedicalSpecialty specialty) {
        Map<MedicalSpecialty, String> specialtyNames = buildSpecialtyMap();
        return specialtyNames.getOrDefault(specialty, specialty.name());
    }
    
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
    
    private String buildBookingUrl(String enumName) {
        String encoded = URLEncoder.encode(enumName, StandardCharsets.UTF_8);
        return "http://localhost:5173/booking-schedule-new?specialty=" + encoded;
    }
}
