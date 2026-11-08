package com.fraud.monitoring.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fraud.monitoring.model.User;
import com.fraud.monitoring.model.WebsiteScan;
import com.fraud.monitoring.repository.UserRepository;
import com.fraud.monitoring.repository.WebsiteScanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.InetAddress;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/scans")
@CrossOrigin(origins = "*")
public class WebsiteScanController {

    @Autowired
    private WebsiteScanRepository websiteScanRepository;

    @Autowired
    private UserRepository userRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    /**
     * Checks if a given hostname resolves to a loopback, private, or restricted address (SSRF Guard).
     */
    private boolean isRestrictedHost(String host) {
        if (host == null || host.trim().isEmpty()) return true;
        String h = host.toLowerCase().trim();
        if (h.equals("localhost") || h.equals("127.0.0.1") || h.equals("0.0.0.0") || h.equals("::1")) {
            return true;
        }
        try {
            InetAddress addr = InetAddress.getByName(h);
            return addr.isLoopbackAddress() || addr.isSiteLocalAddress() || addr.isLinkLocalAddress() || addr.isAnyLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * POST /api/scans/analyze
     * Analyzes website trust, brand reputation, SSL, and phishing threat.
     * Records scan history strictly isolated to the authenticated user.
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeWebsite(@RequestBody Map<String, String> request) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to analyze websites."));
        }

        String rawUrl = request.get("url");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Website URL is required."));
        }

