import React, { FormEvent, useState, useRef, useEffect } from 'react';
import { useChatAI } from '../provider/useChatAI';

export default function SearchDoctor() {
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [bookingLink, setBookingLink] = useState<string | null>(null); // State để lưu bookingUrl
  const { messages, sendMessage, isLoading, clearChat, error, lastRecommendation, getRecommendation } = useChatAI();
  const [showRecommendation, setShowRecommendation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showRecommendation]);

  // Lọc bookingUrl từ tin nhắn cuối cùng của AI
  useEffect(() => {
    const lastAIMessage = messages
      .filter(msg => msg.sender === 'ai')
      .slice(-1)[0]; // Lấy tin nhắn cuối cùng của AI
    if (lastAIMessage) {
      const match = lastAIMessage.text.match(/BOOKING_LINK:(.*)$/m);
      if (match && match[1]) {
        const url = match[1].trim();
        if (/^https?:\/\/[^\s$.?#].[^\s]*$/.test(url)) { // Kiểm tra URL hợp lệ
          setBookingLink(url);
        } else {
          setBookingLink(null);
        }
      } else {
        setBookingLink(null);
      }
    } else {
      setBookingLink(null);
    }
  }, [messages]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
  };

  const handleSearchButtonClick = () => {
    if (searchInput.trim()) {
      setShowChatModal(true);
      setTimeout(async () => {
        await sendMessage(searchInput);
        setTimeout(async () => {
          await getRecommendation(searchInput);
          setShowRecommendation(true);
        }, 1000);
        setSearchInput('');
      }, 100);
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
      const messageText = input.value;
      await sendMessage(messageText);
      setTimeout(async () => {
        await getRecommendation(messageText);
        setShowRecommendation(true);
      }, 1000);
      input.value = '';
    }
  };

  const handleBooking = () => {
    if (bookingLink) {
      window.open(bookingLink, '_blank');
    }
  };

  const closeModal = () => {
    setShowChatModal(false);
    setSearchInput('');
    setBookingLink(null); // Reset bookingLink khi đóng modal
  };

  return (
    <>
      <section className="relative overflow-hidden bg-[#1273db]">
        <div className="mx-auto flex w-[99vw] items-center gap-8 px-4 py-24 sm:grid-cols-2 lg:px-8 justify-center align-middle">
          <div className="text-center flex flex-col justify-items-center align-items-center">
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white">Đặt khám bác sĩ</h1>
            <p className="mb-8 text-white/90">
              Đặt khám với hơn <strong>1,000</strong> bác sĩ đã kết nối chính thức với OHMS để có số thứ tự và khung giờ khám trước
            </p>
            <div className="relative mx-auto max-w-xl min-w-[500px]">
              <input
                type="text"
                placeholder="Triệu chứng, bác sĩ"
                value={searchInput}
                onChange={handleSearchInput}
                onKeyPress={handleKeyPress}
                className="w-full rounded-full border border-white/40 bg-white/90 px-6 py-3 pr-12 text-sm text-gray-700 placeholder-gray-500 shadow focus:border-teal-500 focus:ring-teal-500"
              />
              <button
                aria-label="Tìm kiếm"
                onClick={handleSearchButtonClick}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-3.85z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🩺</span>
                <h3 className="text-lg font-bold">Chat với AI - Gợi ý khám bệnh</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={messagesContainerRef}>
              {messages.map((msg, idx) => {
                let displayText = msg.text;
                if (msg.sender === 'ai') {
                  displayText = displayText
                    .replace(/---START---/g, '')
                    .replace(/---END---/g, '')
                    .replace(/SPECIALTY_ENUM:.*$/gm, '')
                    .replace(/BOOKING_LINK:.*$/gm, '')
                    .split('\n')
                    .filter(line => line.trim().length > 0)
                    .join('\n')
                    .trim();
                }
                return (
                  <div key={idx} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-xs ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className="text-2xl">{msg.sender === 'user' ? '👤' : '🤖'}</div>
                      <div className={`p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300'}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex gap-2">
                    <div className="text-2xl">🤖</div>
                    <div className="bg-white border border-gray-300 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="text-red-500 text-sm mb-4">Lỗi: {error}</div>}

              {showRecommendation && lastRecommendation && !lastRecommendation.needMoreInfo && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 rounded-lg p-4 max-w-sm">
                    <h4 className="font-bold text-blue-900 mb-3">🏥 Gợi ý khám bệnh</h4>
                    {lastRecommendation.diagnosis && (
                      <div className="mb-3">
                        <strong className="text-sm text-blue-800">Chẩn đoán sơ bộ:</strong>
                        <p className="text-sm text-gray-700">{lastRecommendation.diagnosis}</p>
                      </div>
                    )}
                    <div className="mb-3">
                      <strong className="text-sm text-blue-800">Chuyên khoa gợi ý:</strong>
                      <div className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xs mt-1">
                        {lastRecommendation.specialtyNameVi}
                      </div>
                    </div>
                    {lastRecommendation.urgencyLevel && (
                      <div className="mb-3">
                        <strong className="text-sm text-blue-800">Mức độ khẩn cấp:</strong>
                        <p className="text-sm text-gray-700">{lastRecommendation.urgencyLevel}</p>
                      </div>
                    )}
                    {lastRecommendation.suggestedExaminations && lastRecommendation.suggestedExaminations.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-sm text-blue-800">Dịch vụ khám đề xuất:</strong>
                        <ul className="text-sm text-gray-700 mt-1 space-y-1">
                          {lastRecommendation.suggestedExaminations.slice(0, 3).map((exam, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{exam.name}</span>
                              <span className="font-semibold">{exam.price.toLocaleString()} VND</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={handleBooking}
                      disabled={!bookingLink}
                      className={`w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg mt-3 transition ${
                        !bookingLink ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">📅 Đặt lịch khám</span>
                    </button>
                  </div>
                </div>
              )}

              {showRecommendation && lastRecommendation && lastRecommendation.needMoreInfo && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-sm">
                    <h4 className="font-bold text-yellow-900 mb-3">📋 Thông tin cần thiết</h4>
                    <p className="text-sm text-gray-700">
                      {lastRecommendation.followUpQuestion || 'Vui lòng cung cấp thêm chi tiết để đưa ra chẩn đoán chính xác hơn.'}
                    </p>
                    {bookingLink && (
                      <button
                        onClick={handleBooking}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-lg mt-3 hover:from-green-600 hover:to-green-700 transition"
                      >
                        <span className="flex items-center justify-center gap-2">📅 Đặt lịch khám</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-300 p-4 bg-white">
              <form onSubmit={handleSubmitChat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập triệu chứng hoặc câu hỏi..."
                  disabled={isLoading}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  📤
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  clearChat();
                  setShowRecommendation(false);
                  setBookingLink(null); // Reset bookingLink khi xóa chat
                }}
                className="text-sm text-gray-500 hover:text-gray-700 mt-2 w-full py-1"
              >
                🗑️ Xóa chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}