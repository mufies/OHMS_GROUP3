import React, { useState } from 'react';

interface CallControlsProps {
  onCreateCall: () => void;
  onAnswerCall: (callId: string) => void;
  onHangup: () => void;
  callId: string;
  setCallId: (id: string) => void;
  mediaStarted: boolean;
  callCreated: boolean;
  answerStarted: boolean;
  hangupEnabled: boolean;
}

export const CallControls: React.FC<CallControlsProps> = ({
  onCreateCall,
  onAnswerCall,
  onHangup,
  callId,
  setCallId,
  mediaStarted,
  callCreated,
  answerStarted,
  hangupEnabled
}) => {
  const [inputCallId, setInputCallId] = useState("");

  const handleAnswerCall = () => {
    if (inputCallId.trim()) {
      onAnswerCall(inputCallId.trim());
      setCallId(inputCallId.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Call Section */}
      <div className="text-center">
        <h2 className="text-xl font-mono mb-4 text-black">Create a New Call</h2>
        <button
          onClick={onCreateCall}
          disabled={!mediaStarted || callCreated}
          className="bg-green-600 text-white py-2 px-4 rounded font-mono hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Call (offer)
        </button>
        {callId && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-sm text-black font-medium">Call ID:</p>
            <p className="text-black font-mono break-all">{callId}</p>
          </div>
        )}
      </div>

      {/* Join Call Section */}
      <div className="text-center">
        <h2 className="text-xl font-mono mb-2 text-black">Join a Call</h2>
        <p className="mb-4 text-black">Answer the call from a different browser window or device</p>

        <input
          type="text"
          value={inputCallId}
          onChange={(e) => setInputCallId(e.target.value)}
          placeholder="Enter Call ID"
          className="border border-gray-300 rounded px-2 py-1 font-mono mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />

        <button
          onClick={handleAnswerCall}
          disabled={!mediaStarted || answerStarted || inputCallId.length === 0}
          className="block mx-auto bg-yellow-600 text-white py-2 px-4 rounded font-mono hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          Answer
        </button>
      </div>

      {/* Hangup Section */}
      <div className="text-center">
        <h2 className="text-xl font-mono mb-2 text-black">Hangup</h2>
        <button
          disabled={!hangupEnabled}
          onClick={onHangup}
          className="bg-red-600 text-white py-2 px-4 rounded font-mono hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Hangup
        </button>
      </div>
    </div>
  );
};