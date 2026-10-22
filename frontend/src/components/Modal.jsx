import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = '560px', style = {} }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, ...style }}
      >
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 800, 
              color: 'var(--text-main)', 
              fontFamily: 'var(--font-brand)',
              letterSpacing: '-0.02em',
              lineHeight: 1.25
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ 
                fontSize: '0.82rem', 
                color: 'var(--text-muted)', 
                marginTop: '4px',
                fontWeight: 500
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="modal-close"
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </header>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
