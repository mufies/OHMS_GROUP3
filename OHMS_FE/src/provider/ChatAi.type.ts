import React from 'react';

// Định nghĩa types
export interface Message {
  text: string;
  sender: 'user' | 'ai';
}

// Type cho lịch sử gửi lên backend
export interface ChatTurn {
  sender: 'user' | 'ai';
  text: string;
}

// Định nghĩa type cho dịch vụ khám (MedicalExamination)
export interface MedicalExaminationDto {
  id: string;
  name: string;
  price: number;
  medicalSpecialty: string;
}

// Định nghĩa type cho gợi ý chuyên khoa
export interface SpecialtyRecommendation {
  diagnosis: string;
  recommendedSpecialty: string;
  specialtyNameVi: string;
  suggestedExaminations: MedicalExaminationDto[];
  bookingUrl: string;
  urgencyLevel: string;
  needMoreInfo: boolean;
  followUpQuestion: string;
}

export interface ChatAIState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  lastRecommendation: SpecialtyRecommendation | null;
}

export interface ChatAIContextValue extends ChatAIState {
  sendMessage: (messageText: string) => Promise<void>;
  clearChat: () => void;
  getRecommendation: (messageText: string) => Promise<SpecialtyRecommendation | null>;
}

// Tạo Context (export ở đây, không phải component file)
export const ChatAIContext = React.createContext<ChatAIContextValue | undefined>(undefined);
