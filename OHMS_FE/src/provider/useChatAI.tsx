import { useContext } from 'react';
import { ChatAIContext, ChatAIContextValue } from './ChatAi.type';

export const useChatAI = (): ChatAIContextValue => {
  const context = useContext(ChatAIContext);
  if (!context) {
    throw new Error('useChatAI phải được dùng trong ChatAIProvider');
  }
  return context;
};