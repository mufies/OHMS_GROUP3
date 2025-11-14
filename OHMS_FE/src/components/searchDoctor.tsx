import React, { FormEvent, useState, useRef, useEffect } from 'react';
import { useChatAI } from '../provider/useChatAI';
import { axiosInstance } from '../utils/fetchFromAPI';

interface Doctor {
  id: string;
  username: string;
  email: string;
  phone: string;
  medicleSpecially: string;
  experience: string;
  rating: number;
  patients: number;
  description: string;
  education: string;
  certifications: string;
  imageUrl?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DaySchedule {
  date: string;
  label: string;
  weekLabel: string;
  slots: TimeSlot[];
  hasApiSchedule?: boolean;
}

interface WeeklySchedule {
  workDate: string;
  startTime: string;
  endTime: string;
}

interface MedicalService {
  id: string;
  name: string;
  price: number;
  minDuration?: number;
}

export default function AiChat() {
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { messages, sendMessage, isLoading, clearChat, error, lastRecommendation } = useChatAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Booking state
  const [bookingMode, setBookingMode] = useState<'CONSULTATION_ONLY' | 'SERVICE_AND_CONSULTATION' | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [specialtyEnum, setSpecialtyEnum] = useState<string | null>(null);

  // AI Booking states
  const [aiBookingData, setAiBookingData] = useState<any>(null);
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [serviceDetails, setServiceDetails] = useState<Map<string, MedicalService>>(new Map());

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Parse specialty enum from AI response
  useEffect(() => {
    if (lastRecommendation?.specialtyEnum) {
      setSpecialtyEnum(lastRecommendation.specialtyEnum);
    }
  }, [lastRecommendation]);

  // Listen for booking readiness from AI
  useEffect(() => {
    if (lastRecommendation && lastRecommendation.ready === true) {
      setAiBookingData(lastRecommendation);
      setShowPaymentButton(true);
      
      // Fetch ALL service details (medicalExaminationIds + serviceSlots)
      const allServiceIds = new Set<string>();
      
      // Add medicalExaminationIds
      if (lastRecommendation.medicalExaminationIds && lastRecommendation.medicalExaminationIds.length > 0) {
        lastRecommendation.medicalExaminationIds.forEach((id: string) => allServiceIds.add(id));
      }
      
      // Add serviceSlots IDs (for SERVICE_AND_CONSULTATION)
      if (lastRecommendation.serviceSlots && lastRecommendation.serviceSlots.length > 0) {
        lastRecommendation.serviceSlots.forEach((slot: any) => {
          if (slot.serviceId) {
            allServiceIds.add(slot.serviceId);
          }
        });
      }
      
      // Fetch all unique service IDs
      if (allServiceIds.size > 0) {
        fetchServiceDetails(Array.from(allServiceIds));
      }
    }
  }, [lastRecommendation]);

  // Fetch service details by IDs
  const fetchServiceDetails = async (serviceIds: string[]) => {
    try {
      const serviceMap = new Map<string, MedicalService>();
      
      for (const serviceId of serviceIds) {
        try {
          const response = await axiosInstance.get(`/medical-examination/${serviceId}`);
          
          if (response.data) {
            const serviceData = response.data.results || response.data;
            
            serviceMap.set(serviceId, {
              id: serviceData.id,
              name: serviceData.name,
              price: serviceData.price,
              minDuration: serviceData.minDuration
            });
          }
        } catch (error) {
          console.error(`Error fetching service ${serviceId}:`, error);
        }
      }
      
      setServiceDetails(serviceMap);
    } catch (error) {
      console.error('Error fetching service details:', error);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchButtonClick = () => {
    if (searchInput.trim()) {
      setShowChatModal(true);
      setTimeout(async () => {
        await sendMessage(searchInput);
        setSearchInput('');
      }, 100);
    } else if (messages.length > 0) {
      console.log("click");
      setShowChatModal(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      e.preventDefault();
      handleSearchButtonClick();
    }
  };

  const handleSubmitChat = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    if (input && input.value.trim()) {
      await sendMessage(input.value);
      input.value = '';
    }
  };

  // Helper functions
  const formatPrice = (price: number): string => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const closeModal = () => {
    setSearchInput('');
    setShowChatModal(false);
  };

  const cleanAIMessage = (text: string): string => {
    return text
      .replace(/---START---/g, '')
      .replace(/---END---/g, '')
      .replace(/SPECIALTY_ENUM:.*$/gm, '')
      .replace(/BOOKING_LINK:.*$/gm, '')
      .replace(/─{20,}/g, '')
      .replace(/┌.*┐/g, '')
      .replace(/└.*┘/g, '')
      .replace(/│/g, '')
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('SPECIALTY_ENUM') && 
               !trimmed.startsWith('BOOKING_LINK') &&
               !trimmed.startsWith('📅') &&
               !trimmed.startsWith('👨‍⚕️');
      })
      .join('\n')
      .trim();
  };

  // Payment handler - FIXED
  const handleAiPayment = async () => {
    if (!aiBookingData) {
      alert('Thông tin đặt lịch chưa đầy đủ!');
      return;
    }

    try {
      // Chuẩn hóa payload theo backend format
      const bookingPayload: any = {
        doctorId: aiBookingData.doctorId || null,
        workDate: aiBookingData.workDate,
        bookingType: aiBookingData.bookingType,
        discount: aiBookingData.discount || 10,
        deposit: aiBookingData.depositAmount, // ← Backend nhận field "deposit"
        depositStatus: 'PENDING',
      };

      // SERVICE_AND_CONSULTATION: có dịch vụ phụ + khám bác sĩ
      if (aiBookingData.bookingType === 'SERVICE_AND_CONSULTATION') {
        if (!aiBookingData.serviceSlots || !aiBookingData.consultationSlot) {
          alert('Thiếu thông tin dịch vụ hoặc khám bác sĩ!');
          return;
        }
        
        bookingPayload.serviceSlots = aiBookingData.serviceSlots.map((slot: any) => ({
          serviceId: slot.serviceId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));
        
        bookingPayload.consultationSlot = {
          startTime: aiBookingData.consultationSlot.startTime,
          endTime: aiBookingData.consultationSlot.endTime,
        };
        
        // medicalExaminationIds: PHẢI có service "Đặt khám" + các service phụ
        bookingPayload.medicalExaminationIds = aiBookingData.medicalExaminationIds || [];
      } 
      // CONSULTATION_ONLY: chỉ khám bác sĩ
      else if (aiBookingData.bookingType === 'CONSULTATION_ONLY') {
        if (!aiBookingData.startTime || !aiBookingData.endTime) {
          alert('Thiếu thông tin thời gian khám!');
          return;
        }
        
        bookingPayload.startTime = aiBookingData.startTime;
        bookingPayload.endTime = aiBookingData.endTime;
        
        // medicalExaminationIds: CHỈ có service "Đặt khám"
        bookingPayload.medicalExaminationIds = aiBookingData.medicalExaminationIds || [];
      } 
      // PREVENTIVE_SERVICE: dịch vụ dự phòng, không cần bác sĩ
      else if (aiBookingData.bookingType === 'PREVENTIVE_SERVICE') {
        if (!aiBookingData.startTime || !aiBookingData.endTime) {
          alert('Thiếu thông tin thời gian dịch vụ!');
          return;
        }
        
        bookingPayload.startTime = aiBookingData.startTime;
        bookingPayload.endTime = aiBookingData.endTime;
        bookingPayload.doctorId = null; // Không cần bác sĩ
        
        // medicalExaminationIds: Service dự phòng
        bookingPayload.medicalExaminationIds = aiBookingData.medicalExaminationIds || [];
      } else {
        alert('Loại đặt lịch không hợp lệ!');
        return;
      }

      // Lưu vào sessionStorage
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
      console.log('📋 Booking payload:', bookingPayload);

      // Generate unique order description (max 25 characters)
      const orderDesc = `DH${Date.now().toString().slice(-10)}`;

      // Gọi API thanh toán PayOS
      const response = await axiosInstance.post('/api/v1/payos/create', {
        productName: 'Dat lich kham benh',
        description: orderDesc,
        price: bookingPayload.deposit,
        returnUrl: `${window.location.origin}/payment-callback`,
        cancelUrl: `${window.location.origin}/payment-cancel`
      });

      if (response.data?.results?.checkoutUrl) {
        window.location.href = response.data.results.checkoutUrl;
      } else {
        alert('Không thể tạo link thanh toán. Vui lòng thử lại!');
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      alert('Lỗi khi khởi tạo thanh toán. Vui lòng thử lại!');
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="mx-auto flex w-full max-w-5xl items-center px-6 py-28">
          <div className="text-center w-full">
            <h1 className="mb-4 text-5xl font-bold leading-tight text-white tracking-tight">
              Đặt khám bác sĩ
            </h1>
            <p className="mb-10 text-lg text-white/90 max-w-2xl mx-auto">
              Bạn có thể đặt khám với <strong className="font-bold">AI</strong> ở đây
            </p>
            <div className="relative mx-auto max-w-2xl">
              <input
                type="text"
                placeholder="Tìm kiếm theo triệu chứng hoặc tên bác sĩ..."
                value={searchInput}
                onChange={handleSearchInput}
                onKeyPress={handleKeyPress}
                onFocus={() => messages.length > 0 && setShowChatModal(true)}
                className="w-full rounded-2xl border-2 border-white/30 bg-white/95 px-6 py-4 pr-14 text-base text-gray-800 placeholder-gray-500 shadow-lg focus:border-white focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
              <button
                aria-label="Tìm kiếm"
                onClick={handleSearchButtonClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-medium transition-colors"
              >
                Tìm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Trợ lý Y tế AI</h3>
                <p className="text-sm text-white/80 mt-1">Gợi ý khám bệnh thông minh</p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-lg w-10 h-10 flex items-center justify-center transition text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-5" ref={messagesContainerRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
                    {msg.sender === 'user' ? 'Bạn' : 'Trợ lý AI'}
                  </span>
                  <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.sender === 'ai' ? cleanAIMessage(msg.text) : msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">AI</span>
                  <div className="bg-white border border-gray-200 px-5 py-4 rounded-2xl shadow-sm">
                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-3 rounded-xl text-sm font-medium">
                  Lỗi: {error}
                </div>
              )}

              {/* Payment Button - Shows when AI confirms booking ready */}
              {showPaymentButton && aiBookingData && (
                <div className="flex flex-col items-center mt-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-2xl p-6 max-w-lg w-full shadow-lg">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        Thông tin đặt lịch đã sẵn sàng
                      </h3>
                      <p className="text-sm text-green-700">
                        Xác nhận và thanh toán để hoàn tất đặt lịch
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 mb-4 space-y-3 text-sm">
                      <div className="pb-2 border-b border-gray-200">
                        <div className="text-gray-600 text-xs mb-1">Loại đặt lịch</div>
                        <div className="font-semibold text-gray-900">
                          {aiBookingData.bookingType === 'CONSULTATION_ONLY' && 'Khám bác sĩ'}
                          {aiBookingData.bookingType === 'SERVICE_AND_CONSULTATION' && 'Khám bác sĩ + Dịch vụ'}
                          {aiBookingData.bookingType === 'PREVENTIVE_SERVICE' && 'Dịch vụ dự phòng'}
                        </div>
                      </div>

                      {aiBookingData.doctorId && aiBookingData.bookingType !== 'PREVENTIVE_SERVICE' && (
                        <div>
                          <div className="text-gray-600 text-xs mb-1">Bác sĩ</div>
                          <div className="font-semibold text-gray-900">
                            {aiBookingData.doctorName || 'Đang cập nhật'}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-gray-600 text-xs mb-1">Ngày {aiBookingData.bookingType === 'PREVENTIVE_SERVICE' ? 'thực hiện' : 'khám'}</div>
                        <div className="font-semibold text-gray-900">
                          {new Date(aiBookingData.workDate).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-gray-600 text-xs mb-2">LỊCH TRÌNH</div>
                        <div className="space-y-2">
                          {/* SERVICE_AND_CONSULTATION: Hiển thị dịch vụ phụ + khám */}
                          {aiBookingData.bookingType === 'SERVICE_AND_CONSULTATION' && (
                            <>
                              {aiBookingData.serviceSlots?.map((slot: any, idx: number) => {
                                const service = serviceDetails.get(slot.serviceId);
                                const serviceName = service?.name || `Dịch vụ ${idx + 1}`;
                                
                                return (
                                  <div key={idx} className="flex items-start gap-2 text-sm bg-blue-50 rounded-lg p-2">
                                    <div className="text-blue-700 font-bold min-w-[100px] flex-shrink-0">
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}:
                                    </div>
                                    <div className="text-gray-800 font-medium">
                                      {serviceName}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {aiBookingData.consultationSlot && (
                                <div className="flex items-start gap-2 text-sm bg-green-50 rounded-lg p-2">
                                  <div className="text-green-700 font-bold min-w-[100px] flex-shrink-0">
                                    {formatTime(aiBookingData.consultationSlot.startTime)} - {formatTime(aiBookingData.consultationSlot.endTime)}:
                                  </div>
                                  <div className="text-gray-800 font-semibold">
                                    {(() => {
                                      const consultationServiceId = aiBookingData.medicalExaminationIds?.[0];
                                      const consultationService = serviceDetails.get(consultationServiceId);
                                      return consultationService?.name || 'Khám bác sĩ';
                                    })()}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* CONSULTATION_ONLY hoặc PREVENTIVE_SERVICE: Hiển thị 1 slot */}
                          {(aiBookingData.bookingType === 'CONSULTATION_ONLY' || 
                            aiBookingData.bookingType === 'PREVENTIVE_SERVICE') && 
                            aiBookingData.startTime && (
                            <div className="flex items-start gap-2 text-sm bg-blue-50 rounded-lg p-2">
                              <div className="text-blue-700 font-bold min-w-[100px] flex-shrink-0">
                                {formatTime(aiBookingData.startTime)} - {formatTime(aiBookingData.endTime)}:
                              </div>
                              <div className="text-gray-800 font-semibold">
                                {(() => {
                                  const serviceId = aiBookingData.medicalExaminationIds?.[0];
                                  const service = serviceDetails.get(serviceId);
                                  
                                  if (service?.name) {
                                    return service.name;
                                  }
                                  
                                  return aiBookingData.bookingType === 'PREVENTIVE_SERVICE' 
                                    ? 'Thực hiện dịch vụ' 
                                    : 'Khám bác sĩ';
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div className="text-gray-600 text-xs mb-2">CHI PHÍ</div>
                        
                        {aiBookingData.totalPrice && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Tổng tiền:</span>
                            <span className="font-medium">{formatPrice(aiBookingData.totalPrice)}</span>
                          </div>
                        )}
                        
                        {aiBookingData.totalPrice && aiBookingData.discountedPrice && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">Giảm giá online ({aiBookingData.discount || 10}%):</span>
                            <span className="text-green-600 font-medium">
                              -{formatPrice(aiBookingData.totalPrice - aiBookingData.discountedPrice)}
                            </span>
                          </div>
                        )}
                        
                        {aiBookingData.discountedPrice && (
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-700 font-semibold">Sau giảm giá:</span>
                            <span className="font-bold">{formatPrice(aiBookingData.discountedPrice)}</span>
                          </div>
                        )}
                        
                        {aiBookingData.depositAmount && (
                          <>
                            <div className="flex justify-between text-sm bg-orange-50 -mx-2 px-2 py-2 rounded">
                              <span className="text-orange-700 font-semibold">Tiền đặt cọc (50%):</span>
                              <span className="text-orange-600 font-bold">
                                {formatPrice(aiBookingData.depositAmount)}
                              </span>
                            </div>
                            
                            <div className="text-xs text-gray-500 pt-1">
                              Số tiền còn lại thanh toán tại bệnh viện: {formatPrice(aiBookingData.depositAmount)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleAiPayment}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>ĐẶT LỊCH KHÁM - Thanh toán {formatPrice(aiBookingData.depositAmount || 0)}</span>
                      </div>
                    </button>

                    <p className="text-xs text-gray-600 text-center mt-3 leading-relaxed">
                      Vui lòng nhấn nút ĐẶT LỊCH KHÁM để thanh toán đặt cọc và hoàn tất quá trình đặt lịch.
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-5 bg-white">
              <form onSubmit={handleSubmitChat} className="flex gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Nhập triệu chứng hoặc câu hỏi..."
                  disabled={isLoading}
                  className="flex-1 border-2 border-gray-300 rounded-xl px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-[15px]"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Gửi
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  clearChat();
                  setShowPaymentButton(false);
                  setAiBookingData(null);
                }}
                className="text-sm text-gray-500 hover:text-red-600 font-medium w-full py-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                Xóa lịch sử chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
