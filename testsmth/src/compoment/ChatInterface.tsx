import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faUserMd,
  faUser,
  faTimes,
  faSearch,
  faVideo,
  faPhone,
  faEllipsisV,
  faPaperclip,
  faSmile,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import './ChatInterface.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'doctor' | 'patient';
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType?: 'text' | 'image' | 'file';
}

interface ChatUser {
  id: string;
  username: string;
  role: 'doctor' | 'patient';
  email: string;
  isOnline?: boolean;
  lastSeen?: Date;
  specialization?: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface ChatInterfaceProps {
  currentUser: ChatUser;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [availableUsers] = useState<ChatUser[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

// Removed invalid getUserChatList function declaration

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  

  const loadMessages = (userId: string) => {
    // Mock messages - replace with API call
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: userId,
        senderName: selectedUser?.username || '',
        senderRole: selectedUser?.role || 'doctor',
        content: currentUser.role === 'patient' 
          ? 'Hello! How can I help you today?' 
          : 'Hi Doctor, I need to discuss my symptoms.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: true
      },
      {
        id: '2',
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderRole: currentUser.role,
        content: currentUser.role === 'patient' 
          ? 'I have been experiencing some discomfort lately.' 
          : 'Of course, please tell me about your symptoms.',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isRead: true
      },
      {
        id: '3',
        senderId: userId,
        senderName: selectedUser?.username || '',
        senderRole: selectedUser?.role || 'doctor',
        content: currentUser.role === 'patient' 
          ? 'Can you describe the symptoms in more detail?' 
          : 'I have been having headaches and feeling tired.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        isRead: true
      }
    ];
    setMessages(mockMessages);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderRole: currentUser.role,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate typing indicator and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        senderId: selectedUser.id,
        senderName: selectedUser.username,
        senderRole: selectedUser.role,
        content: getAutoResponse(),
        timestamp: new Date(),
        isRead: false
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const getAutoResponse = () => {
    const responses = currentUser.role === 'patient' 
      ? [
          "Thank you for sharing that information. Let me review your case.",
          "I understand. Can you tell me when this started?",
          "Based on what you've described, I recommend scheduling a follow-up.",
          "Please continue taking your medication as prescribed."
        ]
      : [
          "I'll check with the doctor and get back to you.",
          "Your appointment is scheduled for next week.",
          "Please make sure to follow the treatment plan.",
          "Feel free to ask if you have any other questions."
        ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.specialization && user.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFilteredUsers = () => {
    if (currentUser.role === 'patient') {
      return filteredUsers.filter(user => user.role === 'doctor');
    } else {
      return filteredUsers.filter(user => user.role === 'patient');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex h-screen">
      {/* Sidebar - Users List */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col chat-sidebar">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {currentUser.role === 'patient' ? 'Doctors' : 'Patients'}
            </h2>
            <button
              onClick={onClose}
              title="Logout"
              className="text-gray-400 hover:text-gray-600 transition-colors chat-action-button focus-ring"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={`Search ${currentUser.role === 'patient' ? 'doctors' : 'patients'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black search-input"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          {getFilteredUsers().map(user => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors user-list-item ${
                selectedUser?.id === user.id ? 'bg-white border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold avatar-initials ${
                    user.role === 'doctor' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span>{getInitials(user.username)}</span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    user.isOnline ? 'bg-green-500 online-status' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.username}
                      </p>
                      {user.specialization && (
                        <p className="text-xs text-blue-600 truncate">
                          {user.specialization}
                        </p>
                      )}
                    </div>
                    {(user.unreadCount || 0) > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center unread-badge">
                        {user.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {user.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {user.isOnline ? (
                      <span className="text-green-600 flex items-center">
                        <FontAwesomeIcon icon={faCircle} className="w-2 h-2 mr-1" />
                        Online
                      </span>
                    ) : user.lastSeen ? (
                      formatLastSeen(user.lastSeen)
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      selectedUser.role === 'doctor' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span>{getInitials(selectedUser.username)}</span>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedUser.username}</h3>
                    <div className="flex items-center space-x-2">
                      {selectedUser.specialization && (
                        <span className="text-sm text-blue-600">{selectedUser.specialization}</span>
                      )}
                      <span className="text-sm text-gray-500">
                        {selectedUser.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <FontAwesomeIcon icon={faVideo} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                    <FontAwesomeIcon icon={faPhone} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 chat-scrollbar">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderRole === currentUser.role ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl message-bubble ${
                    message.senderRole === currentUser.role
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border rounded-bl-sm shadow-sm'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 message-timestamp ${
                      message.senderRole === currentUser.role ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start typing-indicator">
                  <div className="bg-white text-gray-800 border rounded-2xl rounded-bl-sm shadow-sm px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full bounce-1"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full bounce-2"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full bounce-3"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors attachment-button p-2 rounded-full focus-ring"
                >
                  <FontAwesomeIcon icon={faPaperclip} />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black chat-input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors emoji-button"
                  >
                    <FontAwesomeIcon icon={faSmile} />
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center send-button focus-ring"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={currentUser.role === 'patient' ? faUserMd : faUser} className="text-2xl" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {currentUser.role === 'patient' ? 'Select a Doctor' : 'Select a Patient'}
              </h3>
              <p className="text-sm">
                Choose {currentUser.role === 'patient' ? 'a doctor' : 'a patient'} to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;