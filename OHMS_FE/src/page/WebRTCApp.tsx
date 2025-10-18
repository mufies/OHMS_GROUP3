import React, { useState, useRef, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import axios from 'axios';
import { useWebSocketService } from '../services/webSocketServices';
import { MedicalSpecialty, MedicalSpecialtyType, MEDICAL_SPECIALTY_LABELS } from '../constant/medicalSpecialty';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

// Interface for Medical Examination
interface MedicalExamination {
  id: string;
  name: string;
  price: number;
  description?: string;
}

const App: React.FC = () => {
  const pc = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callId, setCallId] = useState<string>('');
  const [mediaStarted, setMediaStarted] = useState<boolean>(false);
  const [callCreated, setCallCreated] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  const [roomId, setRoomId] = useState<string>("");
  const [urlCurrentUser, setUrlCurrentUser] = useState<string>("");
  const [mediaMode, setMediaMode] = useState<'video' | 'audio'>('video');
  
  const callDocRef = useRef<firebase.firestore.DocumentReference | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const autoStartedRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [userRole, setUserRole] = useState<'patient' | 'doctor'>('patient');
  const [patientId, setPatientId] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');

  // Modal states
  const [showCreateCallModal, setShowCreateCallModal] = useState<boolean>(false);
  const [showAnswerCallModal, setShowAnswerCallModal] = useState<boolean>(false);

  // Medical Request States (for doctor panel)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [availableExaminations, setAvailableExaminations] = useState<MedicalExamination[]>([]);
  const [selectedExaminationIds, setSelectedExaminationIds] = useState<string[]>([]);
  const [isLoadingExaminations, setIsLoadingExaminations] = useState<boolean>(false);

  // Axios instance with interceptor
  const apiClient = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.request.use(
    (config) => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    pc.current = new RTCPeerConnection(servers);
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (pc.current) {
        pc.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!pc.current || !localStream) return;

    const remote = new MediaStream();
    setRemoteStream(remote);

    localStream.getTracks().forEach((track) => {
      pc.current!.addTrack(track, localStream);
    });

    pc.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remote.addTrack(track);
      });
      setRemoteStream(new MediaStream(remote.getTracks()));
    };
  }, [mediaStarted]);

  // Fetch examinations when specialty changes
  useEffect(() => {
    if (selectedSpecialty && userRole === 'doctor') {
      fetchExaminationsBySpecialty(selectedSpecialty);
    }
  }, [selectedSpecialty, userRole]);

  const startLocalMedia = async () => {
    try {
      const constraints = {
        video: mediaMode === 'video',
        audio: true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMediaStarted(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createCall = async () => {
    if (!pc.current) return;

    try {
      const callDoc = firestore.collection('calls').doc();
      const offerCandidates = callDoc.collection('offerCandidates');
      const answerCandidates = callDoc.collection('answerCandidates');

      setCallId(callDoc.id);
      setCallCreated(true);
      callDocRef.current = callDoc;
      setConnectionStatus('Creating call...');

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          offerCandidates.add(event.candidate.toJSON());
        }
      };

      const offerDescription = await pc.current.createOffer();
      await pc.current.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await callDoc.set({ offer, hangup: false });

      const unsubscribe = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        
        if (data?.hangup) {
          console.log('🔴 Remote peer hung up');
          setConnectionStatus('Remote peer disconnected');
          hangup();
          return;
        }
        
        if (!pc.current?.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.current?.setRemoteDescription(answerDescription);
          setConnectionStatus('Connected');
        }
      });

      unsubscribeRef.current = unsubscribe;

      answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current?.addIceCandidate(candidate);
          }
        });
      });
      
      if (roomId && wsConnected) {
        const recipientRole = userRole === 'doctor' ? 'patient' : 'doctor';
        let videoCallUrl = '';
        if(recipientRole === 'doctor' && doctorId) {
          videoCallUrl = `${window.location.origin}/video?callId=${callDoc.id}&currentUser=${doctorId}&callType=${mediaMode}&role=${recipientRole}&anotherUser=${patientId}`;
        } else if (recipientRole === 'patient' && patientId) {
          videoCallUrl = `${window.location.origin}/video?callId=${callDoc.id}&currentUser=${patientId}&callType=${mediaMode}&role=${recipientRole}&anotherUser=${doctorId}`;
        }
        
        const messageData = {
          message: videoCallUrl,
          user: urlCurrentUser
        };
        
        const success = send(`/app/chat/${roomId}`, messageData);
        
        if (success) {
          console.log('✅ Video call URL sent to room:', roomId, 'URL:', videoCallUrl);
        } else {
          console.error('❌ Failed to send video call URL');
        }
      }
    } catch (error) {
      console.error('Error creating call:', error);
      setConnectionStatus('Error creating call');
    }
  };

  const answerCall = async () => {
    if (!pc.current || !callId) return;

    try {
      const callDoc = firestore.collection('calls').doc(callId);
      const answerCandidates = callDoc.collection('answerCandidates');
      const offerCandidates = callDoc.collection('offerCandidates');

      callDocRef.current = callDoc;
      setConnectionStatus('Answering call...');

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          answerCandidates.add(event.candidate.toJSON());
        }
      };

      const callData = (await callDoc.get()).data();

      if (!callData?.offer) {
        console.error('No offer found');
        setConnectionStatus('Error: No offer found');
        return;
      }

      if (callData?.hangup) {
        console.log('🔴 Call already ended');
        setConnectionStatus('Call already ended');
        return;
      }

      const offerDescription = callData.offer;
      await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answerDescription);

      const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
      };

      await callDoc.update({ answer });
      setConnectionStatus('Connected');

      const unsubscribe = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        
        if (data?.hangup) {
          console.log('🔴 Remote peer hung up');
          setConnectionStatus('Remote peer disconnected');
          hangup();
        }
      });

      unsubscribeRef.current = unsubscribe;

      offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            if (pc.current) {
              pc.current.addIceCandidate(candidate);
            }
          }
        });
      });
    } catch (error) {
      console.error('Error answering call:', error);
      setConnectionStatus('Error answering call');
    }
  };

  const hangup = async () => {
    console.log('🔴 Hangup called');
    
    if (callDocRef.current) {
      try {
        await callDocRef.current.update({ hangup: true });
        console.log('✅ Hangup signal sent to remote peer');
      } catch (error) {
        console.error('Error signaling hangup:', error);
      }
    }
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    if (pc.current) {
      pc.current.close();
      pc.current = new RTCPeerConnection(servers);
    }
    
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`🎥 Stopping ${track.kind} track`);
        track.stop();
      });
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    setCallId('');
    setMediaStarted(false);
    setCallCreated(false);
    setConnectionStatus('Disconnected');
    callDocRef.current = null;
    
    console.log('🔴 Hangup completed, media turned off');
    
    setTimeout(() => {
      console.log('🚪 Closing window...');
      window.close();
      
      setTimeout(() => {
        console.log('⚠️ Window close blocked, redirecting to home...');
        window.location.href = '/';
      }, 500);
    }, 1000);
  };

  const webSocketUrl = 'http://localhost:8080/ws';
  
  const onConnected = useCallback(() => {
    console.log('WebSocket Connected!');
    setWsConnected(true);
  }, []);
  
  const onError = useCallback((error: string) => {
    console.log('WebSocket Error:', error);
    setWsConnected(false);
  }, []);
  
  const { connect, send } = useWebSocketService(
    webSocketUrl,
    onConnected,
    onError
  );
  
  useEffect(() => {
    connect();
  }, [connect]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const urlRoomId = params.get('roomId');
    const urlUser = params.get('currentUser');
    const callType = params.get('callType');
    const urlCallId = params.get('callId');
    const urlRole = params.get('role');
    const urlAnotherUser = params.get('anotherUser');
    
    console.log('📋 URL Parameters:', { urlRoomId, urlUser, callType, urlCallId, urlRole, urlAnotherUser });
    
    if (urlRoomId) setRoomId(urlRoomId);
    if (urlUser) setUrlCurrentUser(urlUser);
    
    if (urlRole === 'doctor' || urlRole === 'patient') {
      setUserRole(urlRole);
    }
    
    if (urlRole === 'doctor' && urlAnotherUser) {
      setPatientId(urlAnotherUser);
      setDoctorId(urlUser || '');
    } else if (urlRole === 'patient' && urlAnotherUser) {
      setDoctorId(urlAnotherUser);
      setPatientId(urlUser || '');
    }
    
    const finalMediaMode: 'video' | 'audio' = (callType === 'video' || callType === 'audio') ? callType as 'video' | 'audio' : 'video';
    setMediaMode(finalMediaMode);
    console.log('🎥 Media mode set to:', finalMediaMode);
    console.log('👤 User role set to:', urlRole || 'patient (default)');
    
    if (urlCallId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setCallId(urlCallId);
      setShowAnswerCallModal(true);
    } 
    else if (urlRoomId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setShowCreateCallModal(true);
    }
  }, []);

  const handleCreateCall = async () => {
    setShowCreateCallModal(false);
    
    try {
      const constraints = {
        video: mediaMode === 'video',
        audio: true
      };
      console.log('📹 Starting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMediaStarted(true);
      
      setTimeout(async () => {
        console.log('📞 Creating call...');
        await createCall();
      }, 1000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionStatus('Error accessing camera/microphone');
    }
  };

  const handleAnswerCall = async () => {
    setShowAnswerCallModal(false);
    
    try {
      const constraints = {
        video: mediaMode === 'video',
        audio: true
      };
      console.log('📹 Starting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMediaStarted(true);
      
      setTimeout(async () => {
        console.log('📞 Answering call...');
        await answerCall();
      }, 1000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionStatus('Error accessing camera/microphone');
    }
  };

  const handleDeclineCall = () => {
    setShowAnswerCallModal(false);
    setShowCreateCallModal(false);
    window.close();
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  // Fetch medical examinations by specialty
  const fetchExaminationsBySpecialty = async (specialty: string) => {
    setIsLoadingExaminations(true);
    try {
      const response = await apiClient.post('/medical-examination/by-specialty', {
        specility: specialty
      });

      if (response.data && response.data.results) {
        setAvailableExaminations(response.data.results);
        setSelectedExaminationIds([]);
        console.log('✅ Fetched examinations:', response.data.results);
      } else {
        setAvailableExaminations([]);
        console.log('⚠️ No results found');
      }
    } catch (error) {
      console.error('❌ Error fetching examinations:', error);
      setAvailableExaminations([]);
    } finally {
      setIsLoadingExaminations(false);
    }
  };

  // Handle examination toggle
  const handleExaminationToggle = (examinationId: string) => {
    setSelectedExaminationIds(prev =>
      prev.includes(examinationId)
        ? prev.filter(id => id !== examinationId)
        : [...prev, examinationId]
    );
  };

  // Submit medical request
  const handleSubmitMedicalRequest = async () => {
    if (!selectedSpecialty || selectedExaminationIds.length === 0) {
      alert('Vui lòng chọn chuyên khoa và ít nhất một dịch vụ');
      return;
    }

    if (!patientId || !doctorId) {
      alert('Thiếu thông tin bệnh nhân hoặc bác sĩ');
      return;
    }

    try {
      const response = await apiClient.post('/medical-requests', {
        patientId: patientId,
        doctorId: doctorId,
        medicalSpecialty: selectedSpecialty,
        medicalExaminationIds: selectedExaminationIds
      });

      console.log('✅ Medical request created:', response.data);
      alert('Tạo yêu cầu khám bệnh thành công!');
      
      setSelectedSpecialty('');
      setAvailableExaminations([]);
      setSelectedExaminationIds([]);
    } catch (error) {
      console.error('❌ Error creating medical request:', error);
      alert('Không thể tạo yêu cầu khám bệnh. Vui lòng thử lại.');
    }
  };

  return (
    <>
      {/* Create Call Modal */}
      {showCreateCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-3">
                <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Bắt đầu cuộc gọi</h2>
              <p className="text-sm text-gray-600 mb-4">
                Chuẩn bị bắt đầu cuộc gọi {mediaMode === 'video' ? 'video' : 'audio'}. Đảm bảo camera và microphone đã sẵn sàng.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-blue-800 mb-1">
                  <strong>Phòng:</strong> {roomId.substring(0, 15)}...
                </p>
                <p className="text-xs text-blue-800">
                  <strong>Loại:</strong> {mediaMode === 'video' ? 'Video Call' : 'Audio Only'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeclineCall}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateCall}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  Bắt đầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Call Modal */}
      {showAnswerCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-3">
                <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Cuộc gọi đến</h2>
              <p className="text-sm text-gray-600 mb-4">
                Có người đang gọi bạn. Trả lời để tham gia cuộc gọi {mediaMode === 'video' ? 'video' : 'audio'}.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-green-800 mb-1">
                  <strong>Call ID:</strong> {callId.substring(0, 15)}...
                </p>
                <p className="text-xs text-green-800">
                  <strong>Loại:</strong> {mediaMode === 'video' ? 'Video Call' : 'Audio Only'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeclineCall}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  Từ chối
                </button>
                <button
                  onClick={handleAnswerCall}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  Trả lời
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Call Interface */}
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Main Video Call Area */}
        <div className="flex-1 flex flex-col bg-gray-900 max-h-screen">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div>
              <h1 className="text-lg font-semibold text-white">Cuộc gọi đang hoạt động</h1>
              <p className="text-xs text-gray-400">
                Video consultation với {userRole === 'doctor' ? 'Bệnh nhân' : 'Bác sĩ'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                connectionStatus === 'Connected' ? 'bg-green-600' :
                connectionStatus.includes('disconnected') || connectionStatus.includes('ended') ? 'bg-red-600' :
                'bg-yellow-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'Connected' ? 'bg-green-300 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-white font-medium">{connectionStatus}</span>
              </div>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative bg-gray-900 p-2 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* Picture-in-Picture (Local Stream) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
              <div className="relative w-full h-full">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 bg-gray-900 bg-opacity-75 px-1.5 py-0.5 rounded text-xs text-white">
                  {userRole === 'doctor' ? 'Bạn (Bác sĩ)' : 'Bạn'}
                </div>
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-center gap-3 border-t border-gray-700">
            <button 
              onClick={hangup}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Panel - Medical Request (Only for Doctor) */}
        {userRole === 'doctor' && (
          <div className="w-80 bg-white shadow-lg overflow-y-auto max-h-screen">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-base font-semibold text-gray-800">Yêu cầu khám bệnh</h2>
              </div>
              <p className="text-xs text-gray-600 mb-4">Tạo yêu cầu khám bệnh cho bệnh nhân</p>

              {/* Medical Specialty Selection */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Chuyên khoa</h3>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn chuyên khoa</option>
                  {Object.entries(MedicalSpecialty).map(([key, value]) => (
                    <option key={value} value={value}>
                      {MEDICAL_SPECIALTY_LABELS[value as MedicalSpecialtyType]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medical Examinations */}
              {selectedSpecialty && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">
                    Dịch vụ khám bệnh
                    {isLoadingExaminations && <span className="ml-2 text-blue-600">(Đang tải...)</span>}
                  </h3>
                  
                  {isLoadingExaminations ? (
                    <div className="text-center py-4">
                      <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : availableExaminations.length > 0 ? (
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {availableExaminations.map((exam) => (
                        <label 
                          key={exam.id} 
                          className="flex items-center justify-between p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedExaminationIds.includes(exam.id)}
                              onChange={() => handleExaminationToggle(exam.id)}
                              className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <span className="text-xs text-gray-700 block">{exam.name}</span>
                              {exam.description && (
                                <span className="text-xs text-gray-500">{exam.description}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-blue-600 ml-2">
                            {exam.price.toLocaleString('vi-VN')}đ
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                      Không có dịch vụ nào cho chuyên khoa này
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              {selectedSpecialty && availableExaminations.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={handleSubmitMedicalRequest}
                    disabled={selectedExaminationIds.length === 0}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
                  >
                    Tạo yêu cầu ({selectedExaminationIds.length} đã chọn)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
