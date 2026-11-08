package com.fraud.monitoring.controller;

import com.fraud.monitoring.model.AuditLog;
import com.fraud.monitoring.model.LoginHistory;
import com.fraud.monitoring.model.SystemConfig;
import com.fraud.monitoring.model.Transaction;
import com.fraud.monitoring.model.User;
import com.fraud.monitoring.model.WebsiteScan;
import com.fraud.monitoring.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    @Autowired
    private WebsiteScanRepository websiteScanRepository;

    /**
     * Strict Authorization: Verifies calling user is the Super Admin.
     */
    private User requireSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null || !"ROLE_ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden: Access restricted to authorized Super Admin.");
        }
        return user;
    }

    /**
     * System Overview - STRICTLY for Super Admin
     */
    @GetMapping("/overview")
    public ResponseEntity<?> overview() {
        requireSuperAdmin();
        Map<String, Object> stats = new HashMap<>();
        stats.put("users", userRepository.count());
        stats.put("transactions", transactionRepository.count());
        stats.put("fraudulentTransactions", transactionRepository.countByIsFraudTrue());
        stats.put("highRiskTransactions", transactionRepository.countByRiskScoreGreaterThanEqual(70));
        return ResponseEntity.ok(stats);
    }

    /**
     * Comprehensive Super Admin Master Control Dashboard Statistics
     * All metrics computed directly from database tables.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getAdminDashboard() {
        requireSuperAdmin();

        LocalDateTime todayStart = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();
        LocalDateTime activeCutoff = LocalDateTime.now().minusMinutes(5);

        // 1. User Statistics
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByLastActivityAtAfter(activeCutoff);
        long inactiveUsers = userRepository.countByActiveFalse();
        long signupsToday = userRepository.countByCreatedAtAfter(todayStart);
        long signupsThisMonth = userRepository.countByCreatedAtAfter(monthStart);

        // 2. Login Statistics
        long totalLogins = loginHistoryRepository.count();
        long successfulLogins = loginHistoryRepository.countByStatus("SUCCESS");
        long failedLogins = loginHistoryRepository.countByStatus("FAILED");
        long googleLogins = loginHistoryRepository.countByAuthMethod("GOOGLE");
        long emailLogins = loginHistoryRepository.countByAuthMethod("LOCAL");
        long loginsToday = loginHistoryRepository.countByLoginTimeAfter(todayStart);

        // 3. Transaction Statistics
        List<Transaction> allTx = transactionRepository.findAllByOrderByCreatedAtDesc();
        long totalTx = allTx.size();
        BigDecimal totalVolume = allTx.stream()
                .map(Transaction::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long fraudTx = allTx.stream().filter(t -> Boolean.TRUE.equals(t.getIsFraud()) || "BLOCKED".equalsIgnoreCase(t.getStatus())).count();
        long pendingReviews = allTx.stream().filter(t -> "UNDER_REVIEW".equalsIgnoreCase(t.getStatus())).count();
        long blockedTx = allTx.stream().filter(t -> "BLOCKED".equalsIgnoreCase(t.getStatus())).count();
        long approvedTx = allTx.stream().filter(t -> "APPROVED".equalsIgnoreCase(t.getStatus())).count();

        double fraudRate = totalTx > 0 ? ((double) fraudTx / totalTx) * 100.0 : 0.0;

        // 4. Live Active Users List (Active within last 5 minutes)
        List<User> liveActiveUsersList = userRepository.findByLastActivityAtAfterOrderByLastActivityAtDesc(activeCutoff);
        List<Map<String, Object>> activeUsersSummary = liveActiveUsersList.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("fullName", u.getFullName());
            map.put("authProvider", u.getAuthProvider());
            map.put("lastLoginAt", u.getLastLoginAt());
            map.put("lastActivityAt", u.getLastActivityAt());
            map.put("active", u.isActive());
            map.put("role", u.getRole());
            return map;
        }).collect(Collectors.toList());

        // 5. Recent Logins Feed
        List<LoginHistory> recentLogins = loginHistoryRepository.findTop15ByOrderByLoginTimeDesc();

        // 6. Monthly Transaction Trends
        DateTimeFormatter mFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Map<String, Object>> monthlyTrends = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            String mKey = java.time.YearMonth.now().minusMonths(i).format(mFmt);
            Map<String, Object> val = new HashMap<>();
            val.put("volume", BigDecimal.ZERO);
            val.put("totalCount", 0L);
            val.put("fraudCount", 0L);
            monthlyTrends.put(mKey, val);
        }

        for (Transaction t : allTx) {
            if (t.getCreatedAt() != null) {
                String mKey = t.getCreatedAt().format(mFmt);
                if (monthlyTrends.containsKey(mKey)) {
                    Map<String, Object> map = monthlyTrends.get(mKey);
                    if (t.getAmount() != null) {
                        map.put("volume", ((BigDecimal) map.get("volume")).add(t.getAmount()));
                    }
                    map.put("totalCount", ((Long) map.get("totalCount")) + 1);
                    if (Boolean.TRUE.equals(t.getIsFraud()) || "BLOCKED".equalsIgnoreCase(t.getStatus())) {
                        map.put("fraudCount", ((Long) map.get("fraudCount")) + 1);
                    }
                }
            }
        }

        // Risk distribution
        long lowRisk = allTx.stream().filter(t -> "LOW".equalsIgnoreCase(t.getRiskLevel())).count();
        long medRisk = allTx.stream().filter(t -> "MEDIUM".equalsIgnoreCase(t.getRiskLevel())).count();
        long highRisk = allTx.stream().filter(t -> "HIGH".equalsIgnoreCase(t.getRiskLevel())).count();

        // Recent suspicious transactions
        List<Transaction> suspiciousRecent = allTx.stream()
                .filter(t -> "HIGH".equalsIgnoreCase(t.getRiskLevel()) || "MEDIUM".equalsIgnoreCase(t.getRiskLevel()) || "BLOCKED".equalsIgnoreCase(t.getStatus()))
                .limit(8)
                .collect(Collectors.toList());

        // 7. Live Charts Data Computation (Real Database Records)
        // a) 7-Day Daily Registrations
        List<Map<String, Object>> dailyRegistrations = new ArrayList<>();
        // b) 7-Day Daily Logins (Total, Success, Failed)
        List<Map<String, Object>> dailyLogins = new ArrayList<>();
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate d = java.time.LocalDate.now().minusDays(i);
            String dayLabel = d.format(dayFmt);
            LocalDateTime dayStart = d.atStartOfDay();
            LocalDateTime dayEnd = d.atTime(LocalTime.MAX);

            long regCount = userRepository.countByCreatedAtBetween(dayStart, dayEnd);
            dailyRegistrations.add(Map.of("date", dayLabel, "count", regCount));

            long succCount = loginHistoryRepository.countByStatusAndLoginTimeBetween("SUCCESS", dayStart, dayEnd);
            long failCount = loginHistoryRepository.countByStatusAndLoginTimeBetween("FAILED", dayStart, dayEnd);
            dailyLogins.add(Map.of("date", dayLabel, "total", succCount + failCount, "success", succCount, "failed", failCount));
        }

        // c) 6-Month User Growth
        List<Map<String, Object>> monthlyUserGrowth = new ArrayList<>();
        DateTimeFormatter ymFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.now().minusMonths(i);
            String mLabel = ym.format(ymFmt);
            LocalDateTime endOfMonth = ym.atEndOfMonth().atTime(LocalTime.MAX);
            long cumulative = userRepository.findAll().stream()
                    .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isAfter(endOfMonth))
                    .count();
            monthlyUserGrowth.add(Map.of("month", mLabel, "users", cumulative));
        }

        // d) Online users (SessionStatus = ONLINE and activity within last 5 minutes)
        long onlineUsersCount = userRepository.findAll().stream()
                .filter(u -> "ONLINE".equalsIgnoreCase(u.getSessionStatus()) && u.getLastActivityAt() != null && u.getLastActivityAt().isAfter(activeCutoff))
                .count();

        long suspendedUsers = userRepository.countByAccountStatus("SUSPENDED");

        Map<String, Object> dashboard = new HashMap<>();
        // Top 9 Standardized Metrics
        dashboard.put("totalRegisteredUsers", totalUsers);
        dashboard.put("currentlyOnlineUsers", onlineUsersCount);
        dashboard.put("totalSignups", totalUsers);
        dashboard.put("todaySignups", signupsToday);
        dashboard.put("totalSuccessfulLogins", successfulLogins);
        dashboard.put("todayLogins", loginsToday);
        dashboard.put("totalFailedLogins", failedLogins);
        dashboard.put("googleLoginCount", googleLogins);
        dashboard.put("emailLoginCount", emailLogins);

        // User & Session metrics
        dashboard.put("totalUsers", totalUsers);
        dashboard.put("activeUsers", activeUsers);
        dashboard.put("inactiveUsers", inactiveUsers);
        dashboard.put("suspendedUsers", suspendedUsers);
        dashboard.put("signupsToday", signupsToday);
        dashboard.put("signupsThisMonth", signupsThisMonth);
        dashboard.put("liveActiveUsers", activeUsersSummary);

        // Login metrics
        dashboard.put("totalLogins", totalLogins);
        dashboard.put("successfulLogins", successfulLogins);
        dashboard.put("failedLogins", failedLogins);
        dashboard.put("googleLogins", googleLogins);
        dashboard.put("emailLogins", emailLogins);
        dashboard.put("loginsToday", loginsToday);
        dashboard.put("recentLogins", recentLogins);

        // Live Charts
        dashboard.put("dailyRegistrations", dailyRegistrations);
        dashboard.put("dailyLogins", dailyLogins);
        dashboard.put("monthlyUserGrowth", monthlyUserGrowth);
        dashboard.put("authMethodDistribution", Map.of("google", googleLogins, "email", emailLogins));
        dashboard.put("accountStatusDistribution", Map.of("active", activeUsers, "inactive", inactiveUsers, "suspended", suspendedUsers));

        // Transaction metrics
        dashboard.put("totalTransactions", totalTx);
        dashboard.put("totalVolume", totalVolume);
        dashboard.put("fraudTransactions", fraudTx);
        dashboard.put("fraudDetectionRate", Math.round(fraudRate * 10.0) / 10.0);
        dashboard.put("pendingReviews", pendingReviews);
        dashboard.put("blockedTransactions", blockedTx);
        dashboard.put("approvedTransactions", approvedTx);
        dashboard.put("riskDistribution", Map.of("low", lowRisk, "medium", medRisk, "high", highRisk));
        dashboard.put("monthlyTrends", monthlyTrends);
        dashboard.put("recentSuspiciousActivities", suspiciousRecent);

        // Include Complete Website Security & User Fleet Metrics in Main Dashboard
        dashboard.put("totalWebsiteScans", websiteScanRepository.count());
        dashboard.put("uniqueWebsitesScanned", websiteScanRepository.countDistinctDomains());
        dashboard.put("trustedWebsites", websiteScanRepository.countByCategory("TRUSTED WEBSITE"));
        dashboard.put("suspiciousWebsites", websiteScanRepository.countByCategory("SUSPICIOUS WEBSITE"));
        dashboard.put("highRiskWebsites", websiteScanRepository.countByRiskLevel("HIGH"));
        dashboard.put("phishingWebsites", websiteScanRepository.countByCategory("PHISHING WEBSITE"));
        dashboard.put("malwareWebsites", websiteScanRepository.countByCategory("MALWARE WEBSITE"));
        dashboard.put("brandImpersonationsDetected", websiteScanRepository.countByCategory("BRAND IMPERSONATION WEBSITE"));
        dashboard.put("unverifiedWebsites", websiteScanRepository.countByCategory("UNKNOWN WEBSITE"));

        dashboard.put("recentRegistrations", userRepository.findAllByOrderByCreatedAtDesc().stream().limit(8).collect(Collectors.toList()));
        dashboard.put("recentScans", websiteScanRepository.findTop10ByOrderByScannedAtDesc());
        dashboard.put("latestHighRiskDetections", websiteScanRepository.findTop10ByRiskLevelInOrderByScannedAtDesc(List.of("HIGH", "SUSPICIOUS")));

        return ResponseEntity.ok(dashboard);
    }

    /**
     * Super Admin Website Security & Domain Intelligence Monitoring
     */
    @GetMapping("/website-monitoring")
    public ResponseEntity<?> getWebsiteMonitoring() {
        requireSuperAdmin();

        Map<String, Object> data = new HashMap<>();
        data.put("totalWebsiteScans", websiteScanRepository.count());
        data.put("uniqueWebsitesScanned", websiteScanRepository.countDistinctDomains());
        data.put("trustedWebsites", websiteScanRepository.countByCategory("TRUSTED WEBSITE"));
        data.put("suspiciousWebsites", websiteScanRepository.countByCategory("SUSPICIOUS WEBSITE"));
        data.put("highRiskWebsites", websiteScanRepository.countByRiskLevel("HIGH"));
        data.put("phishingWebsites", websiteScanRepository.countByCategory("PHISHING WEBSITE"));
        data.put("malwareWebsites", websiteScanRepository.countByCategory("MALWARE WEBSITE"));
        data.put("brandImpersonationsDetected", websiteScanRepository.countByCategory("BRAND IMPERSONATION WEBSITE"));
        data.put("unverifiedWebsites", websiteScanRepository.countByCategory("UNKNOWN WEBSITE"));

        data.put("recentScans", websiteScanRepository.findTop10ByOrderByScannedAtDesc());
        data.put("recentHighRiskDetections", websiteScanRepository.findTop10ByRiskLevelInOrderByScannedAtDesc(List.of("HIGH", "SUSPICIOUS")));

        List<Map<String, Object>> topDomains = new ArrayList<>();
        try {
            for (Object[] row : websiteScanRepository.findTopScannedDomains()) {
                if (row != null && row.length >= 2) {
                    topDomains.add(Map.of("domain", String.valueOf(row[0]), "scanCount", row[1]));
                }
            }
        } catch (Exception ignored) {}
        data.put("topScannedDomains", topDomains);

        return ResponseEntity.ok(data);
    }

    /**
     * User Management: List all registered users with metrics.
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        requireSuperAdmin();
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase().trim();
            users = users.stream().filter(u ->
                (u.getUsername() != null && u.getUsername().toLowerCase().contains(q)) ||
                (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
                (u.getFullName() != null && u.getFullName().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        if ("ACTIVE".equalsIgnoreCase(status)) {
            users = users.stream().filter(User::isActive).collect(Collectors.toList());
        } else if ("INACTIVE".equalsIgnoreCase(status)) {
            users = users.stream().filter(u -> !u.isActive()).collect(Collectors.toList());
        }

        LocalDateTime activeCutoff = LocalDateTime.now().minusMinutes(5);
        List<Map<String, Object>> response = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("fullName", u.getFullName());
            m.put("phone", u.getPhone());
            m.put("role", u.getRole());
            m.put("authProvider", u.getAuthProvider());
            m.put("active", u.isActive());
            m.put("createdAt", u.getCreatedAt());
            m.put("lastLoginAt", u.getLastLoginAt());
            m.put("lastActivityAt", u.getLastActivityAt());
            m.put("loginCount", u.getLoginCount());
            m.put("isCurrentlyOnline", u.getLastActivityAt() != null && u.getLastActivityAt().isAfter(activeCutoff));
            m.put("transactionCount", transactionRepository.countByUserId(u.getId()));
            response.add(m);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * User Account Activation / Deactivation
     */
    @PatchMapping("/users/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        User admin = requireSuperAdmin();

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        if ("ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot deactivate the Super Admin account."));
        }

        boolean newStatus = !user.isActive();
        user.setActive(newStatus);
        userRepository.save(user);

        String action = newStatus ? "USER_ACCOUNT_ACTIVATED" : "USER_ACCOUNT_DEACTIVATED";
        auditLogRepository.save(new AuditLog(
            admin.getUsername(),
            action,
            "USER",
            user.getId().toString(),
            String.format("User %s (%s) status changed to %s by Super Admin.", user.getUsername(), user.getEmail(), newStatus ? "ACTIVE" : "DEACTIVATED")
        ));

        return ResponseEntity.ok(Map.of("message", "User status updated successfully.", "active", newStatus));
    }

    /**
     * Requirement 2: Dedicated Admin User Activity Monitoring Endpoint
     * Route: /api/admin/user-activity
     * Returns complete 14-field user telemetry.
     */
    @GetMapping("/user-activity")
    public ResponseEntity<?> getUserActivity() {
        requireSuperAdmin();
        List<User> users = userRepository.findAllByOrderByCreatedAtDesc();
        LocalDateTime activeCutoff = LocalDateTime.now().minusMinutes(5);
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("hh:mm:ss a");

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("userId", u.getId());
            map.put("fullName", u.getFullName() != null && !u.getFullName().trim().isEmpty() ? u.getFullName() : u.getUsername());
            map.put("email", u.getEmail());
            map.put("username", u.getUsername());
            map.put("role", u.getRole());

            // 4 & 5. Registration Date & Time
            if (u.getCreatedAt() != null) {
                map.put("registrationDate", u.getCreatedAt().format(dateFmt));
                map.put("registrationTime", u.getCreatedAt().format(timeFmt));
                map.put("createdAt", u.getCreatedAt());
            } else {
                map.put("registrationDate", "N/A");
                map.put("registrationTime", "N/A");
                map.put("createdAt", null);
            }

            // 6. Authentication Method
            String authMethod = "GOOGLE".equalsIgnoreCase(u.getAuthProvider()) ? "Google" : "Email and Password";
            map.put("authMethod", authMethod);

            // 7 & 8. Last Login Date & Time
            if (u.getLastLoginAt() != null) {
                map.put("lastLoginDate", u.getLastLoginAt().format(dateFmt));
                map.put("lastLoginTime", u.getLastLoginAt().format(timeFmt));
                map.put("lastLoginAt", u.getLastLoginAt());
            } else {
                map.put("lastLoginDate", "Never");
                map.put("lastLoginTime", "N/A");
                map.put("lastLoginAt", null);
            }

            // 9 & 10. Successful Logins & Failed Login Attempts
            map.put("totalSuccessfulLogins", u.getLoginCount() != null ? u.getLoginCount() : 0);
            map.put("failedLoginAttempts", u.getFailedLoginCount() != null ? u.getFailedLoginCount() : 0);

            // 11. Account Status (Active, Inactive, Suspended)
            String accStatus = u.getAccountStatus();
            if (accStatus == null) {
                accStatus = u.isActive() ? "Active" : "Inactive";
            } else {
                accStatus = accStatus.substring(0, 1).toUpperCase() + accStatus.substring(1).toLowerCase();
            }
            map.put("accountStatus", accStatus);

            // 12. Current Session Status (Online, Offline)
            boolean isOnline = "ONLINE".equalsIgnoreCase(u.getSessionStatus()) 
                    && u.getLastActivityAt() != null 
                    && u.getLastActivityAt().isAfter(activeCutoff);
            map.put("sessionStatus", isOnline ? "Online" : "Offline");
            map.put("isCurrentlyOnline", isOnline);

            // 13. Last Activity Time
            if (u.getLastActivityAt() != null) {
                map.put("lastActivityTime", u.getLastActivityAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm:ss a")));
                map.put("lastActivityAt", u.getLastActivityAt());
            } else {
                map.put("lastActivityTime", "N/A");
                map.put("lastActivityAt", null);
            }

            // 14. Total Website Scans
            long totalScans = websiteScanRepository.countByUserId(u.getId());
            map.put("totalWebsiteScans", totalScans);

            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Requirement 5: Dedicated Admin User Details Endpoint
     * Route: /api/admin/users/{id}/details
     */
    @GetMapping("/users/{id}/details")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        requireSuperAdmin();
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User u = userOpt.get();
        LocalDateTime activeCutoff = LocalDateTime.now().minusMinutes(5);
        boolean isOnline = "ONLINE".equalsIgnoreCase(u.getSessionStatus()) 
                && u.getLastActivityAt() != null 
                && u.getLastActivityAt().isAfter(activeCutoff);

        Map<String, Object> userDetails = new LinkedHashMap<>();
        userDetails.put("id", u.getId());
        userDetails.put("username", u.getUsername());
        userDetails.put("email", u.getEmail());
        userDetails.put("fullName", u.getFullName());
        userDetails.put("phone", u.getPhone());
        userDetails.put("role", u.getRole());
        userDetails.put("authProvider", u.getAuthProvider());
        userDetails.put("authMethod", "GOOGLE".equalsIgnoreCase(u.getAuthProvider()) ? "Google" : "Email and Password");
        userDetails.put("accountStatus", u.getAccountStatus() != null ? u.getAccountStatus() : (u.isActive() ? "ACTIVE" : "INACTIVE"));
        userDetails.put("sessionStatus", isOnline ? "Online" : "Offline");
        userDetails.put("isCurrentlyOnline", isOnline);
        userDetails.put("active", u.isActive());
        userDetails.put("createdAt", u.getCreatedAt());
        userDetails.put("lastLoginAt", u.getLastLoginAt());
        userDetails.put("lastLogoutAt", u.getLastLogoutAt());
        userDetails.put("lastActivityAt", u.getLastActivityAt());
        userDetails.put("loginCount", u.getLoginCount());
        userDetails.put("failedLoginCount", u.getFailedLoginCount());

        long totalScans = websiteScanRepository.countByUserId(u.getId());
        userDetails.put("totalWebsiteScans", totalScans);

        Map<String, Object> response = new HashMap<>();
        response.put("user", userDetails);
        response.put("recentScans", websiteScanRepository.findByUserIdOrderByScannedAtDesc(id).stream().limit(25).collect(Collectors.toList()));
        response.put("loginHistory", loginHistoryRepository.findByUserIdOrderByLoginTimeDesc(id).stream().limit(25).collect(Collectors.toList()));
        response.put("transactions", transactionRepository.findByUserIdOrderByCreatedAtDesc(id).stream().limit(25).collect(Collectors.toList()));

        return ResponseEntity.ok(response);
    }

    /**
     * Requirement 5: Update User Account Status (ACTIVE, INACTIVE, SUSPENDED)
     */
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserAccountStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User admin = requireSuperAdmin();
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.notFound().build();

        User user = userOpt.get();
        if ("ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot modify the Super Admin account status."));
        }

        String targetStatus = body.get("status");
        if (targetStatus == null || targetStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status is required (ACTIVE, INACTIVE, SUSPENDED)."));
        }

        String normStatus = targetStatus.trim().toUpperCase();
        if (!normStatus.equals("ACTIVE") && !normStatus.equals("INACTIVE") && !normStatus.equals("SUSPENDED")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status. Allowed values: ACTIVE, INACTIVE, SUSPENDED."));
        }

        user.setAccountStatus(normStatus);
        user.setActive("ACTIVE".equals(normStatus));
        if (!user.isActive()) {
            user.setSessionStatus("OFFLINE");
        }
        userRepository.save(user);

        auditLogRepository.save(new AuditLog(
            admin.getUsername(),
            "USER_STATUS_UPDATED",
            "USER",
            user.getId().toString(),
            String.format("User %s (%s) account status updated to %s by Super Admin.", user.getUsername(), user.getEmail(), normStatus)
        ));

        return ResponseEntity.ok(Map.of("message", "User account status updated to " + normStatus, "accountStatus", normStatus, "active", user.isActive()));
    }

    @GetMapping("/users/{id}/transactions")
    public ResponseEntity<?> getUserTransactions(@PathVariable Long id) {
        requireSuperAdmin();
        return ResponseEntity.ok(transactionRepository.findByUserIdOrderByCreatedAtDesc(id));
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getAllTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String category) {

        requireSuperAdmin();
        List<Transaction> list = transactionRepository.findAllByOrderByCreatedAtDesc();

        if (search != null && !search.trim().isEmpty()) {
            String q = search.toLowerCase().trim();
            list = list.stream().filter(t ->
                (t.getMerchant() != null && t.getMerchant().toLowerCase().contains(q)) ||
                (t.getTransactionId() != null && t.getTransactionId().toLowerCase().contains(q)) ||
                (t.getLocation() != null && t.getLocation().toLowerCase().contains(q)) ||
                (t.getWebsite() != null && t.getWebsite().toLowerCase().contains(q)) ||
                (t.getUser() != null && t.getUser().getUsername().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        if (status != null && !"ALL".equalsIgnoreCase(status)) {
            list = list.stream().filter(t -> status.equalsIgnoreCase(t.getStatus())).collect(Collectors.toList());
        }

        if (riskLevel != null && !"ALL".equalsIgnoreCase(riskLevel)) {
            list = list.stream().filter(t -> riskLevel.equalsIgnoreCase(t.getRiskLevel())).collect(Collectors.toList());
        }

        if (category != null && !"ALL".equalsIgnoreCase(category)) {
            list = list.stream().filter(t -> category.equalsIgnoreCase(t.getCategory())).collect(Collectors.toList());
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/fraud-transactions")
    public ResponseEntity<?> getFraudTransactions() {
        requireSuperAdmin();
        List<Transaction> list = transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(t -> "HIGH".equalsIgnoreCase(t.getRiskLevel()) || "MEDIUM".equalsIgnoreCase(t.getRiskLevel()) || Boolean.TRUE.equals(t.getIsFraud()) || "BLOCKED".equalsIgnoreCase(t.getStatus()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/transactions/{id}/action")
    public ResponseEntity<?> executeTransactionAction(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        User admin = requireSuperAdmin();
        Optional<Transaction> txOpt = transactionRepository.findById(id);
        if (txOpt.isEmpty()) return ResponseEntity.notFound().build();

        Transaction tx = txOpt.get();
        String action = payload.get("action");
        String notes = payload.get("notes");

        if ("APPROVE".equalsIgnoreCase(action)) {
            tx.setStatus("APPROVED");
            tx.setIsFraud(false);
        } else if ("BLOCK".equalsIgnoreCase(action)) {
            tx.setStatus("BLOCKED");
            tx.setIsFraud(true);
        } else if ("HOLD".equalsIgnoreCase(action)) {
            tx.setStatus("UNDER_REVIEW");
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid action. Supported: APPROVE, BLOCK, HOLD"));
        }

        tx.setReviewedBy(admin.getUsername());
        tx.setReviewedAt(LocalDateTime.now());
        tx.setAuditNotes(notes != null ? notes : "Updated by Super Admin: " + action);
        transactionRepository.save(tx);

        auditLogRepository.save(new AuditLog(
            admin.getUsername(),
            "TRANSACTION_" + action.toUpperCase(),
            "TRANSACTION",
            tx.getTransactionId(),
            String.format("Super Admin executed action %s on tx %s. Notes: %s", action, tx.getTransactionId(), notes)
        ));

        return ResponseEntity.ok(Map.of("message", "Transaction action executed successfully.", "transaction", tx));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        requireSuperAdmin();
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/reports/export-csv")
    public ResponseEntity<byte[]> exportCsvReport(@RequestParam(value = "type", required = false, defaultValue = "transactions") String type) {
        requireSuperAdmin();
        StringBuilder sb = new StringBuilder();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String filename;

        if ("scans".equalsIgnoreCase(type)) {
            filename = "sentinel_website_scans_" + System.currentTimeMillis() + ".csv";
            sb.append("Scan ID,Target URL,Target Domain,Category,Brand Name,Trust Score,Risk Score,Risk Level,Status,HTTPS Enabled,Phishing,Malware,Brand Impersonation,Scanned By User,Scanned At\n");
            List<WebsiteScan> scans = websiteScanRepository.findAll();
            for (WebsiteScan s : scans) {
                boolean isPhishing = (s.getCategory() != null && s.getCategory().contains("PHISHING")) || s.getMlPhishingProbability() >= 0.5;
                boolean isMalware = (s.getCategory() != null && s.getCategory().contains("MALWARE"));
                sb.append(String.format("\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    s.getId() != null ? s.getId() : 0,
                    escapeCsv(s.getUrl()),
                    escapeCsv(s.getDomain()),
                    escapeCsv(s.getCategory()),
                    escapeCsv(s.getBrandName()),
                    s.getTrustScore(),
                    s.getRiskScore(),
                    escapeCsv(s.getRiskLevel()),
                    escapeCsv(s.getStatus()),
                    s.isHasHttps() ? "YES" : "NO",
                    isPhishing ? "YES" : "NO",
                    isMalware ? "YES" : "NO",
                    s.isBrandImpersonation() ? "YES" : "NO",
                    s.getUser() != null ? escapeCsv(s.getUser().getUsername()) : "N/A",
                    s.getScannedAt() != null ? s.getScannedAt().format(fmt) : ""
                ));
            }
        } else if ("users".equalsIgnoreCase(type)) {
            filename = "sentinel_users_activity_" + System.currentTimeMillis() + ".csv";
            sb.append("User ID,Full Name,Username,Email,Account Status,Session Status,Auth Provider,Registration Date & Time,Last Login At,Last Activity At,Successful Logins,Failed Attempts,Total Scans\n");
            List<User> users = userRepository.findAll();
            for (User u : users) {
                long scansCount = websiteScanRepository.countByUserId(u.getId());
                sb.append(String.format("\"%d\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%d\n",
                    u.getId(),
                    escapeCsv(u.getFullName()),
                    escapeCsv(u.getUsername()),
                    escapeCsv(u.getEmail()),
                    escapeCsv(u.getAccountStatus() != null ? u.getAccountStatus() : (u.isActive() ? "ACTIVE" : "INACTIVE")),
                    escapeCsv(u.getSessionStatus() != null ? u.getSessionStatus() : "OFFLINE"),
                    escapeCsv(u.getAuthProvider() != null ? u.getAuthProvider() : "LOCAL"),
                    u.getCreatedAt() != null ? u.getCreatedAt().format(fmt) : "",
                    u.getLastLoginAt() != null ? u.getLastLoginAt().format(fmt) : "N/A",
                    u.getLastActivityAt() != null ? u.getLastActivityAt().format(fmt) : "N/A",
                    u.getLoginCount(),
                    u.getFailedLoginCount(),
                    scansCount
                ));
            }
        } else {
            filename = "sentinel_transactions_report_" + System.currentTimeMillis() + ".csv";
            sb.append("Transaction ID,Date & Time,User ID,Username,Amount (INR),Merchant,Category,Location,Website,Risk Score,Risk Level,Status,Fraud Probability\n");
            List<Transaction> list = transactionRepository.findAllByOrderByCreatedAtDesc();
            for (Transaction t : list) {
                sb.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\",\"%s\",\"%s\",%d,\"%s\",\"%s\",%.2f\n",
                    t.getTransactionId() != null ? t.getTransactionId() : "",
                    t.getCreatedAt() != null ? t.getCreatedAt().format(fmt) : "",
                    t.getUser() != null ? t.getUser().getId() : "",
                    t.getUser() != null ? t.getUser().getUsername() : "",
                    t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO,
                    escapeCsv(t.getMerchant()),
                    escapeCsv(t.getCategory()),
                    escapeCsv(t.getLocation()),
                    escapeCsv(t.getWebsite()),
                    t.getRiskScore() != null ? t.getRiskScore() : 0,
                    t.getRiskLevel() != null ? t.getRiskLevel() : "LOW",
                    t.getStatus() != null ? t.getStatus() : "APPROVED",
                    t.getFraudProbability() != null ? t.getFraudProbability() : 0.0
                ));
            }
        }

        byte[] csvData = sb.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok().headers(headers).body(csvData);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return val.replace("\"", "\"\"");
    }
}
