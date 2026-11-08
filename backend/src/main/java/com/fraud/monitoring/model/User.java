package com.fraud.monitoring.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "users")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;

    private String phone;

    private String role = "ROLE_USER"; // ROLE_USER or ROLE_ADMIN

    private String authProvider = "LOCAL"; // LOCAL or GOOGLE

    private boolean active = true;

    private String accountStatus = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    private String sessionStatus = "OFFLINE"; // ONLINE, OFFLINE

    private Integer failedLoginCount = 0;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastLoginAt;

    private LocalDateTime lastLogoutAt;

    private LocalDateTime lastActivityAt;

    private Integer loginCount = 0;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<Transaction> transactions;

    public User() {}

    public User(String username, String password, String email, String fullName, String role) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.authProvider = "LOCAL";
        this.active = true;
        this.createdAt = LocalDateTime.now();
        this.loginCount = 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }
    public boolean isActive() { return active && !"INACTIVE".equalsIgnoreCase(accountStatus) && !"SUSPENDED".equalsIgnoreCase(accountStatus); }
    public void setActive(boolean active) { 
        this.active = active; 
        if (!active && "ACTIVE".equalsIgnoreCase(this.accountStatus)) {
            this.accountStatus = "INACTIVE";
        } else if (active && ("INACTIVE".equalsIgnoreCase(this.accountStatus) || "SUSPENDED".equalsIgnoreCase(this.accountStatus))) {
            this.accountStatus = "ACTIVE";
        }
    }
    public String getAccountStatus() { return accountStatus != null ? accountStatus : (active ? "ACTIVE" : "INACTIVE"); }
    public void setAccountStatus(String accountStatus) { 
        this.accountStatus = accountStatus; 
        this.active = "ACTIVE".equalsIgnoreCase(accountStatus);
    }
    public String getSessionStatus() { return sessionStatus != null ? sessionStatus : "OFFLINE"; }
    public void setSessionStatus(String sessionStatus) { this.sessionStatus = sessionStatus; }
    public Integer getFailedLoginCount() { return failedLoginCount != null ? failedLoginCount : 0; }
    public void setFailedLoginCount(Integer failedLoginCount) { this.failedLoginCount = failedLoginCount; }
    public LocalDateTime getLastLogoutAt() { return lastLogoutAt; }
    public void setLastLogoutAt(LocalDateTime lastLogoutAt) { this.lastLogoutAt = lastLogoutAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    public LocalDateTime getLastActivityAt() { return lastActivityAt; }
    public void setLastActivityAt(LocalDateTime lastActivityAt) { this.lastActivityAt = lastActivityAt; }
    public Integer getLoginCount() { return loginCount != null ? loginCount : 0; }
    public void setLoginCount(Integer loginCount) { this.loginCount = loginCount; }
    public Set<Transaction> getTransactions() { return transactions; }
    public void setTransactions(Set<Transaction> transactions) { this.transactions = transactions; }
}
