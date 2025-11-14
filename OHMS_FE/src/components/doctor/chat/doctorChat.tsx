import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { axiosInstance, BASE_URL, FRONTEND_URL } from '../../../utils/fetchFromAPI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faUserInjured, 
  faSearch,
  faPhone,
  faVideo,
  faImage
} from '@fortawesome/free-solid-svg-icons';

import { useWebSocketService } from '../../../services/webSocketServices';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  imageUrls?: string[];
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
  imageUrl?: string;
}

interface User {
  id: string;
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
  const [selectedImages, setSelectedImages] = useState<{file: File, url: string}[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Utility function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper: Find current chat room by selectedPatient
  const getCurrentRoom = useCallback(() => {
    if (!selectedPatient) return null;
    return chatRooms.find(room =>
      room.user.some(user => user.id === selectedPatient.id)
    ) || null;
  }, [selectedPatient, chatRooms]);

  const webSocketUrl = `${BASE_URL}/ws`;
  
  const { connect, subscribe, send, unsubscribe } = useWebSocketService(
    webSocketUrl,
    () => {}, // onConnected
    () => {}  // onError
  );

  // Connect WebSocket on mount
  useEffect(() => {
    connect();
  }, [connect]); 

  // Send new message (without form submit)
  const handleSendMessageNoForm = useCallback(async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedPatient) {
      console.warn('Cannot send: No message or images and no patient selected');
      return;
    }

    const currentRoom = getCurrentRoom();
    if (!currentRoom) {
      console.error('No room found for the selected patient');
      return;
    }

    let imageUrls: string[] = [];

    // Step 1: Upload images to Cloudinary via HTTP endpoint (if any)
    if (selectedImages.length > 0) {
      try {
        const base64Datas: string[] = [];
        for (const image of selectedImages) {
          const base64 = await fileToBase64(image.file);
          base64Datas.push(base64);
        }

        console.log('📤 Uploading', base64Datas.length, 'images to Cloudinary...');
        
        const uploadResponse = await axiosInstance.post(
          '/conversation/upload-images',
          base64Datas
        );

        if (uploadResponse.data?.results) {
          imageUrls = uploadResponse.data.results;
          console.log('✅ Images uploaded to Cloudinary:', imageUrls);
        }
      } catch (error) {
        console.error('❌ Error uploading images:', error);
        alert('Failed to upload images. Please try again.');
        return;
      }
    }

    // Step 2: Create optimistic message with Cloudinary URLs
    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined
    };

    // Optimistic update
    setMessages(prev => {
      const updated = [...prev, message];
      return updated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });

    // Step 3: Send message via WebSocket with Cloudinary URLs (not base64)
    const conversationRequest = {
      message: newMessage.trim(),
      user: currentUser.id,
      base64Datas: imageUrls  
    };

    try {
      const success = send(`/app/chat/${currentRoom.roomChatID}`, conversationRequest);
      if (!success) {
        console.error('Failed to send message via WebSocket');
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
      } else {
        console.log('✅ Message sent via WebSocket successfully');
        
        // Update patient's last message time when we send a message
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient.id === selectedPatient.id 
              ? {
                  ...patient,
                  lastMessage: newMessage.trim() || '📷 Image',
                  lastMessageTime: new Date()
                }
              : patient
          )
        );
        
