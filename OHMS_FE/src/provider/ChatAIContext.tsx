import React, { useState, ReactNode, useEffect } from 'react';
import { ChatAIContext, ChatAIContextValue, Message, SpecialtyRecommendation, ChatTurn } from './ChatAi.type';
import { axiosInstance } from '../utils/fetchFromAPI';

// Provider Component
interface ChatAIProviderProps {
  children: ReactNode;
}

interface PatientAppointment {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  workDate: string;
  startTime: string;
  endTime: string;
  medicalExaminations: Array<{ id: string; name: string; price: number }>;
}

export const ChatAIProvider: React.FC<ChatAIProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecommendation, setLastRecommendation] = useState<SpecialtyRecommendation | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointment[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);

  // Extract userId from JWT token
  const extractUserIdFromJWT = (): string | null => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || payload.sub || null;
    } catch (err) {
      console.error('Error extracting userId from JWT:', err);
      return null;
    }
  };

  // Get JWT token from localStorage
  const getJWTToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  // Fetch patient appointments on mount
  useEffect(() => {
    const userId = extractUserIdFromJWT();
    if (userId) {
      setPatientId(userId);
      fetchPatientAppointments(userId);
    }
  }, []);

  // Fetch patient appointments and medical examinations
  const fetchPatientAppointments = async (patientIdValue: string): Promise<void> => {
    try {
      const response = await axiosInstance.get(`/appointments/patient/${patientIdValue}`);
      if (response.data) {
        const data: PatientAppointment[] = Array.isArray(response.data) ? response.data : response.data.results || [];
        setPatientAppointments(data);
        console.log('Patient appointments loaded:', data);
      }
      
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
    }
  };

  const buildPatientInfo = (): Record<string, string> => {
    const patientInfo: Record<string, string> = {};
    
    // Chỉ lấy thông tin cơ bản, backend sẽ tự query lịch sử nếu cần
    if (patientAppointments.length > 0) {
      const latestAppointment = patientAppointments[0];
      patientInfo['name'] = latestAppointment.patientName || '';
      patientInfo['email'] = latestAppointment.patientEmail || '';
    }
    
    return patientInfo;
  };

  const sendMessage = async (messageText: string): Promise<SpecialtyRecommendation | null> => {
    if (!messageText.trim()) return null;

    // Push message user vào UI trước
    setMessages(prev => [...prev, { text: messageText, sender: 'user' }]);
    setIsLoading(true);
    setError(null);

    try {
      // Chỉ lấy 5 message gần nhất và lọc bỏ message không cần thiết
      const recentMessages = messages.slice(-5);
      const filteredHistory: ChatTurn[] = recentMessages
        .filter(m => {
          const text = m.text.toLowerCase().trim();
          // Bỏ qua các message chào hỏi đơn giản
          const skipPhrases = ['xin chào', 'hello', 'hi', 'cảm ơn', 'thank', 'ok', 'được', 'vâng'];
          return !skipPhrases.some(phrase => text === phrase || text.startsWith(phrase + ' ') || text.endsWith(' ' + phrase));
        })
        .map(m => ({ sender: m.sender, text: m.text }));
      
      // Thêm message hiện tại
      const currentHistory: ChatTurn[] = [
        ...filteredHistory,
        { sender: 'user', text: messageText }
      ];

      const patientInfo = buildPatientInfo();

      const token = getJWTToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Chỉ gửi dữ liệu cần thiết, backend sẽ tự query thông tin chi tiết
      const requestBody: Record<string, unknown> = {
        message: messageText,
        history: currentHistory
      };
      
      // Chỉ gửi patientId nếu có, backend sẽ tự lấy thông tin
      if (patientId) {
        requestBody.patientId = patientId;
      }
      
      // Chỉ gửi patientInfo nếu có thông tin cơ bản
      if (patientInfo.name || patientInfo.email) {
        requestBody.patientInfo = patientInfo;
      }

      // Gọi endpoint /recommend để có đầy đủ thông tin
      const response = await axiosInstance.post('/api/diagnose/recommend', requestBody);
      
      if (!response.data) throw new Error('Lỗi API: Không nhận được phản hồi');
      
      const recommendation: SpecialtyRecommendation = response.data;
      console.log('Recommendation received:', recommendation);
      
      // Lấy AI reply từ recommendation
      let aiReply = '';
      if (recommendation.needMoreInfo) {
        aiReply = recommendation.followUpQuestion || 'Vui lòng cung cấp thêm thông tin.';
      } else if (recommendation.ready) {
        aiReply = recommendation.diagnosis || 'Thông tin đặt lịch đã đầy đủ. Vui lòng xác nhận để thanh toán.';
      } else {
        aiReply = recommendation.diagnosis || 'Không có phản hồi từ AI.';
      }
      
      // Thêm AI message vào
      setMessages(prev => [...prev, { text: aiReply, sender: 'ai' }]);
      
      // Set recommendation để hiển thị card hoặc payment button
      setLastRecommendation(recommendation);
      
      return recommendation;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Giữ getRecommendation để tương thích với code cũ
  const getRecommendation = async (_messageText: string): Promise<SpecialtyRecommendation | null> => {
    // Return recommendation đã có từ sendMessage
    return lastRecommendation;
  };

  const clearChat = (): void => {
    setMessages([]);
    setError(null);
    setLastRecommendation(null);
  };

  const value: ChatAIContextValue = {
    messages,
    isLoading,
    error,
    lastRecommendation,
    sendMessage,
    clearChat,
    getRecommendation
  };

  return (
    <ChatAIContext.Provider value={value}>
      {children}
    </ChatAIContext.Provider>
  );
};
