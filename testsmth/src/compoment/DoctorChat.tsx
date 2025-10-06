import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faUserInjured, 
  faTimes,
  faSearch,
  faPhone,
  faVideo
} from '@fortawesome/free-solid-svg-icons';

import { useWebSocketService } from '../services/webSocketServices';


interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Patient {
  id: string;
  username: string;
  email: string;
  patientId: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isOnline?: boolean;
  condition?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  specialization?: string;
}

interface RoomChatResponse {
  roomChatID: string;
  user: User[];
}

interface DoctorChatProps {
  currentUser: User;
  onClose: () => void;
}

const DoctorChat = ({ currentUser, onClose }: DoctorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatRooms, setChatRooms] = useState<RoomChatResponse[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [callOptions, setCallOptions] = useState<'audio' | 'video'>('audio');
  const [callRequestOptions, setCallRequestOptions] = useState<'audio' | 'video'>('audio');
  const [CallId, setCallId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper: Find current chat room by selectedPatient
  const getCurrentRoom = useCallback(() => {
    if (!selectedPatient) return null;
    return chatRooms.find(room =>
      room.user.some(user => user.id === selectedPatient.id)
    ) || null;
  }, [selectedPatient, chatRooms]);

  // Send new message (without form submit) - Memoize đầy đủ
  const handleSendMessageNoForm = useCallback(() => {
    if (!newMessage.trim() || !selectedPatient) {
      console.warn('Cannot send: No message or patient selected');
      return;
    }

    const currentRoom = getCurrentRoom();
    if (!currentRoom) {
      console.error('No room found for the selected patient');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.username,
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
  }, [currentUser.id, currentUser.username, newMessage, selectedPatient, getCurrentRoom]);



  const webSocketUrl = 'http://localhost:8080/ws';
  
  // Memoize callbacks
  const onConnected = useCallback(() => setWsConnected(true), []);
  const onError = useCallback(() => setWsConnected(false), []);
  
  const { connect, subscribe, send, unsubscribe } = useWebSocketService(
    webSocketUrl,
    onConnected,
    onError
  );

  // Connect WebSocket on mount
  useEffect(() => {
    connect();
  }, [connect]); 

  // Subscribe to chat room topic on selectedPatient or chatRooms change
  useEffect(() => {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;

    const subscriptionCallback = (message: any) => {
      if (message.user?.id === currentUser.id) return; // Skip own messages

      const incomingMessage: Message = {
        id: Date.now().toString(),
        senderId: message.user?.id ?? 'unknown',
        senderName: message.user?.username ?? 'Unknown',
        content: message.message,
        timestamp: new Date(message.createdAt ?? Date.now()),
        isRead: false,
      };

      setMessages(prev => {
        const updatedMessages = [...prev, incomingMessage];
        return updatedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
    };

    const subscribeTimer = setTimeout(() => {
      subscribe(`/topic/room/${currentRoom.roomChatID}`, subscriptionCallback);
    }, 1000);

    return () => {
      clearTimeout(subscribeTimer);
      unsubscribe(`/topic/room/${currentRoom.roomChatID}`);
    };
  }, [selectedPatient, chatRooms, subscribe, unsubscribe, currentUser.id, getCurrentRoom]);

  // Load existing messages on selectedPatient or chatRooms change
  useEffect(() => {
    const loadExistingMessages = async () => {
      const currentRoom = getCurrentRoom();
      if (!currentRoom) {
        setMessages([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`http://localhost:8080/conversation/${currentRoom.roomChatID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data?.results) {
          const loadedMessages: Message[] = response.data.results.map((conv: any) => ({
            id: conv.id ?? Date.now().toString(),
            senderId: conv.user?.id ?? 'unknown',
            senderName: conv.user?.username ?? 'Unknown',
            content: conv.message,
            timestamp: new Date(conv.createdAt ?? new Date()),
            isRead: true
          }));

          loadedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    };

    loadExistingMessages();
  }, [selectedPatient, chatRooms, currentUser.id, getCurrentRoom]);

  // Fetch chat rooms and extract patients list
  const fetchChatRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`http://localhost:8080/chat/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.results) {
        setChatRooms(response.data.results);

        const patientsMap = new Map<string, Patient>();
        response.data.results.forEach((room: RoomChatResponse) => {
          room.user.forEach((user: User) => {
            if (user.id !== currentUser.id) {
              patientsMap.set(user.id, {
                id: user.id,
                username: user.username,
                email: user.email,
                patientId: `P${user.id.substring(0, 3).toUpperCase()}`,
                isOnline: Math.random() > 0.5,
                condition: 'General Consultation',
                lastMessage: 'Hello Doctor',
                lastMessageTime: new Date(Date.now() - Math.random() * 3600000),
                unreadCount: Math.floor(Math.random() * 3)
              });
            }
          });
        });
        setPatients(Array.from(patientsMap.values()));
      }
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error.response?.data ?? error.message ?? error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  // Scroll messages to bottom on message list change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Filtered patients by searchTerm (case insensitive)
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    return patients.filter(p =>
      p.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  // Format time helpers
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Close chat and cleanup
  const handleClose = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    onClose();
  }, [onClose]);



  

  // Memoized title
  // const webRTCtitle = useMemo(() => `Video Call with ${selectedPatient?.username ?? 'Patient'}`, [selectedPatient?.username]);
  // const catchTitle = useMemo(() => `Incoming Call from ${selectedPatient?.username ?? 'Patient'}`, [selectedPatient?.username]);

  // FIX CHÍNH: Detect incoming CallId from messages (từ patient, set state cho CatchWebRTC)
  // useEffect(() => {
  //   const lastCallMessage = [...messages].reverse().find(m => m.senderId !== currentUser.id && m.content.startsWith('CallId '));
  //   if (lastCallMessage && lastCallMessage.content !== CallId) {  // New incoming CallId
  //     const content = lastCallMessage.content.replace('CallId ', '');
  //     const callIdPart = content.split(' type ')[0];
  //     const type = content.split('type ')[1] as 'audio' | 'video' | undefined;
      
  //     if (callIdPart) {
  //       setCallId(callIdPart);
  //       console.log('📞 Incoming CallId detected:', callIdPart, type);
  //     }
      
  //     if (type) {
  //       setCallRequestOptions(type);
  //     }
  //   }
  // }, [messages, CallId, currentUser.id]);

    const createCall = () => {
    var currentRoom = getCurrentRoom();
      const variable = {
          roomId: currentRoom?.roomChatID,
          currentUser: currentUser.id,
          callType: callOptions
      }
      openCallWindow(`http://localhost:5173/video?roomId=${variable.roomId}&currentUser=${variable.currentUser}&callType=${variable.callType}`)

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
    <div className="fixed inset-0 z-50 bg-white flex">
      {/* Patients List */}
      <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">Patients</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                {wsConnected ? 'Online' : 'Offline'}
              </span>
              <button onClick={handleClose} className="text-black hover:text-gray-600">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black"
            />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length ? (
            filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                  selectedPatient?.id === patient.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserInjured} className="text-green-600" />
                    </div>
                    {patient.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                    {patient.unreadCount && patient.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {patient.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">
                          {patient.username}
                        </p>
                        <p className="text-xs text-black">
                          ID: {patient.patientId} • {patient.condition}
                        </p>
                      </div>
                      {patient.lastMessageTime && (
                        <span className="text-xs text-black">
                          {formatLastMessageTime(patient.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {patient.lastMessage && (
                      <p className="text-xs text-black truncate mt-1">
                        {patient.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">
                <FontAwesomeIcon icon={faUserInjured} className="text-4xl text-gray-300" />
              </div>
              <p className="text-sm">No patients available</p>
              <p className="text-xs">Check console for debug information</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserInjured} className="text-green-600" />
                    </div>
                    {selectedPatient.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-black">{selectedPatient.username}</h3>
                    <p className="text-sm text-black">
                      ID: {selectedPatient.patientId} • {selectedPatient.condition}
                    </p>

                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className={`p-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer`} 
                    onClick={() => {
                      setCallOptions('audio');
                      createCall();
                    }}                    // title="Audio Call"
                    // disabled={!canCreateCall}
                  >
                    <FontAwesomeIcon icon={faPhone} />
                  </button>
                    <button 
                    className={`p-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer`}
                    onClick={() => {
                      setCallOptions('video');
                      createCall();
                    }}
                    title="Video Call"
                    // disabled={!canCreateCall}
                    >
                    <FontAwesomeIcon icon={faVideo} />
                    </button>
                </div>
              </div>
            </div>

            {/* Messages List - FIX: Thêm button accept cho incoming CallId */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(message => {
                const isCurrentUser = message.senderId === currentUser.id;
                const isCallRequest = !isCurrentUser && message.content.startsWith('http');  // Incoming từ patient

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-black border'
                    }`}>
                      {isCallRequest ? (
                        <div className="bg-green-100 border-l-4 border-green-500 p-2 mb-2">
                          <span className="font-semibold text-green-700">Incoming Call Request</span>
                          <div className="text-black mt-1 text-sm">
                            <button
                              className="ml-2 p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 mt-1 disabled:opacity-50"
                              onClick={() => {
                                openCallWindow(message.content);
                              }}
                              title="Accept Call"
                            >
                              Accept {callRequestOptions} Call
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-black'}`}>
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
          <div className="flex-1 flex items-center justify-center text-black">
            <div className="text-center">
              <FontAwesomeIcon icon={faUserInjured} className="text-4xl mb-4" />
              <p>Select a patient to start chatting</p>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default DoctorChat;
