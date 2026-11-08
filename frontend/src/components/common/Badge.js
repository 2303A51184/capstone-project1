import React from 'react';

export const StatusBadge = ({ status }) => {
  const norm = (status || '').toUpperCase();
  let badgeClass = 'badge-secondary';
  let label = status || 'UNKNOWN';

  if (norm === 'APPROVED' || norm === 'SUCCESS' || norm === 'ACTIVE') {
    badgeClass = 'badge-success';
    label = 'APPROVED';
  } else if (norm === 'UNDER_REVIEW' || norm === 'PENDING' || norm === 'REVIEW') {
    badgeClass = 'badge-warning';
    label = 'UNDER REVIEW';
  } else if (norm === 'BLOCKED' || norm === 'FLAGGED' || norm === 'INACTIVE' || norm === 'FRAUD') {
    badgeClass = 'badge-danger';
    label = 'BLOCKED';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="badge-dot"></span>
      {label}
    </span>
  );
};

export const RiskBadge = ({ level, riskLevel, score }) => {
  const effectiveLevel = (riskLevel || level || '').toUpperCase();
  let badgeClass = 'risk-low';
  let label = effectiveLevel || 'LOW';

  if (effectiveLevel === 'HIGH' || (score !== undefined && score >= 70)) {
    badgeClass = 'risk-high';
    label = 'HIGH RISK';
  } else if (effectiveLevel === 'MEDIUM' || (score !== undefined && score >= 30)) {
    badgeClass = 'risk-medium';
    label = 'MEDIUM RISK';
  } else {
    badgeClass = 'risk-low';
    label = 'LOW RISK';
  }

  return (
    <span className={`risk-badge ${badgeClass}`}>
      {label} {score !== undefined ? `(${score})` : ''}
    </span>
  );
};

export default { StatusBadge, RiskBadge };
