// Export all WebRTC components for easy importing
export { VideoDisplay } from './VideoDisplay';
export { MediaControls } from './MediaControls';
export { CallControls } from './CallControls';
export { DebugStatus } from './DebugStatus';
export { WebRTCModal } from './WebRTCModal';

// Export the hook
export { useWebRTC } from '../../hook/useWebRTC';

// Export Firebase config
export { firestore, webrtcServers } from '../../config/firebase';

// Types
export type { WebRTCConfig, WebRTCState, MediaConstraintsOptions } from '../../hook/useWebRTC';