import React, { FormEvent, useEffect, useRef } from 'react';
import { useChatAI } from './useChatAI';
import styles from './ChatBox.module.css';  // Import CSS modules

interface ChatBoxProps {
  onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onClose }) => {
  const { messages, sendMessage, isLoading, clearChat, error } = useChatAI();
  const messagesEndRef = useRef<HTMLDivElement>(null);  // Ref cho auto-scroll
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll xuống message mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    if (input && input.value.trim()) {
      await sendMessage(input.value);
      input.value = '';
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
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${styles[msg.sender]} ${styles['fade-in']}`}>
            <div className={styles.avatar}>{msg.sender === 'user' ? '👤' : '🤖'}</div>
            <div className={styles['message-content']}>
              <div className={styles['message-bubble']}>
                <span className={msg.sender === 'ai' ? styles['typing-effect'] : ''}>{msg.text}</span>
              </div>
            </div>
          </div>
        ))}
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