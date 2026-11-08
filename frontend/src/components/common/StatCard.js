import React from 'react';

export const StatCard = ({ 
  title, 
  value, 
  subtext, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default', 
  color, 
  onClick 
}) => {
  const displaySubtext = subtitle || subtext;
  const cardVariant = color || variant;

  return (
    <div 
      className={`stat-card stat-card-${cardVariant}`} 
      onClick={onClick} 
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrap">
            <Icon size={20} className="stat-card-icon" />
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {(displaySubtext || trend) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-trend ${trend.positive ? 'trend-up' : 'trend-down'}`}>
                {trend.positive ? '↑' : '↓'} {trend.text}
              </span>
            )}
            {displaySubtext && <span className="stat-card-subtext">{displaySubtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
