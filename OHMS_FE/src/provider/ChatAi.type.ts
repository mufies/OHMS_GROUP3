import React from 'react';

// Định nghĩa types
export interface Message {
  text: string;
  sender: 'user' | 'ai';
}

export interface ChatAIState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatAIContextValue extends ChatAIState {
  sendMessage: (messageText: string) => Promise<void>;
  clearChat: () => void;
}

// Tạo Context (export ở đây, không phải component file)
export const ChatAIContext = React.createContext<ChatAIContextValue | undefined>(undefined);