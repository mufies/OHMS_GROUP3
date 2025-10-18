import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faUserMd, 
  faSearch,
  faPhone,
  faVideo
} from '@fortawesome/free-solid-svg-icons';

import { useWebSocketService } from '../../services/webSocketServices';


interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface User {
  id: string;
  username?: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  specialization?: string;
}

interface RoomChatResponse {
  roomChatID: string;
  user: User[];
}

interface PatientChatProps {
  currentUser: User;
  onClose: () => void;
}

const PatientChat = ({ currentUser, onClose }: PatientChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatRooms, setChatRooms] = useState<RoomChatResponse[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<User[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getCurrentRoom = useCallback(() => {
    if (!selectedDoctor) return null;
    return chatRooms.find(room =>
      room.user.some(user => user.id === selectedDoctor.id)
    ) || null;
  }, [selectedDoctor, chatRooms]);

  const handleSendMessageNoForm = useCallback(() => {
    if (!newMessage.trim() || !selectedDoctor) {
      console.warn('Cannot send: No message or doctor selected');
      return;
    }

    const currentRoom = getCurrentRoom();
    if (!currentRoom) {
      console.error('No room found for the selected doctor');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    // Optimistic update
    setMessages(prev => {
      const updated = [...prev, message];
      return updated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    const conversationRequest = {
      message: newMessage.trim(),
      user: currentUser.id
    };

    try {
      const success = send(`/app/chat/${currentRoom.roomChatID}`, conversationRequest);
      if (!success) {
        console.error('Failed to send message via WebSocket');
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
      } else {
        console.log('✅ Message sent via WebSocket successfully:', conversationRequest);
      }
    } catch (error) {
      console.error('❌ Error sending message via WebSocket:', error);
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
    }

    setNewMessage('');
  }, [currentUser.id, currentUser.username, newMessage, selectedDoctor, getCurrentRoom]);


  // WebSocket setup 
  const webSocketUrl = 'http://localhost:8080/ws';
  
  // Memoize callbacks
  const onConnected = useCallback(() => {
    console.log('WebSocket Connected!');
    setWsConnected(true);
  }, []);
  
  const onError = useCallback((error: string) => {
    console.log('WebSocket Error:', error);
    setWsConnected(false);
  }, []);
  
  const { connect, subscribe, send, unsubscribe } = useWebSocketService(
    webSocketUrl,
    onConnected,
    onError
  );

  // Connect once on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Subscribe/unsubscribe on room changes
  useEffect(() => {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;

    const subscriptionCallback = (message: any) => {
      if (message.user?.id === currentUser.id) return;  // Skip own messages

      const incomingMessage: Message = {
        id: Date.now().toString(),
        senderId: message.user?.id || 'unknown',
        content: message.message,
        timestamp: new Date(message.createdAt || Date.now()),
        isRead: false,
      };

      setMessages(prev => {
        const updated = [...prev, incomingMessage];
        return updated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
    };

    const subscribeTimer = setTimeout(() => {
      subscribe(`/topic/room/${currentRoom.roomChatID}`, subscriptionCallback);
    }, 1000);

    return () => {
      clearTimeout(subscribeTimer);
      unsubscribe(`/topic/room/${currentRoom.roomChatID}`);
    };
  }, [selectedDoctor, chatRooms, subscribe, unsubscribe, currentUser.id, getCurrentRoom]);

  // Load existing messages when doctor changes
  useEffect(() => {
    const loadMessages = async () => {
      const currentRoom = getCurrentRoom();
      if (!currentRoom) {
        setMessages([]);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`http://localhost:8080/conversation/${currentRoom.roomChatID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.data && response.data.results) {
          const loadedMessages: Message[] = response.data.results.map((conv: any) => ({
            id: conv.id || Date.now().toString(),
            senderId: conv.user?.id || 'unknown',
            content: conv.message,
            timestamp: new Date(conv.createdAt || new Date()),
            isRead: true,
          }));

          setMessages(loadedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedDoctor, chatRooms, currentUser.id, getCurrentRoom]);

  // Fetch chat rooms assigned to this patient
  const fetchChatRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('❌ No token found in localStorage');
        return;
      }

      console.log('🌐 Making API call to:', `http://localhost:8080/chat/${currentUser.id}`);
      
      const response = await axios.get(`http://localhost:8080/chat/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.results) {
        setChatRooms(response.data.results);
        const doctorsMap = new Map<string, User>();

        // Process each chat room to get doctor info and last message
        for (const room of response.data.results) {
          for (const user of room.user) {
            if (user.id !== currentUser.id) {
              // Fetch last message for this room
              try {
                const conversationResponse = await axios.get(`http://localhost:8080/conversation/${room.roomChatID}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });

                let lastMessage = 'No messages yet';
                let lastMessageTime = new Date(Date.now() - Math.random() * 86400000);

                if (conversationResponse.data?.results && conversationResponse.data.results.length > 0) {
                  const messages = conversationResponse.data.results;
                  const lastMsg = messages[messages.length - 1];
                  
                  lastMessage = lastMsg.message;
                  lastMessageTime = new Date(lastMsg.createdAt);
                }

                doctorsMap.set(user.id, {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  isOnline: Math.random() > 0.5,
                  specialization: user.specialization || 'General Practitioner',
                  lastSeen: new Date(Date.now() - Math.random() * 3600000)
                });
              } catch (msgError) {
                console.warn('Error fetching messages for room:', room.roomChatID, msgError);
                doctorsMap.set(user.id, {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  isOnline: Math.random() > 0.5,
                  specialization: user.specialization || 'General Practitioner',
                  lastSeen: new Date(Date.now() - Math.random() * 3600000)
                });
              }
            }
          }
        }

        setAvailableDoctors(Array.from(doctorsMap.values()));
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching chat rooms:', error.response?.data ?? error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Format helpers
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Filtered doctors by searchTerm
  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return availableDoctors;
    
    return availableDoctors.filter(d =>
      d.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableDoctors, searchTerm]);  


  //create query when create call, import data into it
  const createCall = (type: 'audio' | 'video') => {
    var currentRoom = getCurrentRoom();
      const variable = {
          roomId: currentRoom?.roomChatID,
          currentUser: currentUser.id,
          callType: type,
          anotherUser: selectedDoctor?.id
  // Use the parameter directly instead of state
      }
      openCallWindow(`http://localhost:5173/video?roomId=${variable.roomId}&currentUser=${variable.currentUser}&callType=${variable.callType}&role=patient&anotherUser=${variable.anotherUser}`)

  }

  const openCallWindow = (url: string) =>
  {
  const windowFeatures = "width=790,height=800,resizable=yes,scrollbars=no,left=" + 
    (screen.width / 2 - 500) + ",top=" + (screen.height / 2 - 400);
  const callWindow = window.open(url, "callWindow", windowFeatures);
  if (callWindow) {
    callWindow.focus(); // Focus the new window
  }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-white flex">
      {/* Doctors List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="border-b border-gray-200">
          {/* Search */}
          <div className="bg-white sticky top-0 z-10">
            <div className="p-4 pb-2">
              <p className="text-gray-900 font-semibold text-lg">Doctors</p>
            </div>
            <div className="px-4 pb-4">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-0 flex-1 overflow-y-auto">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doctor => (
              <div
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`p-4 cursor-pointer flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                  selectedDoctor?.id === doctor.id ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {doctor.username?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR'}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{doctor.username}</h3>
                  <p className="text-xs text-gray-600 truncate">{doctor.specialization}</p>
                  <p className="text-xs text-gray-500">
                    {doctor.isOnline ? (
                      <span className="text-green-600">Online</span>
                    ) : doctor.lastSeen ? (
                      `Last seen ${formatLastSeen(doctor.lastSeen)}`
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">
                <FontAwesomeIcon icon={faUserMd} className="text-4xl text-gray-300" />
              </div>
              <p className="text-sm">No doctors available</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedDoctor ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserMd} className="text-blue-600" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      selectedDoctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-medium text-black">{selectedDoctor.username}</h3>
                    <p className="text-sm text-black">{selectedDoctor.specialization}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => createCall('audio')}
                    title="Audio Call"
                  >
                    <FontAwesomeIcon icon={faPhone} className="text-gray-600 text-sm" />
                  </button>
                  <button 
                    className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => createCall('video')}
                    title="Video Call"
                  >
                    <FontAwesomeIcon icon={faVideo} className="text-gray-600 text-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-hide">
              {messages.map(message => {
                const isCurrentUser = message.senderId === currentUser.id;
                const isCallRequest = !isCurrentUser && message.content.startsWith('http') && message.content.includes('currentUser=') && message.content.includes('callType=');
                const isCurrentUserCallRequest = isCurrentUser && message.content.startsWith('http') && message.content.includes('currentUser=') && message.content.includes('callType=');

                return (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar - Hidden but maintains spacing */}
                    <div className="flex-shrink-0 h-8"></div>

                    {/* Message Content */}
                    <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {isCallRequest ? (
                        <div 
                          className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => openCallWindow(message.content)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FontAwesomeIcon 
                                icon={message.content.includes('callType=video') ? faVideo : faPhone} 
                                className="text-blue-600 text-sm" 
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {message.content.includes('callType=video') ? 'Video call' : 'Audio call'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : isCurrentUserCallRequest ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FontAwesomeIcon 
                                icon={message.content.includes('callType=video') ? faVideo : faPhone} 
                                className="text-blue-600 text-sm" 
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {message.content.includes('callType=video') ? 'Video call' : 'Audio call'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2 rounded-2xl ${
                          isCurrentUser 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white text-black border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-500`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessageNoForm();
                    }
                  }}
                  placeholder="Type your message..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                  type="button"
                  disabled={!newMessage.trim()}
                  onClick={handleSendMessageNoForm}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <FontAwesomeIcon icon={faUserMd} className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Select a doctor to start chatting</p>
              <p className="text-gray-400 text-sm">Choose a doctor from the list to begin your conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientChat;