        rawUrl = rawUrl.trim();
        if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
            rawUrl = "https://" + rawUrl;
        }

        try {
            URI uri = URI.create(rawUrl);
            String host = uri.getHost();
            if (host == null || host.isEmpty() || isRestrictedHost(host)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "SSRF Protection: Access to private, local, or loopback network addresses is strictly prohibited.",
                    "is_blocked", true,
                    "risk_level", "HIGH",
                    "trust_score", 0
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Malformed URL format."));
        }

        // Call Python AI & Threat Intelligence Microservice
        Map<String, Object> aiResponse;
        try {
            String aiServiceUrl = "http://localhost:5000/analyze-website";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("url", rawUrl), headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(aiServiceUrl, entity, Map.class);
            aiResponse = response.getBody();
        } catch (Exception ex) {
            System.err.println("AI Microservice call failed: " + ex.getMessage());
            // Resilient fallback if AI service temporarily unreachable
            aiResponse = createFallbackScanResult(rawUrl);
        }

        if (aiResponse == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Unable to analyze website."));
        }

        // Persist scan history for this user
        WebsiteScan scan = new WebsiteScan();
        scan.setUser(user);
        scan.setUrl((String) aiResponse.getOrDefault("url", rawUrl));
        scan.setHostname((String) aiResponse.getOrDefault("hostname", "unknown"));
        scan.setDomain((String) aiResponse.getOrDefault("domain", "unknown"));
        scan.setBrandName((String) aiResponse.getOrDefault("brand_name", "Unrecognized"));
        scan.setVerifiedBrand(Boolean.TRUE.equals(aiResponse.get("is_verified_brand")));
        scan.setBrandImpersonation(Boolean.TRUE.equals(aiResponse.get("is_brand_impersonation")));

        Number trustScoreNum = (Number) aiResponse.getOrDefault("trust_score", 50);
        scan.setTrustScore(trustScoreNum.intValue());

        Number riskScoreNum = (Number) aiResponse.getOrDefault("risk_score", 50);
        scan.setRiskScore(riskScoreNum.intValue());

        scan.setRiskLevel((String) aiResponse.getOrDefault("risk_level", "UNVERIFIED"));
        scan.setStatus((String) aiResponse.getOrDefault("status", "UNVERIFIED"));
        scan.setCategory((String) aiResponse.getOrDefault("category", "UNKNOWN WEBSITE"));
        scan.setSecurityStatus((String) aiResponse.getOrDefault("security_status", "UNKNOWN"));
        scan.setHasHttps(Boolean.TRUE.equals(aiResponse.get("has_https")));

        Map sslInfo = (Map) aiResponse.get("ssl_certificate");
        if (sslInfo != null) {
            scan.setSslValid(Boolean.TRUE.equals(sslInfo.get("ssl_valid")));
            scan.setSslIssuer((String) sslInfo.get("issuer"));
        }

        Number phishingProb = (Number) aiResponse.getOrDefault("ml_phishing_probability", 0.0);
        scan.setMlPhishingProbability(phishingProb.doubleValue());

        try {
            scan.setDetectedIssuesJson(objectMapper.writeValueAsString(aiResponse.get("detected_issues")));
            scan.setPositiveIndicatorsJson(objectMapper.writeValueAsString(aiResponse.get("positive_indicators")));
            scan.setRecommendationsJson(objectMapper.writeValueAsString(aiResponse.get("recommended_actions")));
        } catch (Exception ignored) {}

        scan.setScannedAt(LocalDateTime.now());
        WebsiteScan savedScan = websiteScanRepository.save(scan);

        Map<String, Object> finalResponse = new HashMap<>(aiResponse);
        finalResponse.put("id", savedScan.getId());
        finalResponse.put("scanned_at", savedScan.getScannedAt());

        return ResponseEntity.ok(finalResponse);
    }

    /**
     * GET /api/scans/my-scans
     * Returns scan history strictly isolated to the authenticated user.
     */
    @GetMapping("/my-scans")
    public ResponseEntity<?> getMyScans() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        List<WebsiteScan> scans = websiteScanRepository.findByUserIdOrderByScannedAtDesc(user.getId());
        return ResponseEntity.ok(scans);
    }

    /**
     * GET /api/scans/stats
     * Returns personal statistics for the authenticated user.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getMyStats() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required."));
        }

        List<WebsiteScan> userScans = websiteScanRepository.findByUserIdOrderByScannedAtDesc(user.getId());
        long totalScans = userScans.size();
        long trustedCount = userScans.stream().filter(s -> "TRUSTED".equalsIgnoreCase(s.getStatus()) || "LOW".equalsIgnoreCase(s.getRiskLevel())).count();
        long suspiciousCount = userScans.stream().filter(s -> "SUSPICIOUS".equalsIgnoreCase(s.getStatus()) || "SUSPICIOUS".equalsIgnoreCase(s.getRiskLevel()) || "MODERATE".equalsIgnoreCase(s.getRiskLevel())).count();
        long highRiskCount = userScans.stream().filter(s -> "HIGH_RISK".equalsIgnoreCase(s.getStatus()) || "HIGH".equalsIgnoreCase(s.getRiskLevel())).count();
        long unverifiedCount = userScans.stream().filter(s -> "UNVERIFIED".equalsIgnoreCase(s.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalScans", totalScans);
        stats.put("trustedScans", trustedCount);
        stats.put("suspiciousScans", suspiciousCount);
        stats.put("highRiskScans", highRiskCount);
        stats.put("unverifiedScans", unverifiedCount);

        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> createFallbackScanResult(String url) {
        Map<String, Object> res = new HashMap<>();
        res.put("url", url);
        res.put("hostname", "unknown");
        res.put("domain", "unknown");
        res.put("brand_name", "Unrecognized Brand");
        res.put("is_verified_brand", false);
        res.put("is_brand_impersonation", false);
        res.put("trust_score", 45);
        res.put("risk_score", 55);
        res.put("risk_level", "SUSPICIOUS");
        res.put("status", "UNVERIFIED");
        res.put("security_status", "AI Microservice unreachable. Basic analysis applied.");
        res.put("has_https", url.startsWith("https://"));
        res.put("detected_issues", List.of("Advanced AI heuristic engine temporarily unreachable."));
        res.put("positiveIndicators", List.of());
        res.put("recommended_actions", List.of("Check website credentials manually before transacting."));
        res.put("ml_phishing_probability", 0.55);
        return res;
    }
}
