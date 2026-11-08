package com.fraud.monitoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_history")
public class LoginHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String username;

    private String email;

    private LocalDateTime loginTime = LocalDateTime.now();

    private String status = "SUCCESS"; // SUCCESS or FAILED

    private String authMethod = "LOCAL"; // LOCAL or GOOGLE

    private String ipAddress;

    public LoginHistory() {}

    public LoginHistory(Long userId, String username, String email, String status, String authMethod, String ipAddress) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.status = status;
        this.authMethod = authMethod;
        this.ipAddress = ipAddress;
        this.loginTime = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
