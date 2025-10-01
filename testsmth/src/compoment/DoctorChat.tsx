import { useState, useEffect, useRef } from 'react';
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

import {useWebSocketService} from '../services/webSocketServices';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Websocket setup before connect
  const webSocketUrl = 'http://localhost:8080/ws';
  const { connect, subscribe, send, unsubscribe } = useWebSocketService(
    webSocketUrl,
    () => {
      console.log('WebSocket Connected!');
      setWsConnected(true);
    },
    (error) => {
      console.log('WebSocket Error:', error);
      setWsConnected(false);
    }
  );

// Ket noi toi websocket mount
useEffect(() => {
  connect();
  return () => {
  };
}, [connect]);

// sub toi cai chatroom muon chat
useEffect(() => {
  if (selectedPatient && chatRooms.length > 0) {
    const currentRoom = chatRooms.find(room =>
      room.user.some(user => user.id === selectedPatient.id)
    );

    if (!currentRoom) return;


    //dang ki nhan tin nhan realtime tu 1 roomchat aka box chat voi bsi
    const subscribeTimer = setTimeout(() => {
      subscribe(`/topic/room/${currentRoom.roomChatID}`, (message) => {
        console.log('📨 Received WebSocket message in DoctorChat:', message);
        
        // Skip if this message is from the current user (avoid duplicates)
        if (message.user?.id === currentUser.id) {
          return;
        }
        
        setMessages((prevMessages) => {
          const newMessage: Message = {
            id: Date.now().toString(),
            senderId: message.user?.id || 'unknown',
            senderName: message.user?.username || 'Unknown',
            content: message.message,
            timestamp: new Date(message.createdAt || Date.now()),
            isRead: false
          };
          
          
          // Add new message and sort by timestamp (oldest first)
          const updatedMessages = [...prevMessages, newMessage];
          const sortedMessages = updatedMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          return sortedMessages;
        });
      });
    }, 1000);
    //out qua room khac thi disconnect
    return () => {
      clearTimeout(subscribeTimer);
      unsubscribe(`/topic/room/${currentRoom.roomChatID}`);
    };
  }
}, [selectedPatient, chatRooms, subscribe, unsubscribe]);



  useEffect(() => {
    const loadExistingMessages = async () => {
      if (selectedPatient && chatRooms.length > 0) {
        const currentRoom = chatRooms.find(room => 
          room.user.some(user => user.id === selectedPatient.id)
        );
        
        if (currentRoom) {
          loadMessages(currentRoom.roomChatID);
        }
      } else {
        //clear msg khi k chon patients
        setMessages([]);
      }
    };

    loadExistingMessages();
  }, [selectedPatient, chatRooms, currentUser.id]);

  const fetchChatRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`http://localhost:8080/chat/${currentUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.data && response.data.results) {
        setChatRooms(response.data.results);
        console.log(response.data.results);
        // Lấy danh sách patient duy nhất từ các phòng chat
        const patientsMap = new Map<string, Patient>();

        response.data.results.forEach((room: RoomChatResponse) => {
          room.user.forEach((user: User) => {
            if (user.id!= currentUser.id) {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching chat rooms:', error.response?.data ?? error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };

  const loadMessages = async (roomChatID: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Loading messages for room:', roomChatID);
      const response = await axios.get(`http://localhost:8080/conversation/${roomChatID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('Loaded messages response:', response.data);
      
      // Handle response structure like PatientChat
      if (response.data && response.data.results) {
        const loadedMessages: Message[] = response.data.results.map((conv: any) => ({
          id: conv.id || Date.now().toString(),
          senderId: conv.user?.id || 'unknown',
          senderName: conv.user?.username || 'Unknown',
          content: conv.message,
          timestamp: new Date(conv.createdAt || new Date()),
          isRead: true
        }));
        
        // Sort messages by timestamp (oldest first)
        const sortedMessages = loadedMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setMessages(sortedMessages);
        console.log('Loaded existing messages (sorted):', sortedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fall back to empty messages if loading fails
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [currentUser.id]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredPatients = patients;

  

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatient) return;

    // Find the current room ID
    const currentRoom = chatRooms.find(room => 
      room.user.some(user => user.id === selectedPatient.id)
    );

    if (!currentRoom) {
      console.error('No room found for the selected patient');
      return;
    }

    // Create message for local display
    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.username,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false
    };

    //reset lai ui de update cai tn moi gui di
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      return updatedMessages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    const conversationRequest = {
      message: newMessage.trim(),
      user: currentUser.id
    };

    try {
      // Send to /app/chat/{roomId} 
      const success = send(`/app/chat/${currentRoom.roomChatID}`, conversationRequest);
      if (success) {
      } else {
        //khong gui duoc thi xoa khoi ui
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
    }

    setNewMessage('');
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const handleClose = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex">
      <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">Patients</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                {wsConnected ? 'Online' : 'Offline'}
              </span>
              <button
                onClick={handleClose}
                className="text-black hover:text-gray-600"
              >
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
          {filteredPatients.length > 0 ? (
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
                  <button className="p-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-full">
                    <FontAwesomeIcon icon={faPhone} />
                  </button>
                  <button className="p-2 text-black hover:text-gray-600 hover:bg-gray-100 rounded-full">
                    <FontAwesomeIcon icon={faVideo} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUser.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-black border'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === currentUser.id ? 'text-blue-100' : 'text-black'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </form>
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
