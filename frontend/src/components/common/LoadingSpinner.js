import React from 'react';

export const LoadingSpinner = ({ text = 'Loading data...', size = 'medium' }) => {
  return (
    <div className={`spinner-container spinner-${size}`}>
      <div className="fintech-spinner"></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
