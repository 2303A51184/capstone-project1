package com.fraud.monitoring.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "website_scans")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebsiteScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 1024)
    private String url;

    @Column(nullable = false)
    private String hostname;

    @Column(nullable = false)
    private String domain;

    private String brandName;

    private boolean isVerifiedBrand = false;

    private boolean isBrandImpersonation = false;

    private int trustScore = 0;

    private int riskScore = 0;

    @Column(nullable = false)
    private String riskLevel = "UNVERIFIED"; // LOW, MODERATE, SUSPICIOUS, HIGH, UNVERIFIED

    @Column(nullable = false)
    private String status = "UNVERIFIED"; // TRUSTED, SUSPICIOUS, HIGH_RISK, UNVERIFIED

    private String category = "UNKNOWN WEBSITE"; // TRUSTED WEBSITE, UNKNOWN WEBSITE, SUSPICIOUS WEBSITE, PHISHING WEBSITE, MALWARE WEBSITE, BRAND IMPERSONATION WEBSITE

    private String securityStatus;

    private boolean hasHttps = false;

    private boolean sslValid = false;

    private String sslIssuer;

    private double mlPhishingProbability = 0.0;

    @Column(length = 4000)
    private String detectedIssuesJson;

    @Column(length = 4000)
    private String positiveIndicatorsJson;

    @Column(length = 4000)
    private String recommendationsJson;

    private LocalDateTime scannedAt = LocalDateTime.now();

    public WebsiteScan() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }

    public boolean isVerifiedBrand() { return isVerifiedBrand; }
    public void setVerifiedBrand(boolean verifiedBrand) { isVerifiedBrand = verifiedBrand; }

    public boolean isBrandImpersonation() { return isBrandImpersonation; }
    public void setBrandImpersonation(boolean brandImpersonation) { isBrandImpersonation = brandImpersonation; }

    public int getTrustScore() { return trustScore; }
    public void setTrustScore(int trustScore) { this.trustScore = trustScore; }

    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSecurityStatus() { return securityStatus; }
    public void setSecurityStatus(String securityStatus) { this.securityStatus = securityStatus; }

    public boolean isHasHttps() { return hasHttps; }
    public void setHasHttps(boolean hasHttps) { this.hasHttps = hasHttps; }

    public boolean isSslValid() { return sslValid; }
    public void setSslValid(boolean sslValid) { this.sslValid = sslValid; }

    public String getSslIssuer() { return sslIssuer; }
    public void setSslIssuer(String sslIssuer) { this.sslIssuer = sslIssuer; }

    public double getMlPhishingProbability() { return mlPhishingProbability; }
    public void setMlPhishingProbability(double mlPhishingProbability) { this.mlPhishingProbability = mlPhishingProbability; }

    public String getDetectedIssuesJson() { return detectedIssuesJson; }
    public void setDetectedIssuesJson(String detectedIssuesJson) { this.detectedIssuesJson = detectedIssuesJson; }

    public String getPositiveIndicatorsJson() { return positiveIndicatorsJson; }
    public void setPositiveIndicatorsJson(String positiveIndicatorsJson) { this.positiveIndicatorsJson = positiveIndicatorsJson; }

    public String getRecommendationsJson() { return recommendationsJson; }
    public void setRecommendationsJson(String recommendationsJson) { this.recommendationsJson = recommendationsJson; }

    public LocalDateTime getScannedAt() { return scannedAt; }
    public void setScannedAt(LocalDateTime scannedAt) { this.scannedAt = scannedAt; }
}
