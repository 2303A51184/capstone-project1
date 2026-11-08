package com.fraud.monitoring.repository;

import com.fraud.monitoring.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Transaction> findAllByOrderByCreatedAtDesc();
    List<Transaction> findTop10ByOrderByCreatedAtDesc();
    List<Transaction> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
    List<Transaction> findByIsFraudTrueOrderByCreatedAtDesc();
    List<Transaction> findByStatusOrderByCreatedAtDesc(String status);
    List<Transaction> findByRiskLevelOrderByCreatedAtDesc(String riskLevel);

    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, String status);
    long countByUserIdAndIsFraudTrue(Long userId);
    long countByUserIdAndRiskLevel(Long userId, String riskLevel);

    long countByIsFraudTrue();
    long countByStatus(String status);
    long countByRiskLevel(String riskLevel);
    long countByRiskScoreGreaterThanEqual(Integer threshold);
    long countByRiskScoreBetween(Integer min, Integer max);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId")
    BigDecimal sumAmountByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t")
    BigDecimal sumTotalAmount();

    @Query("SELECT AVG(t.riskScore) FROM Transaction t")
    Double findAverageRiskScore();

    List<Transaction> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
}
