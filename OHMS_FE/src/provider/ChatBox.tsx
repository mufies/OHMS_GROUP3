import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useChatAI } from './useChatAI';
import styles from './ChatBox.module.css';  // Import CSS modules

interface ChatBoxProps {
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onClose }) => {
  const { messages, sendMessage, isLoading, clearChat, error, lastRecommendation, getRecommendation } = useChatAI();
  const [showRecommendation, setShowRecommendation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);  // Ref cho auto-scroll
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll xuống message mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, showRecommendation]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    if (input && input.value.trim()) {
      const messageText = input.value;
      await sendMessage(messageText);
      
      // Tự động gọi getRecommendation để lấy gợi ý
      setTimeout(async () => {
        await getRecommendation(messageText);
        setShowRecommendation(true);
      }, 1000);
      
      input.value = '';
    }
  };

  const handleBooking = () => {
    if (lastRecommendation?.bookingUrl) {
      window.open(lastRecommendation.bookingUrl, '_blank');
    }
  };

  return (
    <div className={styles['chat-box']}>
      <div className={styles['chat-header']}>
        <div className={styles['header-left']}>
          <span className={styles.icon}>🩺</span>
          <h3>Chat với AI</h3>
        </div>
        <button type="button" onClick={onClose} className={styles['close-btn']}>✕</button>
      </div>
      <div className={styles.messages} ref={messagesContainerRef}>
        {messages.map((msg, idx) => {
          // Filter format tags từ message
          let displayText = msg.text;
          if (msg.sender === 'ai') {
            // Loại bỏ ---START---, ---END---, SPECIALTY_ENUM, etc.
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
            <div key={idx} className={`${styles.message} ${styles[msg.sender]} ${styles['fade-in']}`}>
              <div className={styles.avatar}>{msg.sender === 'user' ? '👤' : '🤖'}</div>
              <div className={styles['message-content']}>
                <div className={styles['message-bubble']}>
                  <span className={msg.sender === 'ai' ? styles['typing-effect'] : ''}>{displayText}</span>
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className={`${styles.message} ${styles.ai} ${styles['fade-in']}`}>
            <div className={styles.avatar}>🤖</div>
            <div className={styles['message-content']}>
              <div className={styles['message-bubble']}>
                <div className={styles['loading-dots']}>Đang suy nghĩ<span>.</span><span>.</span><span>.</span></div>
              </div>
            </div>
          </div>
        )}
        {error && <div className={`${styles.error} ${styles['fade-in']}`}>Lỗi: {error}</div>}
        
        {/* Recommendation Card */}
        {showRecommendation && lastRecommendation && !lastRecommendation.needMoreInfo && (
          <div className={`${styles.message} ${styles.ai} ${styles['fade-in']}`}>
            <div className={styles.avatar}>💊</div>
            <div className={styles['message-content']}>
              <div className={styles['recommendation-card']}>
                <h4>🏥 Gợi ý khám bệnh</h4>
                
                {lastRecommendation.diagnosis && (
                  <div className={styles['rec-section']}>
                    <strong>Chẩn đoán sơ bộ:</strong>
                    <p>{lastRecommendation.diagnosis}</p>
                  </div>
                )}
                
                <div className={styles['rec-section']}>
                  <strong>Chuyên khoa gợi ý:</strong>
                  <p className={styles['specialty-badge']}>
                    {lastRecommendation.specialtyNameVi}
                  </p>
                </div>
                
                {lastRecommendation.urgencyLevel && (
                  <div className={styles['rec-section']}>
                    <strong>Mức độ khẩn cấp:</strong>
                    <p>{lastRecommendation.urgencyLevel}</p>
                  </div>
                )}
                
                {lastRecommendation.suggestedExaminations && lastRecommendation.suggestedExaminations.length > 0 && (
                  <div className={styles['rec-section']}>
                    <strong>Dịch vụ khám có sẵn:</strong>
                    <ul className={styles['exam-list']}>
                      {lastRecommendation.suggestedExaminations.slice(0, 3).map((exam, idx) => (
                        <li key={idx}>
                          <span className={styles['exam-name']}>{exam.name}</span>
                          <span className={styles['exam-price']}>{exam.price.toLocaleString()} VND</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button 
                  className={styles['booking-btn']}
                  onClick={handleBooking}
                >
                  📅 Đặt lịch khám
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />  {/* Anchor cho scroll */}
      </div>
      <form onSubmit={handleSubmit} className={styles['chat-input']}>
        <input type="text" placeholder="Nhập triệu chứng hoặc câu hỏi..." disabled={isLoading} />
        <button type="submit" disabled={isLoading} className={styles['send-btn']}>
          <span className={styles.icon}>📤</span>
        </button>
      </form>
      <button type="button" onClick={clearChat} className={styles['clear-btn']}>🗑️ Xóa chat</button>
    </div>
  );
};

export default ChatBox;