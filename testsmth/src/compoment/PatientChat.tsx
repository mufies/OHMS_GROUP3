import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faUserMd, 
  faTimes,
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

interface User { // Doctor
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: Date;
  specialization?: string;
  patientId?: string;
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
  const [chatRooms, setChatRooms] = useState<RoomChatResponse[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<User[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [callOptions, setCallOptions] = useState<'audio' | 'video'>('audio');
  const [callRequestOptions, setCallRequestOptions] = useState<'audio' | 'video'>('audio');  // Type cho incoming

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
        senderName: message.user?.username || 'Unknown',
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
        const token = localStorage.getItem('token');
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
            senderName: conv.user?.username || 'Unknown',
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
      const token = localStorage.getItem('token');
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

        response.data.results.forEach((room: RoomChatResponse) => {
          room.user.forEach((user: User) => {
            if (user.id !== currentUser.id) {
              doctorsMap.set(user.id, {
                id: user.id,
                username: user.username,
                email: user.email,
                isOnline: Math.random() > 0.5,
                specialization: '',
                lastSeen: new Date(Date.now() - Math.random() * 3600000)  // Mock lastSeen
              });
            }
          });
        });

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

  // Close handler
  const handleClose = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    onClose();
  }, [onClose]);



 

  // Memoized titles


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

  const filteredDoctors = useMemo(() => availableDoctors, [availableDoctors]);  


  //create query when create call, import data into it
  const createCall = (type: 'audio' | 'video') => {
    var currentRoom = getCurrentRoom();
      const variable = {
          roomId: currentRoom?.roomChatID,
          currentUser: currentUser.id,
          callType: type  // Use the parameter directly instead of state
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
      <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">Available Doctors</h2>
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
        
        <div className="flex-1 overflow-y-auto">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doctor => (
              <div
                key={doctor.id}
                onClick={() => setSelectedDoctor(doctor)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition-colors ${
                  selectedDoctor?.id === doctor.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserMd} className="text-blue-600" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">
                      {doctor.username}
                    </p>
                    <p className="text-xs text-black truncate">
                      {doctor.specialization}
                    </p>
                    <p className="text-xs text-black">
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
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-2">
                <FontAwesomeIcon icon={faUserMd} className="text-4xl text-gray-300" />
              </div>
              <p className="text-sm">No doctors available</p>
              <p className="text-xs">Check console for debug information</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedDoctor ? (
          <>
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
                
                <div className="flex items-center space-x-2">
                  <button 
                    className={`p-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer`} 
                    onClick={() => {
                      createCall('audio');
                    }}                    // title="Audio Call"
                    // disabled={!canCreateCall}
                  >
                    <FontAwesomeIcon icon={faPhone} />
                  </button>
                    <button 
                    className={`p-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer`}
                    onClick={() => {
                      createCall('video');
                    }}
                    title="Video Call"
                    // disabled={!canCreateCall}
                    >
                    <FontAwesomeIcon icon={faVideo} />
                    </button>
                  {/* <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {wsConnected ? 'Chat Active' : 'Connecting...'}
                  </span> */}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(message => {
                const isCurrentUser = message.senderId === currentUser.id;
                const isCallRequest = !isCurrentUser && message.content.startsWith('http');

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
                          <span className="font-semibold text-green-700">Request Call</span>
                          <div className="text-black mt-1 text-sm">
                            <button
                              className="ml-2 p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 mt-1"
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
              <FontAwesomeIcon icon={faUserMd} className="text-4xl mb-4" />
              <p>Select a doctor to start chatting</p>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default PatientChat;
