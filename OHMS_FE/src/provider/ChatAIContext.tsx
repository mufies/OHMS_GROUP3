import React, { useState, ReactNode, useEffect } from 'react';
import { ChatAIContext, ChatAIContextValue, Message, SpecialtyRecommendation, ChatTurn } from './ChatAi.type';

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
      const token = localStorage.getItem('token');
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
      const token = getJWTToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8080/appointments/patient/${patientIdValue}`, {
        method: 'GET',
        headers: headers
      });
      if (!response.ok) {
        console.error('Error fetching appointments:', response.statusText);
        return;
      }
      const data: PatientAppointment[] = await response.json();
      setPatientAppointments(data);
      console.log('Patient appointments loaded:', data);
      
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
    }
  };

  const buildPatientInfo = (): Record<string, string> => {
    const patientInfo: Record<string, string> = {};
    
    if (patientAppointments.length > 0) {
      const latestAppointment = patientAppointments[0];
      patientInfo['name'] = latestAppointment.patientName || 'N/A';
      patientInfo['email'] = latestAppointment.patientEmail || 'N/A';
      
      // Extract medical examinations from appointments
      const allMedicalExams: string[] = [];
      patientAppointments.forEach(apt => {
        if (apt.medicalExaminations && apt.medicalExaminations.length > 0) {
          apt.medicalExaminations.forEach(exam => {
            if (!allMedicalExams.includes(exam.name)) {
              allMedicalExams.push(exam.name);
            }
          });
        }
      });
      
      if (allMedicalExams.length > 0) {
        patientInfo['previousExaminations'] = allMedicalExams.join(', ');
      }
      
      // Add appointment history context
      const appointmentSummary = patientAppointments
        .slice(0, 3)
        .map(apt => `${apt.workDate} ${apt.startTime}: Khám với ${apt.doctorName}`)
        .join('; ');
      patientInfo['appointmentHistory'] = appointmentSummary;
    }
    
    return patientInfo;
  };

  const sendMessage = async (messageText: string): Promise<void> => {
    if (!messageText.trim()) return;

    // Push message user vào UI trước
    setMessages(prev => [...prev, { text: messageText, sender: 'user' }]);
    setIsLoading(true);
    setError(null);

    try {
      // Lấy 10 lượt hội thoại gần nhất (bao gồm cả message vừa push)
      const currentHistory: ChatTurn[] = [
        ...messages.slice(-9).map(m => ({ sender: m.sender, text: m.text })),
        { sender: 'user', text: messageText }
      ];

      // Build patient info from appointments
      const patientInfo = buildPatientInfo();

      // Get JWT token for Authorization header
      const token = getJWTToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Gọi API backend local (/api/diagnose) với history và patientInfo
      const response = await fetch('http://localhost:8080/api/diagnose', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: messageText,
          patientInfo: patientInfo,
          history: currentHistory
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

  /**
   * Gọi endpoint /recommend để lấy gợi ý chuyên khoa + dịch vụ khám
   */
  const getRecommendation = async (messageText: string): Promise<SpecialtyRecommendation | null> => {
    if (!messageText.trim()) return null;

    setIsLoading(true);
    setError(null);

    try {
      // Lấy 10 lượt hội thoại gần nhất (bao gồm message hiện tại)
      const currentHistory: ChatTurn[] = [
        ...messages.slice(-9).map(m => ({ sender: m.sender, text: m.text })),
        { sender: 'user', text: messageText }
      ];

      // Build patient info from appointments
      const patientInfo = buildPatientInfo();

      // Get JWT token for Authorization header
      const token = getJWTToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8080/api/diagnose/recommend', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: messageText,
          patientInfo: patientInfo,
          history: currentHistory
        })
      });
      
      if (!response.ok) throw new Error(`Lỗi API: ${response.statusText}`);
      
      const recommendation: SpecialtyRecommendation = await response.json();
      console.log('Recommendation received:', recommendation);
      console.log('Booking URL:', recommendation.bookingUrl);
      setLastRecommendation(recommendation);
      return recommendation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      return null;
    } finally {
      setIsLoading(false);
    }
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
