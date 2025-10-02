import React, { useState } from 'react';
import { useWebRTC } from '../hook/useWebRTC';
import { firestore, webrtcServers } from '../config/firebase';
import { VideoDisplay } from '../compoment/webrtc/VideoDisplay';
import { MediaControls } from '../compoment/webrtc/MediaControls';
import { CallControls } from '../compoment/webrtc/CallControls';
import { DebugStatus } from '../compoment/webrtc/DebugStatus';

const WebRTCApp: React.FC = () => {
  const [currentUserId] = useState<string>(() => 
    `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const webrtc = useWebRTC({
    firestore,
    servers: webrtcServers,
    currentUserId
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-10">
      <h2 className="text-3xl font-mono mb-6 text-black">WebRTC Video Call Demo</h2>
      
      {/* Debug Status */}
      <div className="mb-6 w-full max-w-4xl">
        <DebugStatus
          currentUserId={currentUserId}
          mediaStarted={webrtc.mediaStarted}
          callCreated={webrtc.callCreated}
          answerStarted={webrtc.answerStarted}
          hangupEnabled={webrtc.hangupEnabled}
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          pc={webrtc.pc}
        />
      </div>

      {/* Media Controls */}
      <div className="mb-6 w-full max-w-md">
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
            />
            <VideoDisplay
              stream={webrtc.remoteStream}
              title="Remote Stream"
            />
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="w-full max-w-md">
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
  );
};

export default WebRTCApp;