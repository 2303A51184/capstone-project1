package com.fraud.monitoring.repository;

import com.fraud.monitoring.model.WebsiteScan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebsiteScanRepository extends JpaRepository<WebsiteScan, Long> {

    List<WebsiteScan> findByUserIdOrderByScannedAtDesc(Long userId);

    long countByUserId(Long userId);

    long countByStatus(String status);

    long countByCategory(String category);

    long countByRiskLevel(String riskLevel);

    long countByIsBrandImpersonationTrue();

    @Query("SELECT COUNT(DISTINCT w.domain) FROM WebsiteScan w")
    long countDistinctDomains();

    List<WebsiteScan> findTop10ByOrderByScannedAtDesc();

    List<WebsiteScan> findTop10ByRiskLevelInOrderByScannedAtDesc(List<String> riskLevels);

    @Query("SELECT w.domain, COUNT(w) as scanCount FROM WebsiteScan w GROUP BY w.domain ORDER BY scanCount DESC")
    List<Object[]> findTopScannedDomains();
}
