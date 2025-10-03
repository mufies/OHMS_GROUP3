import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useWebRTC } from '../../hook/useWebRTC';
import { firestore, webrtcServers } from '../../config/firebase';
import { VideoDisplay } from './VideoDisplay';
import { MediaControls } from './MediaControls';

interface WebRTCModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  title?: string;
  type: 'audio' | 'video';
  CallId: string;
}

export const CatchWebRTCModal: React.FC<WebRTCModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUserId,
  title = "WebRTC Call",
  type,
  CallId
}) => {
  const webrtc = useWebRTC({
    firestore,
    servers: webrtcServers,
    currentUserId
  });

  // Cleanup media when modal is closed
  useEffect(() => {
    if (!isOpen && webrtc.mediaStarted) {
      webrtc.hangupCall();
    }
  }, [isOpen, webrtc.mediaStarted, webrtc.hangupCall]);

  // Auto-connect when modal opens with CallId
  useEffect(() => {
    if (isOpen && CallId && !webrtc.answerStarted && !webrtc.callCreated) {
      console.log('Auto-connecting to call:', CallId);
      
      // Start media first, then answer call
      const autoConnect = async () => {
        try {
          // Start media based on type
          await webrtc.startMedia({
            mode: type as 'video' | 'audio',
          });
          
          // Small delay to ensure media is ready
          setTimeout(() => {
            webrtc.setCallId(CallId.trim());
            webrtc.answerCall(CallId.trim());
          }, 1000);
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      };
      
      autoConnect();
    }
  }, [isOpen, CallId, type, webrtc.startMedia, webrtc.answerCall, webrtc.setCallId, webrtc.answerStarted, webrtc.callCreated]);

  if (!isOpen) return null;


  const handleClose = () => {
    webrtc.hangupCall();
    onClose();
  };

  const handleHangupAndClose = () => {
    webrtc.hangupCall();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">{title}</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>



        <div className="mb-6">
          {/* <h3 className="text-lg font-semibold mb-4 text-black">1. Setup Media</h3> */}
          <MediaControls
            onStartMedia={webrtc.startMedia}
            mediaStarted={webrtc.mediaStarted}
            mediaError={webrtc.mediaError}
            mediaRequest={type}
          />
        </div>

        {/* Video Display */}
        {webrtc.mediaStarted && type === 'video' && (
          <div className="mb-6">
            <div className="flex justify-center space-x-8">
              <VideoDisplay
          stream={webrtc.localStream}
          title="Local Stream"
          muted={true}
          className="w-80 h-60 bg-gray-800 rounded"
              />
              <VideoDisplay
          stream={webrtc.remoteStream}
          title="Remote Stream"
          className="w-80 h-60 bg-gray-800 rounded"
              />
            </div>
          </div>
        )}

        {/* Call Status and Hangup */}
        <div className="mb-4 text-center">
          {webrtc.answerStarted ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 rounded">
                <p className="text-green-800 font-medium">Connected to Call</p>
                <p className="text-green-600 text-sm">Call ID: {CallId}</p>
              </div>
              <button
                onClick={handleHangupAndClose}
                className="bg-red-600 text-white py-2 px-6 rounded font-mono hover:bg-red-700"
              >
                Hang Up
              </button>
            </div>
          ) : webrtc.mediaStarted ? (
            <div className="p-4 bg-blue-100 rounded">
              <p className="text-blue-800 font-medium">Connecting to call...</p>
              <p className="text-blue-600 text-sm">Call ID: {CallId}</p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 rounded">
              <p className="text-yellow-800 font-medium">Setting up media...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};