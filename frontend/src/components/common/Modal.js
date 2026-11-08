import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '580px' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTailwindClass = typeof maxWidth === 'string' && maxWidth.startsWith('max-w-');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-container ${isTailwindClass ? maxWidth : ''}`}
        style={!isTailwindClass ? { maxWidth } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title font-bold text-primary">{title}</h3>
          <button className="modal-close-btn text-tertiary hover:text-primary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
