import React, { useRef, useEffect } from 'react';

interface VideoDisplayProps {
  stream: MediaStream | null;
  title: string;
  muted?: boolean;
  className?: string;
  usertype: string;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({ 
  stream, 
  title, 
  muted = false, 
  className = "w-[40vw] h-[30vw] bg-gray-800",
  usertype
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log(`[${usertype}] ========== VideoDisplay Stream Changed ==========`);
    console.log(`[${usertype}] New stream:`, stream);

    if (videoRef.current) {
      const oldStream = videoRef.current.srcObject as MediaStream | null;
      console.log(`[${usertype}] Old stream in video element:`, oldStream);

      if (!stream && oldStream) {
        videoRef.current.srcObject = null;
        console.log(`[${usertype}] ✅ Cleared srcObject (hangup)`);

        // Stop old tracks if still live
        oldStream.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log(`[${usertype}] Stopped track:`, track.kind);
          }
        });

      } else if (oldStream !== stream && stream) {
        videoRef.current.srcObject = stream;
        console.log(`[${usertype}] ✅ Set new stream to video element`);

        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        console.log(`[${usertype}] 📹 Video tracks: ${videoTracks.length}`);
        console.log(`[${usertype}] 🎤 Audio tracks: ${audioTracks.length}`);

        videoTracks.forEach((track, index) => {
          console.log(`[${usertype}]   Video Track ${index}:`, {
            id: track.id,
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });

          track.onended = () => console.log(`[${usertype}] ❌ Video track ${index} ENDED`);
          track.onmute = () => console.log(`[${usertype}] 🔇 Video track ${index} MUTED`);
          track.onunmute = () => console.log(`[${usertype}] 🔊 Video track ${index} UNMUTED`);
        });

        audioTracks.forEach((track, index) => {
          console.log(`[${usertype}]   Audio Track ${index}:`, {
            id: track.id,
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        });

      } else {
        // If stream is null and no old stream, do nothing
        console.log(`[${usertype}] Stream is null and no previous stream, nothing to do.`);
      }
    } else {
      console.log(`[${usertype}] Video element ref not set yet.`);
    }

    console.log(`[${usertype}] ========================================`);

    // Cleanup on unmount or stream change
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log(`[${usertype}] 🧹 VideoDisplay cleanup triggered`);
      }
    };
  }, [stream, usertype]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-mono mb-2 text-black">{title}</h3>
      <video 
        ref={videoRef} 
        className={className} 
        autoPlay 
        playsInline 
        muted={muted}
      />
    </div>
  );
};
