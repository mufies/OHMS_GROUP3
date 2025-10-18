// src/FloatingChatButton.tsx
import React from 'react';
import styles from './AppWithChat.module.css'; // Import CSS module từ AppWithChat (điều chỉnh path nếu cần)

interface FloatingChatButtonProps {
  onToggle: () => void;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onToggle }) => (
  <button type="button" className={styles['floating-btn']} onClick={onToggle}>
    💬
  </button>
);

export default FloatingChatButton;