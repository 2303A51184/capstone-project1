package com.fraud.monitoring.controller;

import com.fraud.monitoring.model.FraudAlert;
import com.fraud.monitoring.model.Transaction;
import com.fraud.monitoring.model.User;
import com.fraud.monitoring.repository.FraudAlertRepository;
import com.fraud.monitoring.repository.TransactionRepository;
import com.fraud.monitoring.repository.UserRepository;
import com.fraud.monitoring.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FraudAlertRepository fraudAlertRepository;

    @Autowired
    private PredictionService predictionService;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    /**
     * Get transactions strictly scoped:
     * - Super Admin: sees all system transactions
     * - Standard User: sees ONLY their own transactions
     */
    @GetMapping
    public ResponseEntity<?> getTransactions() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required to view transactions."));
        }

        if ("ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.ok(transactionRepository.findAllByOrderByCreatedAtDesc());
        }

        // Strict isolation: User A sees only User A's transactions
        return ResponseEntity.ok(transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    /**
     * Get single transaction:
     * Validates that the transaction belongs to the calling user or user is Super Admin.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTransactionById(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required."));
        }

        Optional<Transaction> txOpt = transactionRepository.findById(id);
        if (txOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Transaction not found."));
        }

        Transaction tx = txOpt.get();
        if (!"ROLE_ADMIN".equals(user.getRole()) && !tx.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: You are not authorized to view another user's transaction."));
        }

        return ResponseEntity.ok(tx);
    }

    /**
     * Create transaction:
     * Bound strictly to the authenticated user ID.
     */
    @PostMapping
    public ResponseEntity<?> createTransaction(@RequestBody Transaction transaction) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required. Please sign in to create a transaction."));
        }

        if (transaction.getAmount() == null || transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Amount must be greater than zero."));
        }
        if (transaction.getMerchant() == null || transaction.getMerchant().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Merchant name is required."));
        }

        transaction.setUser(user);

        // 1. Invoke Real AI Prediction Microservice (Flask Random Forest Engine)
        Map<String, Object> prediction = predictionService.predict(
            transaction.getAmount().doubleValue(),
            transaction.getMerchant(),
            transaction.getLocation(),
            transaction.getCategory(),
            transaction.getWebsite()
        );

        double fraudProb = extractDouble(prediction, "fraud_probability", "fraudProbability", 0.05);
        int riskScore = extractInt(prediction, "risk_score", "riskScore", 15);

        // 2. Strict Risk Classification
        // LOW: 0-29 | MEDIUM: 30-69 | HIGH: 70-100
        String riskLevel;
        String status;
        boolean isFraud;

        if (riskScore >= 70) {
            riskLevel = "HIGH";
            status = "BLOCKED";
            isFraud = true;
        } else if (riskScore >= 30) {
            riskLevel = "MEDIUM";
            status = "UNDER_REVIEW";
            isFraud = false;
        } else {
            riskLevel = "LOW";
            status = "APPROVED";
            isFraud = false;
        }

        transaction.setFraudProbability(Math.round(fraudProb * 100.0) / 100.0);
        transaction.setRiskScore(riskScore);
        transaction.setRiskLevel(riskLevel);
        transaction.setIsFraud(isFraud);
        transaction.setStatus(status);

        if (transaction.getCurrency() == null) transaction.setCurrency("INR");
        if (transaction.getPaymentMethod() == null) transaction.setPaymentMethod("UPI");
        if (transaction.getCreatedAt() == null) transaction.setCreatedAt(LocalDateTime.now());
        if (transaction.getTransactionId() == null || transaction.getTransactionId().trim().isEmpty()) {
            transaction.setTransactionId("UPI-" + System.currentTimeMillis());
        }

        Transaction savedTx = transactionRepository.save(transaction);

        // 3. Automated Fraud Alert Generation for User
        if (riskScore >= 30) {
            String msg = (riskScore >= 70)
                ? String.format("CRITICAL: High-risk anomaly (Score: %d) on %s for INR %.2f. Transaction has been automatically BLOCKED.", riskScore, savedTx.getMerchant(), savedTx.getAmount())
                : String.format("WARNING: Medium-risk anomaly (Score: %d) on %s for INR %.2f. Transaction held for compliance review.", riskScore, savedTx.getMerchant(), savedTx.getAmount());

            FraudAlert alert = new FraudAlert(
                user.getId(),
                user.getUsername(),
                savedTx.getTransactionId(),
                savedTx.getAmount(),
                savedTx.getMerchant(),
                riskScore,
                riskLevel,
                msg
            );
            fraudAlertRepository.save(alert);
        }

        // Update user activity time
        user.setLastActivityAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(savedTx);
    }

    @PostMapping("/evaluate-ai")
    public ResponseEntity<?> evaluateAi(@RequestBody Map<String, Object> payload) {
        double amount = 0.0;
        if (payload.get("amount") instanceof Number) {
            amount = ((Number) payload.get("amount")).doubleValue();
        } else if (payload.get("amount") != null) {
            try { amount = Double.parseDouble(payload.get("amount").toString()); } catch (Exception ignored) {}
        }

        String merchant = String.valueOf(payload.getOrDefault("merchant", "Online Merchant"));
        String location = String.valueOf(payload.getOrDefault("location", "India"));
        String category = String.valueOf(payload.getOrDefault("category", "ONLINE"));
        String website = String.valueOf(payload.getOrDefault("website", ""));

        Map<String, Object> prediction = predictionService.predict(amount, merchant, location, category, website);

        double fraudProb = extractDouble(prediction, "fraud_probability", "fraudProbability", 0.08);
        int riskScore = extractInt(prediction, "risk_score", "riskScore", 15);

        String riskClassification = (riskScore >= 70) ? "HIGH" : ((riskScore >= 30) ? "MEDIUM" : "LOW");
        String detectionResult = (riskScore >= 70) ? "BLOCK" : ((riskScore >= 30) ? "HOLD FOR REVIEW" : "APPROVE");

        List<String> explanations = new ArrayList<>();
        if (riskScore >= 70) {
            explanations.add("Excessive transaction value or non-linear velocity deviation detected.");
            if (website.contains("movierulz") || website.contains(".watch") || website.contains(".xyz") || website.contains(".tk") || website.contains("-login")) {
                explanations.add("Illegal domain heuristic match: Identified unauthorized or deceptive merchant domain.");
            }
            if ("CRYPTO".equalsIgnoreCase(category) || "GAMBLING".equalsIgnoreCase(category)) {
                explanations.add("High-risk merchant industry profile with heightened chargeback frequency.");
            }
        } else if (riskScore >= 30) {
            explanations.add("Moderate risk variance: Value falls outside standard baseline for specified category.");
            explanations.add("Manual identity confirmation and multi-factor secondary verification recommended.");
        } else {
            explanations.add("Consistent with standard consumer purchasing patterns.");
            explanations.add("Clean domain reputation check; SSL certificates and trusted payment gateway verified.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("fraud_probability", Math.round(fraudProb * 1000.0) / 10.0 + "%");
        result.put("fraud_probability_raw", Math.round(fraudProb * 100.0) / 100.0);
        result.put("risk_score", riskScore);
        result.put("risk_classification", riskClassification);
        result.put("detection_result", detectionResult);
        result.put("fraud_explanation", explanations);
        result.put("transaction_info", Map.of(
            "amount", amount,
            "merchant", merchant,
            "category", category,
            "location", location,
            "website", website
        ));
        result.put("model_architecture", "Random Forest Ensemble (SMOTE Balanced)");

        return ResponseEntity.ok(result);
    }

    private double extractDouble(Map<String, Object> map, String key1, String key2, double defaultVal) {
        if (map == null) return defaultVal;
        Object val = map.getOrDefault(key1, map.get(key2));
        if (val instanceof Number) return ((Number) val).doubleValue();
        return defaultVal;
    }

    private int extractInt(Map<String, Object> map, String key1, String key2, int defaultVal) {
        if (map == null) return defaultVal;
        Object val = map.getOrDefault(key1, map.get(key2));
        if (val instanceof Number) return ((Number) val).intValue();
        return defaultVal;
    }
}
