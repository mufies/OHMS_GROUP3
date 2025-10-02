import React, { useRef, useEffect } from 'react';

interface VideoDisplayProps {
  stream: MediaStream | null;
  title: string;
  muted?: boolean;
  className?: string;
}

export const VideoDisplay: React.FC<VideoDisplayProps> = ({ 
  stream, 
  title, 
  muted = false, 
  className = "w-[40vw] h-[30vw] bg-gray-800" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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