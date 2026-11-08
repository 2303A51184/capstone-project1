package com.fraud.monitoring.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class FraudPredictionClient {
    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> predict(double amount, String merchant, String location, String category) {
        return predict(amount, merchant, location, category, "");
    }

    public Map<String, Object> predict(double amount, String merchant, String location, String category, String website) {
        String url = "http://localhost:5000/predict";
        Map<String, Object> request = new HashMap<>();
        request.put("amount", amount);
        request.put("merchant", merchant);
        request.put("location", location);
        request.put("category", category);
        if (website != null && !website.isEmpty()) {
            request.put("website", website);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            return restTemplate.postForObject(url, entity, Map.class);
        } catch (Exception e) {
            System.err.println("WARNING: AI Microservice unreachable (" + e.getMessage() + "). Applying resilient rule-based heuristic fallback.");
            return computeFallbackPrediction(amount, merchant, location, category, website);
        }
    }

    private Map<String, Object> computeFallbackPrediction(double amount, String merchant, String location, String category, String website) {
        int riskScore = 12;
        String merchantLower = merchant != null ? merchant.toLowerCase() : "";
        String locationLower = location != null ? location.toLowerCase() : "";
        String categoryUpper = category != null ? category.toUpperCase() : "ONLINE";
        String websiteLower = website != null ? website.toLowerCase() : "";

        if (amount > 250000) {
            riskScore = Math.max(riskScore, 85);
        } else if (amount > 100000) {
            riskScore = Math.max(riskScore, 65);
        } else if (amount > 30000) {
            riskScore = Math.max(riskScore, 40);
        }

        if ("CRYPTO".equals(categoryUpper) || "GAMBLING".equals(categoryUpper)) {
            riskScore += 20;
        }

        if (merchantLower.contains("crypto") || merchantLower.contains("casino") || merchantLower.contains("offshore") || merchantLower.contains("darknet")) {
            riskScore += 20;
        }

        if (locationLower.contains("offshore") || locationLower.contains("foreign") || locationLower.contains("unknown") || locationLower.contains("high risk")) {
            riskScore += 20;
        }

        if (websiteLower.contains("onion") || websiteLower.contains("dark") || websiteLower.contains("unknown") || websiteLower.contains("crypto") || websiteLower.contains("movierulz") || websiteLower.contains("torrent") || websiteLower.contains("pirate") || merchantLower.contains("movierulz")) {
            riskScore = Math.max(riskScore, 85);
        }

        riskScore = Math.min(100, Math.max(1, riskScore));
        boolean isFraud = riskScore >= 70;
        double fraudProb = Math.round((riskScore / 100.0) * 1000.0) / 1000.0;

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("risk_score", riskScore);
        fallback.put("fraud_probability", fraudProb);
        fallback.put("is_fraud", isFraud);
        fallback.put("prediction", isFraud ? "FRAUD" : "LEGITIMATE");
        fallback.put("status", isFraud ? "FLAGGED" : "APPROVED");
        fallback.put("recommendation", isFraud ? "BLOCK_TRANSACTION" : "APPROVE_TRANSACTION");
        fallback.put("fallback_mode", true);
        return fallback;
    }
}
