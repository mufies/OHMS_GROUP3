import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useChatAI } from './useChatAI';
import styles from './ChatBox.module.css';


interface ChatBoxProps {
  onClose: () => void;
}


const ChatBox: React.FC<ChatBoxProps> = ({ onClose }) => {
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


  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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
    if (lastRecommendation?.bookingUrl) {
      window.open(lastRecommendation.bookingUrl, '_blank');
    }
  };


  return (
    <div className={styles['chat-box']}>
      {/* Header */}
      <div className={styles['chat-header']}>
        <div className={styles['header-content']}>
          <h3>Trợ lý Y tế AI</h3>
          <span className={styles['status-badge']}>Trực tuyến</span>
        </div>
        <button type="button" onClick={onClose} className={styles['close-btn']}>×</button>
      </div>

      {/* Messages Area */}
      <div className={styles.messages} ref={messagesContainerRef}>
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
            <div key={idx} className={`${styles.message} ${styles[msg.sender]}`}>
              <div className={styles['message-label']}>
                {msg.sender === 'user' ? 'Bạn' : 'AI'}
              </div>
              <div className={styles['message-bubble']}>
                {displayText}
              </div>
            </div>
          );
        })}

        {/* Loading State */}
        {isLoading && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles['message-label']}>AI</div>
            <div className={styles['message-bubble']}>
              <div className={styles['loading-dots']}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            Lỗi: {error}
          </div>
        )}
        
        {/* Recommendation Card */}
        {showRecommendation && lastRecommendation && !lastRecommendation.needMoreInfo && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles['message-label']}>Gợi ý</div>
            <div className={styles['recommendation-card']}>
              <h4>Gợi ý khám bệnh</h4>
              
              {lastRecommendation.diagnosis && (
                <div className={styles['rec-section']}>
                  <strong>Chẩn đoán sơ bộ</strong>
                  <p>{lastRecommendation.diagnosis}</p>
                </div>
              )}
              
              <div className={styles['rec-section']}>
                <strong>Chuyên khoa gợi ý</strong>
                <span className={styles['specialty-badge']}>
                  {lastRecommendation.specialtyNameVi}
                </span>
              </div>
              
              {lastRecommendation.urgencyLevel && (
                <div className={styles['rec-section']}>
                  <strong>Mức độ khẩn cấp</strong>
                  <p>{lastRecommendation.urgencyLevel}</p>
                </div>
              )}
              
              {lastRecommendation.suggestedExaminations && lastRecommendation.suggestedExaminations.length > 0 && (
                <div className={styles['rec-section']}>
                  <strong>Dịch vụ khám có sẵn</strong>
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
                Đặt lịch khám
              </button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={styles['chat-input']}>
        <input 
          type="text" 
          placeholder="Nhập triệu chứng hoặc câu hỏi..." 
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className={styles['send-btn']}>
          Gửi
        </button>
      </form>

      {/* Clear Chat Button */}
      <button type="button" onClick={clearChat} className={styles['clear-btn']}>
        Xóa lịch sử
      </button>
    </div>
  );
};


export default ChatBox;
