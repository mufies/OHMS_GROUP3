import React, { useState, useEffect } from 'react';

interface AudioDeviceInfo {
  deviceId: string;
  label: string;
}

interface MediaControlsProps {
  onStartMedia: (options: { mode: 'video' | 'audio'; selectedAudioDevice?: string }) => void;
  mediaStarted: boolean;
  mediaError: string;
  mediaRequest: 'video' | 'audio';
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  onStartMedia,
  mediaStarted,
  mediaError,
  mediaRequest
}) => {
  const [audioDevices, setAudioDevices] = useState<AudioDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const deviceInfos = audioInputs.map(device => ({  
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
      }));
      
      setAudioDevices(deviceInfos);
      if (deviceInfos.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(deviceInfos[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  };

  useEffect(() => {
    getAudioDevices();
  }, []);

  useEffect(() => {
    if (!mediaStarted && selectedAudioDevice) {
      onStartMedia({
        mode: mediaRequest,
        selectedAudioDevice
      });
    }
  }, [mediaRequest, selectedAudioDevice, mediaStarted, onStartMedia]);



  return (
    <div className="space-y-4">

      {/* Audio Device Selection */}
      {/* {audioDevices.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2 text-black">Audio Input:</label>
          <select 
            value={selectedAudioDevice} 
            onChange={(e) => setSelectedAudioDevice(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-black"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>
      )} */}

      {/* Error Display */}
      {mediaError && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-700">
          {mediaError}
        </div>
      )}

       {/* <button
        onClick={() => onStartMedia({ mode: mediaRequest, selectedAudioDevice })}
        disabled={mediaStarted}
        className="bg-blue-600 text-white py-2 px-4 rounded font-mono hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mediaStarted ? 'Media Ready' : 'Start Media'}
      </button> */}
    </div>
  );
};
