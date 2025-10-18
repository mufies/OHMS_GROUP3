package com.example.ohms.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.ohms.dto.request.DiagnosisRequest;
import com.example.ohms.dto.response.DiagnosisResponse;
import com.example.ohms.service.GeminiService;

@RestController
@RequestMapping("/api/diagnose")
public class DiagnosisController {

    private final GeminiService geminiService;

    public DiagnosisController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("HospitalBot is running");
    }

    @PostMapping
    public ResponseEntity<?> diagnose(@RequestBody DiagnosisRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\":\"Missing message in request body\"}");
        }

        try {
            String reply = geminiService.generateDiagnosisReply(request);
            DiagnosisResponse resp = new DiagnosisResponse();
            resp.setReply(reply);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\":\"Internal server error: " + e.getMessage() + "\"}");
        }
    }
}