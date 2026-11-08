package com.fraud.monitoring.controller;

import com.fraud.monitoring.model.FraudAlert;
import com.fraud.monitoring.model.Transaction;
import com.fraud.monitoring.model.User;
import com.fraud.monitoring.repository.FraudAlertRepository;
import com.fraud.monitoring.repository.TransactionRepository;
import com.fraud.monitoring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/user", "/api/users"})
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private FraudAlertRepository fraudAlertRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    /**
     * Users list: Restricted to Super Admin.
     * Normal users are FORBIDDEN from viewing all registered users.
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        User caller = getAuthenticatedUser();
        if (caller == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required."));
        }
        if (!"ROLE_ADMIN".equals(caller.getRole())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden: Only Super Admin can view all registered users."));
        }

        List<User> list = userRepository.findAllByOrderByCreatedAtDesc();
        list.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(list);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("fullName", user.getFullName());
        map.put("phone", user.getPhone());
        map.put("role", user.getRole());
        map.put("authProvider", user.getAuthProvider());
        map.put("active", user.isActive());
        map.put("createdAt", user.getCreatedAt());
        map.put("lastLoginAt", user.getLastLoginAt());
        return ResponseEntity.ok(map);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        if (payload.containsKey("fullName")) user.setFullName(payload.get("fullName"));
        if (payload.containsKey("phone")) user.setPhone(payload.get("phone"));

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully.", "user", user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters."));
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password does not match."));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    /**
     * User Personal Dashboard Statistics:
     * Calculates strictly from records belonging to the calling user.
     * New users start with 0 transactions, 0 amount, 0 fraud.
     */
    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        List<Transaction> txList = transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        long totalTx = txList.size();
        BigDecimal totalAmount = txList.stream()
                .map(Transaction::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long successful = txList.stream().filter(t -> "APPROVED".equalsIgnoreCase(t.getStatus())).count();
        long suspicious = txList.stream().filter(t -> "UNDER_REVIEW".equalsIgnoreCase(t.getStatus())).count();
        long blocked = txList.stream().filter(t -> "BLOCKED".equalsIgnoreCase(t.getStatus()) || Boolean.TRUE.equals(t.getIsFraud())).count();

        double fraudRate = totalTx > 0 ? ((double) blocked / totalTx) * 100.0 : 0.0;

        // Risk distribution
        long lowRisk = txList.stream().filter(t -> "LOW".equalsIgnoreCase(t.getRiskLevel()) || (t.getRiskScore() != null && t.getRiskScore() < 30)).count();
        long medRisk = txList.stream().filter(t -> "MEDIUM".equalsIgnoreCase(t.getRiskLevel()) || (t.getRiskScore() != null && t.getRiskScore() >= 30 && t.getRiskScore() < 70)).count();
        long highRisk = txList.stream().filter(t -> "HIGH".equalsIgnoreCase(t.getRiskLevel()) || (t.getRiskScore() != null && t.getRiskScore() >= 70)).count();

        // Monthly graph (last 6 months)
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, BigDecimal> monthlyVolume = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            String mKey = java.time.YearMonth.now().minusMonths(i).format(monthFmt);
            monthlyVolume.put(mKey, BigDecimal.ZERO);
        }

        for (Transaction t : txList) {
            if (t.getCreatedAt() != null && t.getAmount() != null) {
                String mKey = t.getCreatedAt().format(monthFmt);
                if (monthlyVolume.containsKey(mKey)) {
                    monthlyVolume.put(mKey, monthlyVolume.get(mKey).add(t.getAmount()));
                }
            }
        }

        // Recent 5 transactions
        List<Transaction> recent = txList.stream().limit(5).collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTransactions", totalTx);
        stats.put("totalAmount", totalAmount);
        stats.put("successfulTransactions", successful);
        stats.put("suspiciousTransactions", suspicious);
        stats.put("blockedTransactions", blocked);
        stats.put("fraudDetectionRate", Math.round(fraudRate * 10.0) / 10.0);
        stats.put("riskDistribution", Map.of("low", lowRisk, "medium", medRisk, "high", highRisk));
        stats.put("statusChart", Map.of("approved", successful, "underReview", suspicious, "blocked", blocked));
        stats.put("monthlyGraph", monthlyVolume);
        stats.put("recentTransactions", recent);
        stats.put("unreadAlertsCount", fraudAlertRepository.countByUserIdAndStatus(user.getId(), "UNREAD"));

        return ResponseEntity.ok(stats);
    }

    /**
     * User Personal Transactions:
     * Strictly scoped to calling user's transactions only.
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getUserTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String sortBy) {

        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        List<Transaction> list = transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase().trim();
            list = list.stream().filter(t ->
                (t.getMerchant() != null && t.getMerchant().toLowerCase().contains(q)) ||
                (t.getTransactionId() != null && t.getTransactionId().toLowerCase().contains(q)) ||
                (t.getLocation() != null && t.getLocation().toLowerCase().contains(q)) ||
                (t.getWebsite() != null && t.getWebsite().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream().filter(t -> status.equalsIgnoreCase(t.getStatus())).collect(Collectors.toList());
        }

        if (riskLevel != null && !riskLevel.trim().isEmpty() && !"ALL".equalsIgnoreCase(riskLevel)) {
            list = list.stream().filter(t -> riskLevel.equalsIgnoreCase(t.getRiskLevel())).collect(Collectors.toList());
        }

        if ("amount_desc".equalsIgnoreCase(sortBy)) {
            list.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));
        } else if ("amount_asc".equalsIgnoreCase(sortBy)) {
            list.sort((a, b) -> a.getAmount().compareTo(b.getAmount()));
        } else if ("risk_desc".equalsIgnoreCase(sortBy)) {
            list.sort((a, b) -> Integer.compare(b.getRiskScore() != null ? b.getRiskScore() : 0, a.getRiskScore() != null ? a.getRiskScore() : 0));
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getUserAlerts(@RequestParam(required = false) String riskLevel) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        List<FraudAlert> alerts = fraudAlertRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (riskLevel != null && !"ALL".equalsIgnoreCase(riskLevel)) {
            alerts = alerts.stream().filter(a -> riskLevel.equalsIgnoreCase(a.getRiskLevel())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(alerts);
    }

    @PatchMapping("/alerts/{id}/read")
    public ResponseEntity<?> markAlertRead(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Optional<FraudAlert> alertOpt = fraudAlertRepository.findById(id);
        if (alertOpt.isPresent() && alertOpt.get().getUserId().equals(user.getId())) {
            FraudAlert alert = alertOpt.get();
            alert.setStatus("READ");
            fraudAlertRepository.save(alert);
            return ResponseEntity.ok(Map.of("message", "Alert marked as read."));
        }
        return ResponseEntity.status(404).body(Map.of("message", "Alert not found."));
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<?> userHeartbeat() {
        User user = getAuthenticatedUser();
        if (user != null) {
            user.setLastActivityAt(LocalDateTime.now());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("status", "active"));
        }
        return ResponseEntity.status(401).body(Map.of("status", "unauthenticated"));
    }
}
