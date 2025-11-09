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

// Định nghĩa type cho time slot
export interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Định nghĩa type cho service slot
export interface ServiceSlot {
  serviceId: string;
  startTime: string;
  endTime: string;
}

// Định nghĩa type cho gợi ý chuyên khoa và booking data
export interface SpecialtyRecommendation {
  // AI recommendation fields
  diagnosis?: string;
  recommendedSpecialty?: string;
  specialtyNameVi?: string;
  specialtyEnum?: string;
  suggestedExaminations?: MedicalExaminationDto[];
  bookingUrl?: string;
  urgencyLevel?: string;
  needMoreInfo?: boolean;
  followUpQuestion?: string;
  
  // Booking readiness fields
  ready?: boolean; // TRUE khi AI đã thu thập đủ thông tin để đặt lịch
  
  // Booking type
  bookingType?: 'CONSULTATION_ONLY' | 'SERVICE_AND_CONSULTATION' | 'PREVENTIVE_SERVICE';
  
  // Doctor info (for CONSULTATION types)
  doctorId?: string;
  doctorName?: string;
  
  // Date and time
  workDate?: string; // yyyy-MM-dd
  startTime?: string; // HH:mm:ss (for CONSULTATION_ONLY and PREVENTIVE_SERVICE)
  endTime?: string;   // HH:mm:ss
  
  // Service slots (for SERVICE_AND_CONSULTATION)
  serviceSlots?: ServiceSlot[];
  consultationSlot?: TimeSlot;
  
  // Medical examinations
  medicalExaminationIds?: string[];
  
  // Pricing
  totalPrice?: number;
  discountedPrice?: number;
  depositAmount?: number;
  discount?: number; // percentage
}

export interface ChatAIState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  lastRecommendation: SpecialtyRecommendation | null;
}

export interface ChatAIContextValue extends ChatAIState {
  sendMessage: (messageText: string) => Promise<SpecialtyRecommendation | null>;
  clearChat: () => void;
  getRecommendation: (messageText: string) => Promise<SpecialtyRecommendation | null>;
}

// Tạo Context (export ở đây, không phải component file)
export const ChatAIContext = React.createContext<ChatAIContextValue | undefined>(undefined);
