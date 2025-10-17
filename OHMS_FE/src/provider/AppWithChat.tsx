// src/AppWithChat.tsx
import React, { useState, ReactNode } from 'react';
import { ChatAIProvider } from './ChatAIContext';
import FloatingChatButton from './FloatingChatButton';
import ChatBox from './ChatBox';

import styles from './AppWithChat.module.css';

interface AppWithChatProps {
  children: ReactNode;
}

export const AppWithChat: React.FC<AppWithChatProps> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const toggleChat = (): void => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <ChatAIProvider>
      <div className={styles['app-wrapper']}>
        {children}
        
        {/* Floating button chỉ hiển thị khi chat đóng */}
        {!isChatOpen && <FloatingChatButton onToggle={toggleChat} />}
        
        {/* Chat box chỉ hiển thị khi open */}
        {isChatOpen && (
          <div className={styles['chat-overlay']} onClick={toggleChat}>
            <div className={styles['chat-container']} onClick={e => e.stopPropagation()}>
              <ChatBox onClose={toggleChat} />
            </div>
          </div>
        )}
      </div>
    </ChatAIProvider>
  );
};

export default AppWithChat;