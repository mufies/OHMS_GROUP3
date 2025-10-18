// src/AppWithChat.tsx
import React, { ReactNode } from 'react';
import { ChatAIProvider } from './ChatAIContext';

interface AppWithChatProps {
  children: ReactNode;
}

export const AppWithChat: React.FC<AppWithChatProps> = ({ children }) => {
  return (
    <ChatAIProvider>
      <div>
        {children}
      </div>
    </ChatAIProvider>
  );
};

export default AppWithChat;