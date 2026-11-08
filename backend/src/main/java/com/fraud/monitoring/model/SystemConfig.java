package com.fraud.monitoring.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_configs")
public class SystemConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer lowRiskMax = 29;
    private Integer mediumRiskMax = 69;
    private Integer highRiskThreshold = 70;
    private Boolean autoBlockHighRisk = true;
    private Boolean enableDomainHeuristics = true;
    private Boolean alertOnMediumRisk = true;
    private String notificationEmail = "security-admin@fraudmonitoring.com";

    public SystemConfig() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getLowRiskMax() { return lowRiskMax; }
    public void setLowRiskMax(Integer lowRiskMax) { this.lowRiskMax = lowRiskMax; }
    public Integer getMediumRiskMax() { return mediumRiskMax; }
    public void setMediumRiskMax(Integer mediumRiskMax) { this.mediumRiskMax = mediumRiskMax; }
    public Integer getHighRiskThreshold() { return highRiskThreshold; }
    public void setHighRiskThreshold(Integer highRiskThreshold) { this.highRiskThreshold = highRiskThreshold; }
    public Boolean getAutoBlockHighRisk() { return autoBlockHighRisk; }
    public void setAutoBlockHighRisk(Boolean autoBlockHighRisk) { this.autoBlockHighRisk = autoBlockHighRisk; }
    public Boolean getEnableDomainHeuristics() { return enableDomainHeuristics; }
    public void setEnableDomainHeuristics(Boolean enableDomainHeuristics) { this.enableDomainHeuristics = enableDomainHeuristics; }
    public Boolean getAlertOnMediumRisk() { return alertOnMediumRisk; }
    public void setAlertOnMediumRisk(Boolean alertOnMediumRisk) { this.alertOnMediumRisk = alertOnMediumRisk; }
    public String getNotificationEmail() { return notificationEmail; }
    public void setNotificationEmail(String notificationEmail) { this.notificationEmail = notificationEmail; }
}
