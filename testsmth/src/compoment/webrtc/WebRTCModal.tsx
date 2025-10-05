import React, { useEffect } from 'react';  // Bỏ useState nếu unused
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useWebRTC } from '../../hook/useWebRTC';
import { firestore, webrtcServers } from '../../config/firebase';
import { VideoDisplay } from './VideoDisplay';
import { MediaControls } from './MediaControls';
import { CallControls } from './CallControls';

interface WebRTCModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  title?: string;
  type: 'audio' | 'video';  // Fix: Type strict như Catch
  onCallIdCreated?: (callId: string) => void; // Callback to send callId back to parent
}

export const WebRTCModal: React.FC<WebRTCModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUserId,
  title = "WebRTC Call",
  type,
  onCallIdCreated
}) => {
  const webrtc = useWebRTC({
    firestore,
    servers: webrtcServers,
    currentUserId
  });

  // Cleanup media when modal is closed
  useEffect(() => {
    console.log('🔍 [WebRTCModal] Modal open state changed:', isOpen, 'mediaStarted:', webrtc.mediaStarted);
    
    if (!isOpen && webrtc.mediaStarted) {
      console.log('🛑 [WebRTCModal] Modal closed with media started - calling hangup');
      webrtc.hangupCall();
    }
  }, [isOpen, webrtc.mediaStarted, webrtc.hangupCall]);

  // NEW: Auto-close modal on hangup (tương tự Catch: Detect remote left hoặc hungup flag)
  useEffect(() => {
    if ((webrtc.mediaError?.includes('Remote user left') || 
         webrtc.mediaError?.includes('ended') || 
         webrtc.isHungup) && isOpen) {  // Nếu chưa có isHungup, thay bằng !webrtc.mediaStarted && webrtc.callCreated
      console.log('🔄 [WebRTCModal] Detected hangup - auto closing modal');
      webrtc.hangupCall();  // Đảm bảo cleanup trước close
      onClose();  // Đóng modal ngay
    }
  }, [webrtc.mediaError, webrtc.isHungup, isOpen, webrtc.hangupCall, onClose]);  // Deps để re-check

  // Send callId to parent when it changes (chỉ khi mới, tránh duplicate)
  useEffect(() => {
    if (webrtc.callId && onCallIdCreated && webrtc.callCreated) {  // Thêm check callCreated để chỉ gửi khi real create
      console.log('📤 [WebRTCModal] Sending callId to parent:', webrtc.callId);
      onCallIdCreated(webrtc.callId);
    }
  }, [webrtc.callId, onCallIdCreated, webrtc.callCreated]);

  if (!isOpen) return null;

  const handleClose = () => {
    console.log('🚪 [WebRTCModal] handleClose called');
    webrtc.hangupCall();
    onClose();
  };

  const handleHangupAndClose = () => {
    console.log('📞 [WebRTCModal] handleHangupAndClose called');
    webrtc.hangupCall();
    onClose();
  };

  // Fix: Check mediaStarted trước khi create call
  const handleCreateCall = async () => {
    if (!webrtc.mediaStarted) {
      console.warn('⚠️ [WebRTCModal] Start media first before creating call');
      return;
    }
    const callId = await webrtc.createCall();  // Await để handle error nếu cần
    if (callId) {
      console.log('✅ Call created with ID:', callId);
    } else {
      console.error('❌ Failed to create call');
    }
    // CallId auto-sent via useEffect
  };

  // Xóa handleMediaCreate vì unused

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
            mediaRequest={type}
          />
        </div>

        {/* Video Display: Chỉ render nếu video type, và mediaStarted */}
        {webrtc.mediaStarted && type === 'video' && (
          <div className="mb-6">
            <div className="flex justify-center space-x-8">
              <VideoDisplay
                stream={webrtc.localStream}
                title="Local Stream"
                muted={true}  // Mute local để tránh echo
                usertype="local"
                className="w-80 h-60 bg-gray-800 rounded"
              />
              <VideoDisplay
                stream={webrtc.remoteStream}
                title="Remote Stream"
                usertype="remote"
                className="w-80 h-60 bg-gray-800 rounded"
              />
            </div>
          </div>
        )}

        {/* Call Status and Controls */}
        <div className="mb-4 text-center">
          {webrtc.callCreated ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 rounded">
                <p className="text-green-800 font-medium">Call Created - Waiting for Answer</p>
                <p className="text-green-600 text-sm">Call ID: {webrtc.callId}</p>
              </div>
              <button
                onClick={handleHangupAndClose}
                className="bg-red-600 text-white py-2 px-6 rounded font-mono hover:bg-red-700"
                disabled={!webrtc.hangupEnabled}
              >
                Hang Up
              </button>
            </div>
          ) : webrtc.mediaStarted ? (
            <div className="p-4 bg-blue-100 rounded">
              <p className="text-blue-800 font-medium">Media ready - Click Create Call</p>
              <button
                onClick={handleCreateCall}
                className="mt-2 bg-blue-600 text-white py-1 px-4 rounded hover:bg-blue-700"
              >
                Create Call
              </button>
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 rounded">
              <p className="text-yellow-800 font-medium">Setting up media...</p>
              {webrtc.mediaError && <p className="text-red-600 text-sm mt-1">{webrtc.mediaError}</p>}
            </div>
          )}
        </div>

        {/* CallControls nếu cần, nhưng tôi merge status vào trên cho simple (bỏ nếu CallControls handle UI) */}
        {webrtc.mediaStarted && (
          <CallControls
            onCreateCall={handleCreateCall}
            onAnswerCall={webrtc.answerCall}  // Không dùng cho outgoing, nhưng giữ prop
            onHangup={handleHangupAndClose}
            callId={webrtc.callId}
            setCallId={webrtc.setCallId}
            mediaStarted={webrtc.mediaStarted}
            callCreated={webrtc.callCreated}
            answerStarted={webrtc.answerStarted}
            hangupEnabled={webrtc.hangupEnabled}
          />
        )}
      </div>
    </div>
  );
};
