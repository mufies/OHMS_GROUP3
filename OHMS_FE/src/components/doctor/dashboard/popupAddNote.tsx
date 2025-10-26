import React, { useState } from 'react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="popup-overlay"
      onClick={onClose}
    >
      <div 
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="popup-close" onClick={onClose}>
          &times;
        </button>
        {title && <h2>{title}</h2>}
        <div className="popup-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Popup;