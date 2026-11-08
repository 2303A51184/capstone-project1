package com.fraud.monitoring.repository;

import com.fraud.monitoring.model.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    long countByStatus(String status);
    long countByAuthMethod(String authMethod);
    long countByLoginTimeAfter(LocalDateTime time);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, String status);
    long countByLoginTimeBetween(LocalDateTime start, LocalDateTime end);
    long countByStatusAndLoginTimeBetween(String status, LocalDateTime start, LocalDateTime end);
    long countByAuthMethodAndLoginTimeBetween(String authMethod, LocalDateTime start, LocalDateTime end);
    List<LoginHistory> findByOrderByLoginTimeDesc();
    List<LoginHistory> findTop15ByOrderByLoginTimeDesc();
    List<LoginHistory> findByUserIdOrderByLoginTimeDesc(Long userId);
}
