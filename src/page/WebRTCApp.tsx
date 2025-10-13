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
  
  // URL params from query string
  const [roomId, setRoomId] = useState<string>("");
  const [urlCurrentUser, setUrlCurrentUser] = useState<string>("");
  const [mediaMode, setMediaMode] = useState<'video' | 'audio'>('video');
  
  const callDocRef = useRef<firebase.firestore.DocumentReference | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const autoStartedRef = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [userRole,setUserRole] = useState<'patient' | 'doctor'>('patient');

  useEffect(() => {
    pc.current = new RTCPeerConnection(servers);
    
    // Cleanup on unmount
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

      // Listen for remote answer and hangup signal
      const unsubscribe = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        
        // Check for hangup signal
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

      // Listen for remote ICE candidates
      answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.current?.addIceCandidate(candidate);
          }
        });
      });
      
      // After call is created, send URL to other peer via WebSocket if roomId exists
      if (roomId && wsConnected) {
        // Determine the role for the recipient (opposite of current user's role)
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

      // Check if call was already hung up
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

      // Listen for hangup signal
      const unsubscribe = callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        
        if (data?.hangup) {
          console.log('🔴 Remote peer hung up');
          setConnectionStatus('Remote peer disconnected');
          hangup();
        }
      });

      unsubscribeRef.current = unsubscribe;

      // Listen for remote ICE candidates
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
    
    // Signal hangup to remote peer via Firestore
    if (callDocRef.current) {
      try {
        await callDocRef.current.update({ hangup: true });
        console.log('✅ Hangup signal sent to remote peer');
      } catch (error) {
        console.error('Error signaling hangup:', error);
      }
    }
    
    // Unsubscribe from Firestore listeners
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Close peer connection
    if (pc.current) {
      pc.current.close();
      pc.current = new RTCPeerConnection(servers);
    }
    
    // Stop all local media tracks (turn off camera/mic)
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`🎥 Stopping ${track.kind} track`);
        track.stop();
      });
      setLocalStream(null);
    }
    
    // Clear remote stream
    setRemoteStream(null);
    setCallId('');
    setMediaStarted(false);
    setCallCreated(false);
    setConnectionStatus('Disconnected');
    callDocRef.current = null;
    
    console.log('🔴 Hangup completed, media turned off');
    
    // Close window after a short delay to allow cleanup
    setTimeout(() => {
      console.log('🚪 Closing window...');
      window.close();
      
      // Fallback: If window.close() doesn't work (browser security), redirect to home
      setTimeout(() => {
        console.log('⚠️ Window close blocked, redirecting to home...');
        window.location.href = '/';
      }, 500);
    }, 1000);
  };

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
    const urlRole = params.get('role');
    
    console.log('📋 URL Parameters:', { urlRoomId, urlUser, callType, urlCallId, urlRole });
    
    if (urlRoomId) setRoomId(urlRoomId);
    if (urlUser) setUrlCurrentUser(urlUser);
    
    if (urlRole === 'doctor' || urlRole === 'patient') {
      setUserRole(urlRole);
    } else {

      setUserRole('patient');
    }
    
    // Auto-configure media mode based on callType FIRST
    const finalMediaMode: 'video' | 'audio' = (callType === 'video' || callType === 'audio') ? callType as 'video' | 'audio' : 'video';
    setMediaMode(finalMediaMode);
    console.log('🎥 Media mode set to:', finalMediaMode);
    console.log('👤 User role set to:', urlRole || 'patient (default)');
    
    // If callId is in URL, this is the answering peer - auto-answer
    if (urlCallId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setCallId(urlCallId);
      
      // Auto-start media and answer after a delay
      setTimeout(async () => {
        console.log(`🎬 Auto-starting ${finalMediaMode} for answering...`);
        
        // Start media with the correct mode
        try {
          const constraints = {
            video: finalMediaMode === 'video',
            audio: true
          };
          console.log('📹 Media constraints:', constraints);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(stream);
          setMediaStarted(true);
          
          // Wait a bit for media to be ready, then answer
          setTimeout(async () => {
            console.log('📞 Auto-answering call...');
            await answerCall();
          }, 1000);
        } catch (error) {
          console.error('Error accessing media devices:', error);
        }
      }, 500);
    } 
    // If roomId exists but no callId, this is the calling peer - auto-create call
    else if (urlRoomId && !autoStartedRef.current) {
      autoStartedRef.current = true;
      
      // Auto-start media
      setTimeout(async () => {
        console.log(`🎬 Auto-starting ${finalMediaMode} for calling...`);
        
        // Start media with the correct mode
        try {
          const constraints = {
            video: finalMediaMode === 'video',
            audio: true
          };
          console.log('📹 Media constraints:', constraints);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(stream);
          setMediaStarted(true);
          
          // Wait for media to be ready, then create call
          // setTimeout(async () => {
          //   console.log('📞 Auto-creating call...');
          //   await createCall();
          // }, 1000);
        } catch (error) {
          console.error('Error accessing media devices:', error);
        }
      }, 500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-blue-300">WebRTC Video Call</h1>
        
        {/* Connection Status Indicator */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            connectionStatus === 'Connected' ? 'bg-green-600' :
            connectionStatus.includes('disconnected') || connectionStatus.includes('ended') ? 'bg-red-600' :
            connectionStatus.includes('Error') ? 'bg-red-600' :
            connectionStatus.includes('...') ? 'bg-yellow-600' :
            'bg-gray-600'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'Connected' ? 'bg-green-300 animate-pulse' :
              connectionStatus.includes('disconnected') || connectionStatus.includes('ended') ? 'bg-red-300' :
              connectionStatus.includes('...') ? 'bg-yellow-300 animate-pulse' :
              'bg-gray-400'
            }`}>
            </div>
            <span className="font-semibold">{connectionStatus}</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl border border-blue-500">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">1. Start your Media ({mediaMode})</h2>
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="flex-1 max-w-md">
              <h3 className="text-xl font-medium mb-3 text-green-400">Local Stream</h3>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg border-2 border-green-500 shadow-lg"
              />
            </div>
            <div className="flex-1 max-w-md">
              <h3 className="text-xl font-medium mb-3 text-purple-400">Remote Stream</h3>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-black rounded-lg border-2 border-purple-500 shadow-lg"
              />
            </div>
          </div>
          <button
            onClick={startLocalMedia}
            disabled={mediaStarted}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {mediaStarted ? '✓ Media Started' : `Start ${mediaMode.charAt(0).toUpperCase() + mediaMode.slice(1)}`}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl border border-blue-500">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">2. Create a new Call</h2>
          <button
            onClick={createCall}
            disabled={!mediaStarted || callCreated}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {callCreated ? `✓ Call Created: ${callId}` : 'Create Call (offer)'}
          </button>
          {callCreated && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-blue-400">
              <p className="text-sm text-blue-300 mb-2">Share this Call ID:</p>
              <p className="font-mono text-lg text-white break-all bg-black p-3 rounded border border-blue-500">{callId}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl border border-blue-500">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">3. Join a Call</h2>
          <p className="mb-4 text-gray-300">Answer the call from a different browser window or device</p>
          <input
            id="callInput"
            type="text"
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
            placeholder="Enter call ID"
            className="w-full border-2 border-blue-500 bg-gray-900 text-white rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-blue-400 placeholder-gray-500"
          />
          <button
            onClick={answerCall}
            disabled={!mediaStarted || !callId}
            className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            Answer Call
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-blue-500">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">4. Hangup</h2>
          <button
            onClick={hangup}
            disabled={!callCreated && !callId}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            Hangup
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
