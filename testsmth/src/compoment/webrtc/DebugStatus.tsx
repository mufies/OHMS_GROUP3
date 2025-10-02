import React from 'react';

interface DebugStatusProps {
  currentUserId: string;
  mediaStarted: boolean;
  callCreated: boolean;
  answerStarted: boolean;
  hangupEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  pc: RTCPeerConnection;
}

export const DebugStatus: React.FC<DebugStatusProps> = ({
  currentUserId,
  mediaStarted,
  callCreated,
  answerStarted,
  hangupEnabled,
  localStream,
  remoteStream,
  pc
}) => {
  return (
    <div className="p-3 bg-gray-100 border border-gray-300 rounded text-sm text-black">
      <strong>Debug Status:</strong><br/>
      User ID: {currentUserId.slice(-8)}<br/>
      Media Started: {mediaStarted ? '✅' : '❌'} | 
      Call Created: {callCreated ? '✅' : '❌'} | 
      Answer Started: {answerStarted ? '✅' : '❌'} | 
      Hangup Enabled: {hangupEnabled ? '✅' : '❌'}<br/>
      Local Stream: {localStream ? '✅' : '❌'} | 
      Remote Stream: {remoteStream ? '✅' : '❌'} | 
      PC State: {pc?.signalingState || 'unknown'} | 
      ICE State: {pc?.iceConnectionState || 'unknown'}
      {remoteStream && (
        <><br/>Remote Tracks: {remoteStream.getTracks().length}</>
      )}
    </div>
  );
};