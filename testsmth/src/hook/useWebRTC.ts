import { useState, useRef, useEffect, useCallback } from 'react';
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

export interface WebRTCConfig {
  firestore: any;
  servers: RTCConfiguration;
  currentUserId: string;
}

export interface WebRTCState {
  callId: string;
  mediaStarted: boolean;
  callCreated: boolean;
  answerStarted: boolean;
  hangupEnabled: boolean;
  mediaError: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  pc: RTCPeerConnection;
}

export interface MediaConstraintsOptions {
  mode: 'video' | 'audio' | 'screen';
  selectedAudioDevice?: string;
}

export const useWebRTC = (config: WebRTCConfig) => {
  const [callId, setCallId] = useState("");
  const [mediaStarted, setMediaStarted] = useState(false);
  const [callCreated, setCallCreated] = useState(false);
  const [answerStarted, setAnswerStarted] = useState(false);
  const [hangupEnabled, setHangupEnabled] = useState(false);
  const [mediaError, setMediaError] = useState<string>("");

  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection>(new RTCPeerConnection(config.servers));
  const callDocRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // User left detection
  const userLeft = useCallback(async () => {
    if (callDocRef.current && config.currentUserId) {
      try {
        await updateDoc(callDocRef.current, {
          userLeft: true,
          whoLeft: config.currentUserId,
          leftAt: new Date().toISOString()
        });
        console.log('Signaled user left:', config.currentUserId);
      } catch (error) {
        console.error('Error signaling user left:', error);
      }
    }
  }, [config.currentUserId]);

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
  }, [userLeft]);

  // Start media with different modes
  const startMedia = useCallback(async (options: MediaConstraintsOptions) => {
    setMediaError("");
    
    try {
      let constraints: MediaStreamConstraints | null = null;
      
      if (options.mode === 'video') {
        constraints = {
          video: { width: 640, height: 480 },
          audio: options.selectedAudioDevice ? { deviceId: options.selectedAudioDevice } : true
        };
      } else if (options.mode === 'screen') {
        try {
          localStream.current = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
          });
        } catch (screenError) {
          setMediaError("Screen sharing not available. Falling back to audio only.");
          constraints = {
            video: false,
            audio: options.selectedAudioDevice ? { deviceId: options.selectedAudioDevice } : true
          };
        }
      } else {
        constraints = {
          video: false,
          audio: options.selectedAudioDevice ? { deviceId: options.selectedAudioDevice } : true
        };
      }

      if (!localStream.current && constraints) {
        try {
          localStream.current = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (videoError) {
          if (options.mode === 'video') {
            setMediaError("Camera not available. Using audio only.");
            try {
              localStream.current = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: options.selectedAudioDevice ? { deviceId: options.selectedAudioDevice } : true
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

      // Add tracks to peer connection
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
          
          track.onended = () => {
            console.log(`Remote ${track.kind} track ended`);
            setMediaError(`Remote ${track.kind} track ended`);
          };
        });
      };

      setMediaStarted(true);
    } catch (error) {
      console.error('Error starting media:', error);
      setMediaError(`Media error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Create call
  const createCall = useCallback(async () => {
    try {
      const callsCollection = collection(config.firestore, 'calls');
      const callDoc = doc(callsCollection);
      const offerCandidatesCollection = collection(callDoc, 'offerCandidates');
      const answerCandidatesCollection = collection(callDoc, 'answerCandidates');

      setCallId(callDoc.id);
      callDocRef.current = callDoc;

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(offerCandidatesCollection, event.candidate.toJSON());
        }
      };

      // Monitor for user left signals
      const unsubscribeUserLeft = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        
        if (data?.userLeft && data?.whoLeft && data?.whoLeft !== config.currentUserId) {
          console.log('Remote user left:', data.whoLeft);
          setMediaError(`Remote user left the call`);
          hangupCall();
          return;
        }
        
        if (!pc.current.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.current.setRemoteDescription(answerDescription);
        }
      });

      unsubscribeRef.current = unsubscribeUserLeft;

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
      } else {
        setMediaError(`Cannot create offer. Connection state: ${pc.current.signalingState}`);
      }
    } catch (error) {
      console.error('Error creating call:', error);
      setMediaError(`Failed to create call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [config.firestore, config.currentUserId]);

  // Answer call
  const answerCall = useCallback(async (callIdToAnswer: string) => {
    try {
      const callsCollection = collection(config.firestore, 'calls');
      const callDoc = doc(callsCollection, callIdToAnswer);
      const answerCandidatesCollection = collection(callDoc, 'answerCandidates');
      const offerCandidatesCollection = collection(callDoc, 'offerCandidates');

      callDocRef.current = callDoc;

      const unsubscribeUserLeft = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        
        if (data?.userLeft && data?.whoLeft && data?.whoLeft !== config.currentUserId) {
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
      
      if (pc.current.signalingState === 'stable') {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));
      }

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
      setCallId(callIdToAnswer);
    } catch (error) {
      console.error('Error answering call:', error);
      setMediaError(`Failed to answer call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHangupEnabled(true);
    }
  }, [config.firestore, config.currentUserId]);

  // Hangup call
  const hangupCall = useCallback(() => {
    console.log('Hangup called');
    
    userLeft();
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    localStream.current?.getTracks().forEach((track) => track.stop());
    pc.current.close();
    
    remoteStream.current = null;
    localStream.current = null;
    
    setCallId("");
    setMediaStarted(false);
    setCallCreated(false);
    setAnswerStarted(false);
    setHangupEnabled(false);
    setMediaError("");
    
    callDocRef.current = null;
    pc.current = new RTCPeerConnection(config.servers);
    
    console.log('Hangup completed');
  }, [userLeft, config.servers]);

  // Fallback ICE connection monitoring
  useEffect(() => {
    const handleConnectionStateChange = () => {
      if (pc.current.iceConnectionState === 'failed') {
        console.log('Connection failed, hanging up as fallback...');
        setMediaError("Connection failed - network issue detected");
        hangupCall();
      }
    };

    pc.current.addEventListener('iceconnectionstatechange', handleConnectionStateChange);

    return () => {
      pc.current.removeEventListener('iceconnectionstatechange', handleConnectionStateChange);
    };
  }, [hangupCall]);

  return {
    // State
    callId,
    mediaStarted,
    callCreated,
    answerStarted,
    hangupEnabled,
    mediaError,
    localStream: localStream.current,
    remoteStream: remoteStream.current,
    pc: pc.current,
    
    // Actions
    startMedia,
    createCall,
    answerCall,
    hangupCall,
    setCallId,
    setMediaError,
  };
};