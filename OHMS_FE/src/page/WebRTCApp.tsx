import React, { useState, useRef, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { useWebSocketService } from '../services/webSocketServices';

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

  // Modal states
  const [showCreateCallModal, setShowCreateCallModal] = useState<boolean>(false);
  const [showAnswerCallModal, setShowAnswerCallModal] = useState<boolean>(false);

  // Service Selection States (for doctor panel)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomDescription, setSymptomDescription] = useState<string>('');
  const [urgencyLevel, setUrgencyLevel] = useState<string>('normal');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');

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
        
        const videoCallUrl = `${window.location.origin}/video?callId=${callDoc.id}&currentUser=${urlCurrentUser}&callType=${mediaMode}&role=${recipientRole}`;
        
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
  
  // Parse URL parameters and show appropriate modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const urlRoomId = params.get('roomId');
    const urlUser = params.get('currentUser');
    const callType = params.get('callType');
    const urlCallId = params.get('callId');
    const urlRole = params.get('role');
    
    console.log('📋 URL Parameters:', { urlRoomId, urlUser, callType, urlCallId, urlRole });
    
    if (urlRoomId) setRoomId(urlRoomId);
    if (urlUser) setUrlCurrentUser(urlUser);
    
    if (urlRole === 'doctor' || urlRole === 'patient') {
      setUserRole(urlRole);
    } else {
      setUserRole('patient');
    }
    
    const finalMediaMode: 'video' | 'audio' = (callType === 'video' || callType === 'audio') ? callType as 'video' | 'audio' : 'video';
    setMediaMode(finalMediaMode);
    console.log('🎥 Media mode set to:', finalMediaMode);
    console.log('👤 User role set to:', urlRole || 'patient (default)');
    
    // If callId exists in URL, show Answer Call modal
    if (urlCallId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setCallId(urlCallId);
      setShowAnswerCallModal(true);
    } 
    // If roomId exists but no callId, show Create Call modal
    else if (urlRoomId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setShowCreateCallModal(true);
    }
  }, []);

  // Handle Create Call from modal
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
      
      // Wait for media to be ready, then create call
      setTimeout(async () => {
        console.log('📞 Creating call...');
        await createCall();
      }, 1000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionStatus('Error accessing camera/microphone');
    }
  };

  // Handle Answer Call from modal
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
      
      // Wait for media to be ready, then answer call
      setTimeout(async () => {
        console.log('📞 Answering call...');
        await answerCall();
      }, 1000);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionStatus('Error accessing camera/microphone');
    }
  };

  // Handle Decline Call
  const handleDeclineCall = () => {
    setShowAnswerCallModal(false);
    setShowCreateCallModal(false);
    window.close();
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const symptoms = [
    'Fever', 'Headache', 'Nausea', 'Shortness of Breath', 
    'Abdominal Pain', 'Cough', 'Fatigue', 'Chest Pain', 
    'Dizziness', 'Sore Throat'
  ];

  const services = [
    { name: 'General Consultation', price: '$50' },
    { name: 'Laboratory Tests', price: '$80' },
    { name: 'X-Ray Imaging', price: '$120' },
    { name: 'Prescription Medicine', price: '$30' },
    { name: 'Follow-up Appointment', price: '$40' },
    { name: 'Specialist Referral', price: '$100' }
  ];

  return (
    <>
      {/* Create Call Modal */}
      {showCreateCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Video Call</h2>
              <p className="text-gray-600 mb-6">
                You are about to start a {mediaMode} call. Make sure your camera and microphone are ready.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Room ID:</strong> {roomId}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Mode:</strong> {mediaMode === 'video' ? 'Video Call' : 'Audio Only'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeclineCall}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCall}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Start Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Call Modal */}
      {showAnswerCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Incoming Call</h2>
              <p className="text-gray-600 mb-6">
                Someone is calling you. Answer to join the {mediaMode} call.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Call ID:</strong> {callId.substring(0, 20)}...
                </p>
                <p className="text-sm text-green-800">
                  <strong>Mode:</strong> {mediaMode === 'video' ? 'Video Call' : 'Audio Only'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeclineCall}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                >
                  Decline
                </button>
                <button
                  onClick={handleAnswerCall}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Call Interface */}
      <div className="flex h-screen bg-gray-100">
        {/* Main Video Call Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
            <div>
              <h1 className="text-xl font-semibold text-white">Active Call</h1>
              <p className="text-sm text-gray-400">Video consultation with {userRole === 'doctor' ? 'Emily Rodriguez' : 'Doctor'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                connectionStatus === 'Connected' ? 'bg-green-600' :
                connectionStatus.includes('disconnected') || connectionStatus.includes('ended') ? 'bg-red-600' :
                'bg-yellow-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'Connected' ? 'bg-green-300 animate-pulse' : 'bg-gray-300'
                }`}></div>
                <span className="text-white font-medium">{connectionStatus}</span>
              </div>
              <div className="text-gray-400 text-sm">05:32</div>
            </div>
          </div>

          {/* Video Area */}
        <div className="flex-1 relative bg-gray-900 p-2 overflow-hidden">
          {/* Main Video (Remote Stream) */}
          <div className="w-full h-full flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Picture-in-Picture (Local Stream) - size nhỏ hơn */}
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
                {userRole === 'doctor' ? 'You (Doctor)' : 'You'}
              </div>
            </div>
          </div>
        </div>

          {/* Control Bar */}
          <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4 border-t border-gray-700">
            {/* <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button> */}
            
            <button 
              onClick={hangup}
              className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white transition shadow-lg"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
            
            {/* <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button> */}
          </div>
        </div>

        {/* Right Panel - Service Selection (Only for Doctor) */}
        {userRole === 'doctor' && (
          <div className="w-96 bg-white shadow-lg overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-800">Service Selection</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">Select services based on patient symptoms</p>

              {/* Patient Symptoms */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Symptoms</h3>
                <div className="grid grid-cols-2 gap-2">
                  {symptoms.map((symptom) => (
                    <label key={symptom} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSymptoms.includes(symptom)}
                        onChange={() => handleSymptomToggle(symptom)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Symptom Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Symptom Description</h3>
                <textarea
                  value={symptomDescription}
                  onChange={(e) => setSymptomDescription(e.target.value)}
                  placeholder="Describe the symptoms in detail..."
                  className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Urgency Level */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Urgency Level</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value="low"
                      checked={urgencyLevel === 'low'}
                      onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Low - Routine care</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value="normal"
                      checked={urgencyLevel === 'normal'}
                      onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Normal - Standard consultation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      value="high"
                      checked={urgencyLevel === 'high'}
                      onChange={(e) => setUrgencyLevel(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">High - Urgent attention needed</span>
                  </label>
                </div>
              </div>

              {/* Recommended Services */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recommended Services</h3>
                <div className="space-y-2">
                  {services.map((service) => (
                    <label key={service.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.name)}
                          onChange={() => handleServiceToggle(service.name)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{service.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{service.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Notes</h3>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any additional information or special instructions..."
                  className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Follow-up Date */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Follow-up Date (Optional)</h3>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
