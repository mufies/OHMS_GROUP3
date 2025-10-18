import React, { useState, useRef, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { useWebSocketService } from '../services/webSocketServices';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

const firestore = getFirestore(app);
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

const WebRTCApp: React.FC = () => {
  const [callId, setCallId] = useState("");
  const [mediaStarted, setMediaStarted] = useState(false);
  const [callCreated, setCallCreated] = useState(false);
  const [answerStarted, setAnswerStarted] = useState(false);
  const [hangupEnabled, setHangupEnabled] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [mediaMode, setMediaMode] = useState<'video' | 'audio' | 'screen'>('video');
  const [mediaError, setMediaError] = useState<string>("");
  const [currentUserId] = useState<string>(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [wsConnected, setWsConnected] = useState(false);
  
  // URL params from query string
  const [roomId, setRoomId] = useState<string>("");
  const [urlCurrentUser, setUrlCurrentUser] = useState<string>("");

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection>(new RTCPeerConnection(servers));

  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callDocRef = useRef<any>(null); 
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const autoStartedRef = useRef(false); 

  // Function to signal that user is leaving
  const userLeft = async () => {
    if (callDocRef.current && currentUserId) {
      try {
        await updateDoc(callDocRef.current, {
          userLeft: true,
          whoLeft: currentUserId,
          leftAt: new Date().toISOString()
        });
        console.log('Signaled user left:', currentUserId);
      } catch (error) {
        console.error('Error signaling user left:', error);
      }
    }
  };

  // Setup beforeunload and refresh detection
  useEffect(() => {
    const handleBeforeUnload = () => {
      userLeft();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.keyCode === 116) { // F5 refresh key
        userLeft();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentUserId]);

  // Get available audio devices
  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  };

  const startMedia = async () => {
    setMediaError("");
    
    try {
      let constraints: MediaStreamConstraints | null = null;
      
      if (mediaMode === 'video') {
        constraints = {
          video: { width: 640, height: 480 },
          audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true
        };
      } else if (mediaMode === 'screen') {
        try {
          localStream.current = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
        } catch (screenError) {
          setMediaError("Screen sharing not available. Falling back to audio only.");
          constraints = {
            video: false,
            audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true
          };
        }
      } else {
        constraints = {
          video: false,
          audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true
        };
      }

      if (!localStream.current && constraints) {
        try {
          if (constraints) {
            localStream.current = await navigator.mediaDevices.getUserMedia(constraints);
          }
        } catch (videoError) {
          if (mediaMode === 'video') {
            setMediaError("Camera not available. Using audio only.");
            try {
              localStream.current = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: selectedAudioDevice ? { deviceId: selectedAudioDevice } : true
              });
            } catch (audioError) {
              setMediaError("No audio devices available. Creating silent connection.");
              const audioContext = new AudioContext();
              const oscillator = audioContext.createOscillator();
              const dest = audioContext.createMediaStreamDestination();
              oscillator.connect(dest);
              oscillator.start();
              localStream.current = dest.stream;
            }
          } else {
            throw videoError;
          }
        }
      }

      remoteStream.current = new MediaStream();

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          pc.current.addTrack(track, localStream.current!);
        });
      }

      // Handle remote tracks
      pc.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.current!.addTrack(track);
          
          // Monitor track state
          track.onended = () => {
            console.log(`Remote ${track.kind} track ended`);
            setMediaError(`Remote ${track.kind} track ended`);
          };
          
          track.onmute = () => {
            console.log(`Remote ${track.kind} track muted`);
          };
          
          track.onunmute = () => {
            console.log(`Remote ${track.kind} track unmuted`);
          };
        });
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream.current;
          console.log('Remote stream assigned to video element');
        }
      };

      // Display local stream
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = localStream.current;
      }

      setMediaStarted(true);
    } catch (error) {
      console.error('Error starting media:', error);
      setMediaError(`Media error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createCall = async () => {
    try {
      const callsCollection = collection(firestore, 'calls');
      const callDoc = doc(callsCollection);
      const offerCandidatesCollection = collection(callDoc, 'offerCandidates');
      const answerCandidatesCollection = collection(callDoc, 'answerCandidates');

      setCallId(callDoc.id);
      callDocRef.current = callDoc; // Store reference for user left signaling

      // Monitor connection state changes
      pc.current.onconnectionstatechange = () => {
        console.log('Connection state changed:', pc.current.connectionState);
      };

      // Monitor for user left signals
      const unsubscribeUserLeft = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        
        // Check for user left signal
        if (data?.userLeft && data?.whoLeft && data?.whoLeft !== currentUserId) {
          console.log('Remote user left:', data.whoLeft);
          setMediaError(`Remote user left the call`);
          hangupCall();
          return;
        }
        
        // Handle answer (existing logic)
        if (!pc.current.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.current.setRemoteDescription(answerDescription);
        }
      });

      unsubscribeRef.current = unsubscribeUserLeft;

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(offerCandidatesCollection, event.candidate.toJSON());
        }
      };

      // Only create offer if we're in stable state
      if (pc.current.signalingState === 'stable') {
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        };

        await setDoc(callDoc, { offer });

        onSnapshot(answerCandidatesCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.current.addIceCandidate(candidate);
            }
          });
        });

        setCallCreated(true);
        setHangupEnabled(true);
        
        // After call is created, send URL to other peer via WebSocket if roomId exists
        if (roomId && wsConnected) {
          const videoCallUrl = `${window.location.origin}/video?callId=${callDoc.id}&currentUser=${urlCurrentUser}&callType=${mediaMode}`;
          
          const messageData = {
            message: videoCallUrl,
            user: urlCurrentUser
          };
          
          const success = send(`/app/chat/${roomId}`, messageData);
          
          if (success) {
            console.log('✅ Video call URL sent to room:', roomId, 'URL:', videoCallUrl);
          } else {
            console.error('❌ Failed to send video call URL');
            setMediaError('Failed to send call link to other peer');
          }
        }
      } else {
        setMediaError(`Cannot create offer. Connection state: ${pc.current.signalingState}`);
      }
    } catch (error) {
      console.error('Error creating call:', error);
      setMediaError(`Failed to create call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const answerCall = async () => {
    try {
      const callsCollection = collection(firestore, 'calls');
      const callDoc = doc(callsCollection, callId);
      const answerCandidatesCollection = collection(callDoc, 'answerCandidates');
      const offerCandidatesCollection = collection(callDoc, 'offerCandidates');

      callDocRef.current = callDoc; // Store reference for user left signaling

      // Monitor connection state changes
      pc.current.onconnectionstatechange = () => {
        console.log('Connection state changed:', pc.current.connectionState);
      };

      // Monitor for user left signals
      const unsubscribeUserLeft = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        
        if (data?.userLeft && data?.whoLeft && data?.whoLeft !== currentUserId) {
          console.log('Remote user left:', data.whoLeft);
          setMediaError(`Remote user left the call`);
          hangupCall();
        }
      });

      unsubscribeRef.current = unsubscribeUserLeft;

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(answerCandidatesCollection, event.candidate.toJSON());
        }
      };

      const callSnapshot = await getDoc(callDoc);
      const callData = callSnapshot.data();

      if (!callData?.offer) {
        setMediaError("No offer found in call document");
        return;
      }

      const offerDescription = callData.offer;
      
      // Only set remote description if we haven't already
      if (pc.current.signalingState === 'stable') {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));
      }

      // Only create and set local description if we're in the right state
      if (pc.current.signalingState === 'have-remote-offer') {
        const answerDescription = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answerDescription);

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        };

        await updateDoc(callDoc, { answer });
      }

      onSnapshot(offerCandidatesCollection, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current.addIceCandidate(candidate);
          }
        });
      });

      setAnswerStarted(true);
      setHangupEnabled(true);
      console.log('Call answered successfully, hangup enabled:', true);
    } catch (error) {
      console.error('Error answering call:', error);
      setMediaError(`Failed to answer call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Still enable hangup in case of error so user can reset
      setHangupEnabled(true);
      console.log('Error in answerCall, but hangup still enabled:', true);
    }
  };

  const hangupCall = () => {
    console.log('Hangup called, current hangupEnabled state:', hangupEnabled);
    
    // Signal that user is leaving (only if not already signaled by remote)
    userLeft();
    
    // Unsubscribe from user left monitoring
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Stop all local tracks
    localStream.current?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    pc.current.close();

    // Clear streams
    remoteStream.current = null;
    
    localStream.current = null;
    
    // Clear video elements
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset state
    setCallId("");
    setMediaStarted(false);
    setCallCreated(false);
    setAnswerStarted(false);
    setHangupEnabled(false);
    setMediaError("");
    
    // Clear call reference
    callDocRef.current = null;

    // Create new peer connection
    pc.current = new RTCPeerConnection(servers);
    
    console.log('Hangup completed, all states reset');
  };

  // Fallback ICE connection monitoring (backup to user left detection)
  useEffect(() => {
    const handleConnectionStateChange = () => {
      console.log('ICE Connection State:', pc.current.iceConnectionState);
      
      // Only trigger on 'failed' state as a fallback (not disconnected)
      if (pc.current.iceConnectionState === 'failed') {
        console.log('Connection failed, hanging up as fallback...');
        setMediaError("Connection failed - network issue detected");
        hangupCall();
      }
    };

    // Add event listener for connection state changes
    pc.current.addEventListener('iceconnectionstatechange', handleConnectionStateChange);

    // Cleanup event listener
    return () => {
      pc.current.removeEventListener('iceconnectionstatechange', handleConnectionStateChange);
    };
  }, [hangupEnabled]); // Add dependency to prevent stale closure

  // Monitor remote stream status
  useEffect(() => {
    const checkRemoteStream = () => {
      if (remoteStream.current) {
        const tracks = remoteStream.current.getTracks();
        console.log('Remote stream tracks:', tracks.length);
        
        if (tracks.length === 0) {
          console.log('Remote stream has no tracks');
          setMediaError("Remote stream lost - no tracks available");
        }
        
        const activeTracks = tracks.filter(track => track.readyState === 'live');
        if (tracks.length > 0 && activeTracks.length === 0) {
          console.log('All remote tracks ended');
          setMediaError("Remote stream ended - all tracks stopped");
        }
      }
    };

    // check the src every 2s
    const interval = setInterval(checkRemoteStream, 2000);
    
    return () => clearInterval(interval);
  }, [remoteStream.current, hangupEnabled]);

  //setup websocket to send link for another peer
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
    
    const { connect, send } = useWebSocketService(
      webSocketUrl,
      onConnected,
      onError
    );
  
    // Connect once on mount
    useEffect(() => {
      connect();
    }, [connect]);

    // Parse URL parameters on mount
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      
      const urlRoomId = params.get('roomId');
      const urlUser = params.get('currentUser');
      const callType = params.get('callType');
      const urlCallId = params.get('callId');
      
      console.log('URL Parameters:', { urlRoomId, urlUser, callType, urlCallId });
      
      if (urlRoomId) setRoomId(urlRoomId);
      if (urlUser) setUrlCurrentUser(urlUser);
      
      // Auto-configure media mode based on callType
      if (callType === 'video' || callType === 'audio' || callType === 'screen') {
        setMediaMode(callType as 'video' | 'audio' | 'screen');
        console.log('Media mode set to:', callType);
      }
      
      // If callId is in URL, this is the answering peer - auto-answer
      if (urlCallId && !autoStartedRef.current) {
        autoStartedRef.current = true;
        setCallId(urlCallId);
        
        // Auto-start media and answer after a delay
        setTimeout(async () => {
          console.log('Auto-starting media for answering...');
          await startMedia();
          
          // Wait a bit for media to be ready, then answer
          setTimeout(async () => {
            console.log('Auto-answering call...');
            await answerCall();
          }, 1000);
        }, 500);
      } 
      // If roomId exists but no callId, this is the calling peer - auto-create call
      else if (urlRoomId && !autoStartedRef.current) {
        autoStartedRef.current = true;
        
        // Auto-start media and create call
        setTimeout(async () => {
          console.log('Auto-starting media for calling...');
          await startMedia();
          
          // Wait for media to be ready, then create call
          setTimeout(async () => {
            console.log('Auto-creating call...');
            await createCall();
          }, 1000);
        }, 500);
      }
    }, []);
    

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-10">
      <h2 className="text-2xl font-mono mb-6">1. Setup Media</h2>
      
      {/* Media Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Media Mode:</label>
        <select 
          value={mediaMode} 
          onChange={(e) => setMediaMode(e.target.value as 'video' | 'audio' | 'screen')}
          className="border border-gray-300 rounded px-2 py-1 mr-4"
        >
          <option value="video">Video + Audio</option>
          <option value="audio">Audio Only</option>
          <option value="screen">Screen Share</option>
        </select>
        <button
          onClick={getAudioDevices}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Refresh Audio Devices
        </button>
      </div>

      {/* Audio Device Selection */}
      {audioDevices.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Audio Input:</label>
          <select 
            value={selectedAudioDevice} 
            onChange={(e) => setSelectedAudioDevice(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {mediaError && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-700">
          {mediaError}
        </div>
      )}



      <div className="flex justify-center space-x-8 mb-6">
        <div className="flex flex-col items-center">
          <h3 className="font-mono mb-2">Local Stream</h3>
          <video ref={webcamVideoRef} className="w-[40vw] h-[30vw] bg-gray-800" autoPlay playsInline muted />
        </div>
        <div className="flex flex-col items-center">
          <h3 className="font-mono mb-2">Remote Stream</h3>
          <video ref={remoteVideoRef} className="w-[40vw] h-[30vw] bg-gray-800" autoPlay playsInline />
        </div>
      </div>

      <button
        onClick={startMedia}
        disabled={mediaStarted}
        className="bg-blue-600 text-white py-2 px-4 rounded font-mono hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {mediaStarted ? 'Media Ready' : 'Start Media'}
      </button>

      <h2 className="text-2xl font-mono mb-4">2. Create a new Call</h2>
      <button
        onClick={createCall}
        disabled={!mediaStarted || callCreated}
        className="bg-green-600 text-white py-2 px-4 rounded font-mono hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        Create Call (offer)
      </button>

      <h2 className="text-2xl font-mono mb-2">3. Join a Call</h2>
      <p className="mb-4">Answer the call from a different browser window or device</p>

      <input
        type="text"
        value={callId}
        onChange={(e) => setCallId(e.target.value)}
        placeholder="Enter Call ID"
        className="border border-gray-300 rounded px-2 py-1 font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={answerCall}
        disabled={!mediaStarted || answerStarted || callId.length === 0}
        className="bg-yellow-600 text-white py-2 px-4 rounded font-mono hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        Answer
      </button>

      <h2 className="text-2xl font-mono mb-2">4. Hangup</h2>
      <button
        disabled={!hangupEnabled}
        onClick={hangupCall}
        className="bg-red-600 text-white py-2 px-4 rounded font-mono hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Hangup
      </button>
    </div>
  );
};

export default WebRTCApp;

