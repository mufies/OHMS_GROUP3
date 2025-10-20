import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faUserMd, 
  faSearch,
  faPhone,
  faVideo,
  faImage
} from '@fortawesome/free-solid-svg-icons';

import { useWebSocketService } from '../../services/webSocketServices';


interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  imageUrls?: string[];
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

const PatientChat = ({ currentUser }: PatientChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatRooms, setChatRooms] = useState<RoomChatResponse[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<User[]>([]);
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

  const getCurrentRoom = useCallback(() => {
    if (!selectedDoctor) return null;
    return chatRooms.find(room =>
      room.user.some(user => user.id === selectedDoctor.id)
    ) || null;
  }, [selectedDoctor, chatRooms]);

  // WebSocket setup 
  const webSocketUrl = 'http://localhost:8080/ws';
  
  const { connect, subscribe, send, unsubscribe } = useWebSocketService(
    webSocketUrl,
    () => {}, // onConnected
    () => {}  // onError
  );

  // Connect once on mount
  useEffect(() => {
    connect();
  }, [connect]);

  const handleSendMessageNoForm = useCallback(async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedDoctor) {
      console.warn('Cannot send: No message or images and no doctor selected');
      return;
    }

    const currentRoom = getCurrentRoom();
    if (!currentRoom) {
      console.error('No room found for the selected doctor');
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
        
        const token = localStorage.getItem('accessToken');
        const uploadResponse = await axios.post(
          'http://localhost:8080/conversation/upload-images',
          base64Datas,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
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
      base64Datas: imageUrls  // Reuse this field for Cloudinary URLs
    };

    try {
      const success = send(`/app/chat/${currentRoom.roomChatID}`, conversationRequest);
      if (!success) {
        console.error('Failed to send message via WebSocket');
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
      } else {
        console.log('✅ Message sent via WebSocket successfully');
        
        // Clear images and message after successful send
        setSelectedImages([]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('❌ Error sending message via WebSocket:', error);
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
    }
  }, [currentUser.id, newMessage, selectedDoctor, getCurrentRoom, selectedImages, send]);

  // Subscribe/unsubscribe on room changes
  useEffect(() => {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;

    const subscriptionCallback = (message: any) => {
      if (message.user?.id === currentUser.id) return;  // Skip own messages

      const incomingMessage: Message = {
        id: message.id || Date.now().toString(),
        senderId: message.user?.id || 'unknown',
        content: message.message,
        timestamp: new Date(message.createdAt || Date.now()),
        isRead: false,
        imageUrls: message.imageUrls || undefined
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
            imageUrls: conv.imageUrls || undefined
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
              doctorsMap.set(user.id, {
                id: user.id,
                username: user.username,
                email: user.email,
                specialization: user.specialization || '',
              });
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
                  {/* <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div> */}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{doctor.username}</h3>
                  <p className="text-xs text-gray-600 truncate">{doctor.specialization}</p>
                  {/* <p className="text-xs text-gray-500">
                    {doctor.isOnline ? (
                      <span className="text-green-600">Online</span>
                    ) : doctor.lastSeen ? (
                      `Last seen ${formatLastSeen(doctor.lastSeen)}`
                    ) : (
                      'Offline'
                    )}
                  </p> */}
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
                          {message.imageUrls && message.imageUrls.length > 0 && (
                            <div className="mb-2 space-y-2">
                              {message.imageUrls.map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`Image ${index + 1}`}
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
                    placeholder="Type your message..."
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
