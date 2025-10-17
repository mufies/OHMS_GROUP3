import React, { useState, ReactNode } from 'react';
import { ChatAIContext, ChatAIContextValue, Message } from './ChatAi.type';


// Provider Component
interface ChatAIProviderProps {
  children: ReactNode;
}

export const ChatAIProvider: React.FC<ChatAIProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (messageText: string): Promise<void> => {
    if (!messageText.trim()) return;

    setMessages(prev => [...prev, { text: messageText, sender: 'user' }]);
    setIsLoading(true);
    setError(null);

    try {
      // Gọi API backend local (/api/diagnose)
      const response = await fetch('http://localhost:8080/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText
        })
      });
      
      if (!response.ok) throw new Error(`Lỗi API: ${response.statusText}`);
      
      const data = await response.json();
      const aiReply = (data as { reply?: string }).reply || 'Không có phản hồi từ AI.';
      
      setMessages(prev => [...prev, { text: aiReply, sender: 'ai' }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = (): void => {
    setMessages([]);
    setError(null);
  };

  const value: ChatAIContextValue = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };

  return (
    <ChatAIContext.Provider value={value}>
      {children}
    </ChatAIContext.Provider>
  );
};