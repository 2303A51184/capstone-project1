package com.fraud.monitoring.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_alerts")
public class FraudAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String username;
    private String transactionId;
    private BigDecimal amount;
    private String merchant;
    private Integer riskScore;
    private String riskLevel; // HIGH, MEDIUM, LOW
    private String message;
    private String status = "UNREAD"; // UNREAD, READ
    private LocalDateTime createdAt = LocalDateTime.now();

    public FraudAlert() {}

    public FraudAlert(Long userId, String username, String transactionId, BigDecimal amount, String merchant, Integer riskScore, String riskLevel, String message) {
        this.userId = userId;
        this.username = username;
        this.transactionId = transactionId;
        this.amount = amount;
        this.merchant = merchant;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.message = message;
        this.status = "UNREAD";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }
    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
