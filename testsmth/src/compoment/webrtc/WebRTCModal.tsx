import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useWebRTC } from '../../hook/useWebRTC';
import { firestore, webrtcServers } from '../../config/firebase';
import { VideoDisplay } from './VideoDisplay';
import { MediaControls } from './MediaControls';
import { CallControls } from './CallControls';
import { DebugStatus } from './DebugStatus';

interface WebRTCModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  title?: string;
}

export const WebRTCModal: React.FC<WebRTCModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUserId,
  title = "WebRTC Video Call"
}) => {
  const webrtc = useWebRTC({
    firestore,
    servers: webrtcServers,
    currentUserId
  });

  if (!isOpen) return null;

  const handleClose = () => {
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
          <h3 className="text-lg font-semibold mb-4 text-black">1. Setup Media</h3>
          <MediaControls
            onStartMedia={webrtc.startMedia}
            mediaStarted={webrtc.mediaStarted}
            mediaError={webrtc.mediaError}
          />
        </div>

        {/* Video Display */}
        {webrtc.mediaStarted && (
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

        {/* Call Controls */}
        <div className="mb-4">
          <CallControls
            onCreateCall={webrtc.createCall}
            onAnswerCall={webrtc.answerCall}
            onHangup={webrtc.hangupCall}
            callId={webrtc.callId}
            setCallId={webrtc.setCallId}
            mediaStarted={webrtc.mediaStarted}
            callCreated={webrtc.callCreated}
            answerStarted={webrtc.answerStarted}
            hangupEnabled={webrtc.hangupEnabled}
          />
        </div>
      </div>
    </div>
  );
};