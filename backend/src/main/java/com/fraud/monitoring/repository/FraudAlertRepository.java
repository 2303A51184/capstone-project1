package com.fraud.monitoring.repository;

import com.fraud.monitoring.model.FraudAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<FraudAlert> findAllByOrderByCreatedAtDesc();
    List<FraudAlert> findByRiskLevelOrderByCreatedAtDesc(String riskLevel);
    long countByUserIdAndStatus(Long userId, String status);
    long countByStatus(String status);
}
