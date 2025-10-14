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

import { useWebSocketService } from '../../../services/webSocketServices';


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
}

const DoctorChat = ({ currentUser }: DoctorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatRooms, setChatRooms] = useState<RoomChatResponse[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

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
        
        // Update patient's last message time when we send a message
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === selectedPatient.id 
              ? {
                  ...patient,
                  lastMessage: newMessage.trim(),
                  lastMessageTime: new Date()
                }
              : patient
          )
        );
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

      // Update patient's last message time and content for sorting
      setPatients(prevPatients => 
        prevPatients.map(patient => 
          patient.id === message.user?.id 
            ? {
                ...patient,
                lastMessage: message.message,
                lastMessageTime: new Date(message.createdAt ?? Date.now())
              }
            : patient
        )
      );
    };

    const subscribeTimer = setTimeout(() => {
      subscribe(`/topic/room/${currentRoom.roomChatID}`, subscriptionCallback);
    }, 1000);

    return () => {
      clearTimeout(subscribeTimer);
      unsubscribe(`/topic/room/${currentRoom.roomChatID}`);
    };
  }, [selectedPatient, chatRooms, subscribe, unsubscribe, currentUser.id, getCurrentRoom]);

  // Subscribe to ALL chat rooms for real-time updates
  useEffect(() => {
    if (chatRooms.length === 0) return;

    const subscriptions: string[] = [];
    const timers: NodeJS.Timeout[] = [];

    chatRooms.forEach(room => {
      const topic = `/topic/room/${room.roomChatID}`;
      
      const globalCallback = (message: any) => {
        if (message.user?.id === currentUser.id) return; // Skip own messages

        // Update patient list for ANY room, not just current room
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === message.user?.id 
              ? {
                  ...patient,
                  lastMessage: message.message,
                  lastMessageTime: new Date(message.createdAt ?? Date.now())
                }
              : patient
          )
        );

        // Only update messages if this is the current room
        const currentRoom = getCurrentRoom();
        if (currentRoom && room.roomChatID === currentRoom.roomChatID) {
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
        }
      };

      const subscribeTimer = setTimeout(() => {
        subscribe(topic, globalCallback);
        subscriptions.push(topic);
      }, 1000 + Math.random() * 500); 
      
      timers.push(subscribeTimer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      subscriptions.forEach(topic => {
        unsubscribe(topic);
      });
    };
  }, [chatRooms, subscribe, unsubscribe, currentUser.id, selectedPatient?.id, getCurrentRoom]);

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

          // Update patient's last message info based on loaded messages
          if (loadedMessages.length > 0 && selectedPatient) {
            const lastMessage = loadedMessages[loadedMessages.length - 1];
            setPatients(prevPatients => 
              prevPatients.map(patient => 
                patient.id === selectedPatient.id 
                  ? {
                      ...patient,
                      lastMessage: lastMessage.content,
                      lastMessageTime: lastMessage.timestamp
                    }
                  : patient
              )
            );
          }
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
        
        // Process each chat room to get patient info and last message
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
                let lastMessageTime = new Date(Date.now() - Math.random() * 86400000); // Default to within last day

                if (conversationResponse.data?.results && conversationResponse.data.results.length > 0) {
                  const messages = conversationResponse.data.results;
                  const lastMsg = messages[messages.length - 1];
                  
                  lastMessage = lastMsg.message;
                  lastMessageTime = new Date(lastMsg.createdAt);
                }

                patientsMap.set(user.id, {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  patientId: `P${user.id.substring(0, 3).toUpperCase()}`,
                  isOnline: Math.random() > 0.3, // 70% chance of being online
                  condition: 'General Consultation',
                  lastMessage,
                  lastMessageTime
                });
              } catch (msgError) {
                console.warn('Error fetching messages for room:', room.roomChatID, msgError);
                // Fallback patient data if message fetch fails
                patientsMap.set(user.id, {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  patientId: `P${user.id.substring(0, 3).toUpperCase()}`,
                  condition: 'General Consultation',
                  lastMessage: 'No messages yet',
                  lastMessageTime: new Date(Date.now() - Math.random() * 86400000)
                });
              }
            }
          }
        }
        
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

  // Filtered patients by searchTerm (case insensitive) and sorted by last message time
  const filteredPatients = useMemo(() => {
    let filtered = patients;
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      filtered = patients.filter(p =>
        p.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by last message time (most recent first)
    return filtered.sort((a, b) => {
      const timeA = a.lastMessageTime ? a.lastMessageTime.getTime() : 0;
      const timeB = b.lastMessageTime ? b.lastMessageTime.getTime() : 0;
      return timeB - timeA; // Descending order (newest first)
    });
  }, [patients, searchTerm]);

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };



  



    const createCall = (type: 'audio' | 'video') => {
    var currentRoom = getCurrentRoom();
      const variable = {
          roomId: currentRoom?.roomChatID,
          currentUser: currentUser.id,
          callType: type  // Use the parameter directly instead of state
          
      }
      openCallWindow(`http://localhost:5173/video?roomId=${variable.roomId}&currentUser=${variable.currentUser}&callType=${variable.callType}&role=doctor`)

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
    <div className="h-full w-full bg-white flex">
      {/* Patients List */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="border-b border-gray-200">
          {/* Search */}
          <div className="bg-white sticky top-0 z-10">
              <div className="p-4 pb-2">
                  <p className="text-gray-900 font-semibold text-lg">Messages</p>
              </div>
              <div className="px-4 pb-4">
                  <div className="relative">
                      <FontAwesomeIcon
                          icon={faSearch}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                      />
                      <input
                          type="text"
                          placeholder="Search conversations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 text-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      />
                  </div>
              </div>
          </div>
        </div>
        <div className="space-y-0 flex-1 overflow-y-auto">
          {filteredPatients.length ? (
            filteredPatients.map(patient => (
              <div
                key={patient.id}
                onClick={() => {
                  setSelectedPatient(patient);
                }}
                className={`p-4 cursor-pointer flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                  selectedPatient?.id === patient.id ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {patient.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{patient.username}</h3>
                    {patient.lastMessageTime && (
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {formatLastMessageTime(patient.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {patient.lastMessage 
                        ? (patient.lastMessage.includes('currentUser=') && patient.lastMessage.includes('callType=')
                            ? 'Call Request'
                            : patient.lastMessage)
                        : 'No messages yet'}
                    </p>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="flex justify-center p-4">
              <span className="text-gray-500">No patients available</span>
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
                  </div>
                  <div>
                    <h3 className="font-medium text-black">{selectedPatient.username}</h3>
                    <p className="text-sm text-black">
                      ID: {selectedPatient.patientId}
                    </p>

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
              <FontAwesomeIcon icon={faUserInjured} className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Select a patient to start chatting</p>
              <p className="text-gray-400 text-sm">Choose a patient from the list to begin your conversation</p>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default DoctorChat;
