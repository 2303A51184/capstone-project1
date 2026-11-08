package com.fraud.monitoring.config;

import com.fraud.monitoring.model.AuditLog;
import com.fraud.monitoring.model.SystemConfig;
import com.fraud.monitoring.model.User;
import com.fraud.monitoring.repository.AuditLogRepository;
import com.fraud.monitoring.repository.SystemConfigRepository;
import com.fraud.monitoring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Initialize SystemConfig if empty
        if (systemConfigRepository.count() == 0) {
            SystemConfig config = new SystemConfig();
            config.setLowRiskMax(29);
            config.setMediumRiskMax(69);
            config.setHighRiskThreshold(70);
            config.setAutoBlockHighRisk(true);
            config.setEnableDomainHeuristics(true);
            config.setNotificationEmail("admin@sentinel.security");
            systemConfigRepository.save(config);
        }

        // 2. Initialize Single Authorized Super Admin ONLY
        // NO demo users, NO sample transactions, NO fake alerts!
        if (userRepository.countByRole("ROLE_ADMIN") == 0) {
            String adminPassword = System.getenv("ADMIN_PASSWORD");
            if (adminPassword == null || adminPassword.trim().isEmpty()) {
                adminPassword = "admin";
            }

            User admin = new User("admin", passwordEncoder.encode(adminPassword), "admin@sentinel.security", "Chief Security Officer", "ROLE_ADMIN");
            admin.setPhone("+91 98765 43210");
            admin.setAuthProvider("LOCAL");
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setLastLoginAt(null);
            admin.setLastActivityAt(null);
            admin.setLoginCount(0);
            userRepository.save(admin);

            auditLogRepository.save(new AuditLog("SYSTEM", "INITIALIZE_SUPER_ADMIN", "USER", admin.getId().toString(), "Provisioned single authorized Super Admin account."));
        }
    }
}
