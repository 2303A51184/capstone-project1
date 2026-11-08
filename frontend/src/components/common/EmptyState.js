import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'There are no items to display matching your criteria.', 
  actionText, 
  actionLabel, 
  onAction 
}) => {
  const label = actionLabel || actionText;
  return (
    <div className="empty-state-box text-center p-8 flex flex-col items-center justify-center">
      <div className="empty-state-icon-wrap p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-tertiary">
        <Icon size={36} className="empty-state-icon" />
      </div>
      <h4 className="empty-state-title font-bold text-primary text-base">{title}</h4>
      <p className="empty-state-desc text-secondary text-xs mt-1 max-w-sm">{description}</p>
      {label && onAction && (
        <button className="btn btn-primary text-xs mt-4" onClick={onAction}>
          {label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