        setSelectedImages([]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('❌ Error sending message via WebSocket:', error);
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
    }
  }, [currentUser.id, newMessage, selectedPatient, getCurrentRoom, selectedImages, send]); 

  // Subscribe to chat room topic on selectedPatient or chatRooms change
  useEffect(() => {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;

    const subscriptionCallback = (message: any) => {
      if (message.user?.id === currentUser.id) return; // Skip own messages

      const incomingMessage: Message = {
        id: message.id || Date.now().toString(),
        senderId: message.user?.id ?? 'unknown',
        content: message.message,
        timestamp: new Date(message.createdAt ?? Date.now()),
        isRead: false,
        imageUrls: message.imageUrls || undefined
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

  // Load existing messages on selectedPatient or chatRooms change
  useEffect(() => {
    const loadExistingMessages = async () => {
      const currentRoom = getCurrentRoom();
      if (!currentRoom) {
        setMessages([]);
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        const response = await axiosInstance.get(`/conversation/${currentRoom.roomChatID}`);

        if (response.data?.results) {
          const loadedMessages: Message[] = response.data.results.map((conv: any) => ({
            id: conv.id ?? Date.now().toString(),
            senderId: conv.user?.id ?? 'unknown',
            content: conv.message,
            timestamp: new Date(conv.createdAt ?? new Date()),
            isRead: true,
            imageUrls: conv.imageUrls || undefined
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
      const response = await axiosInstance.get(`/chat/${currentUser.id}`);

      if (response.data?.results) {
        
        setChatRooms(response.data.results);

        const patientsMap = new Map<string, Patient>();
        
        // Process each chat room to get patient info and last message
        for (const room of response.data.results) {
          for (const user of room.user) {
            if (user.id !== currentUser.id) {
              // Fetch last message for this room
              try {
                const conversationResponse = await axiosInstance.get(`/conversation/${room.roomChatID}`);
                console.log('concer');
                

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
                  lastMessageTime,
                  imageUrl: user.imageUrl || undefined
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
                  lastMessageTime: new Date(Date.now() - Math.random() * 86400000),
                  imageUrl: user.imageUrl || undefined
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
          callType: type,  // Use the parameter directly instead of state
          anotherUser: selectedPatient?.id
      }
      openCallWindow(`${FRONTEND_URL}/video?roomId=${variable.roomId}&currentUser=${variable.currentUser}&callType=${variable.callType}&role=doctor&anotherUser=${variable.anotherUser}`)

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
                  <p className="text-gray-900 font-semibold text-lg">Tin nhắn</p>
              </div>
              <div className="px-4 pb-4">
                  <div className="relative">
                      <FontAwesomeIcon
                          icon={faSearch}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                      />
                      <input
                          type="text"
                          placeholder="Tìm kiếm cuộc trò chuyện..."
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
            filteredPatients.map((patient: Patient) => (
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
                  {patient.imageUrl ? (
                    <img
                      src={patient.imageUrl}
                      alt={patient.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-xs">
                        {patient.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
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
                            ? 'Yêu cầu gọi'
                            : patient.lastMessage)
                        : 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="flex justify-center p-4">
              <span className="text-gray-500">Không có bệnh nhân nào</span>
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
                    {selectedPatient.imageUrl ? (
                      <img
                        src={selectedPatient.imageUrl}
                        alt={selectedPatient.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUserInjured} className="text-green-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-black">{selectedPatient.username}</h3>
                    <p className="text-sm text-black">
                      {/* ID: {selectedPatient.patientId} */}
                    </p>

                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer" 
                    onClick={() => createCall('audio')}
                    title="Gọi thoại"
                  >
                    <FontAwesomeIcon icon={faPhone} className="text-gray-600 text-sm" />
                  </button>
                  <button 
                    className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => createCall('video')}
                    title="Gọi video"
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
                                {message.content.includes('callType=video') ? 'Gọi video' : 'Gọi thoại'}
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
                                {message.content.includes('callType=video') ? 'Gọi video' : 'Gọi thoại'}
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
                          {message.imageUrls && message.imageUrls.length > 0 && (
                            <div className="mb-2 space-y-2">
                              {message.imageUrls.map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`Ảnh ${index + 1}`}
                                  className="max-w-full h-auto rounded-lg cursor-pointer"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  style={{ maxHeight: '200px' }}
                                />
                              ))}
                            </div>
                          )}
                          {message.content && <p className="text-sm">{message.content}</p>}
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
              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex space-x-4">
                <div className="flex-1 flex space-x-2">
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
                    placeholder="Nhập tin nhắn của bạn..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  
                  {/* Image Upload Button */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const newImages: {file: File, url: string}[] = [];
                        
                        files.forEach(file => {
                          if (file.type.startsWith('image/')) {
                            const url = URL.createObjectURL(file);
                            newImages.push({ file, url });
                          }
                        });
                        
                        setSelectedImages(prev => [...prev, ...newImages]);
                        // Reset input
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <div className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faImage} className="text-gray-500" />
                    </div>
                  </label>
                </div>
                
                <button
                  type="button"
                  disabled={!newMessage.trim() && selectedImages.length === 0}
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
              <p className="text-gray-500 text-lg mb-2">Chọn bệnh nhân để bắt đầu trò chuyện</p>
              <p className="text-gray-400 text-sm">Chọn một bệnh nhân từ danh sách để bắt đầu cuộc trò chuyện của bạn</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChat;
