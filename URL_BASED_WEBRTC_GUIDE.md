# URL-Based WebRTC Call Setup Guide

## Overview
The WebRTC Call component now supports automatic call setup based on URL parameters. This allows seamless peer-to-peer call initiation via URL sharing.

## URL Format
```
http://localhost:5173/video?roomId=${roomId}&currentUser=${userId}&callType=${type}
```

### URL Parameters

1. **roomId** (required for initiating peer)
   - The chat room ID where the call link will be sent
   - Used to send the video call URL to the other peer via WebSocket

2. **currentUser** (required)
   - The user ID of the person initiating/joining the call
   - Included in WebSocket messages

3. **callType** (required)
   - Determines the media mode for the call
   - Accepted values:
     - `video` - Video + Audio call
     - `audio` - Audio only call
     - `screen` - Screen sharing call

4. **callId** (auto-generated and shared)
   - Created by the calling peer
   - Sent to the answering peer in the URL
   - Used to join the specific WebRTC call session

## How It Works

### Scenario 1: Initiating a Call (Calling Peer)

When you open:
```
http://localhost:5173/video?roomId=room123&currentUser=user1&callType=video
```

**Automatic Actions:**
1. ✅ Media mode is set to "video"
2. ✅ WebSocket connects to the backend
3. ✅ Camera and microphone are automatically started
4. ✅ A new WebRTC call is created (generates callId)
5. ✅ A URL is sent to the other peer via WebSocket to room `room123`:
   ```
   http://localhost:5173/video?callId=abc123xyz&currentUser=user1&callType=video
   ```

### Scenario 2: Answering a Call (Answering Peer)

When the other peer clicks the received URL:
```
http://localhost:5173/video?callId=abc123xyz&currentUser=user2&callType=video
```

**Automatic Actions:**
1. ✅ Media mode is set to "video"
2. ✅ WebSocket connects to the backend
3. ✅ Camera and microphone are automatically started
4. ✅ The call is automatically answered using the provided callId
5. ✅ Peer-to-peer connection is established

## WebSocket Message Format

When a call is created, the following message is sent via WebSocket:

```typescript
{
  message: "http://localhost:5173/video?callId=abc123xyz&currentUser=user1&callType=video",
  user: "user1"
}
```

**Destination:**
```
/app/chat/${roomId}
```

## Media Modes

### Video Mode (`callType=video`)
- ✅ Enables camera (640x480)
- ✅ Enables microphone
- ✅ Displays local and remote video streams

### Audio Mode (`callType=audio`)
- ✅ Enables microphone only
- ❌ No video transmission
- 💡 Useful for voice-only calls

### Screen Mode (`callType=screen`)
- ✅ Shares entire screen
- ✅ Enables audio
- 💡 Falls back to audio-only if screen sharing is denied

## Implementation Details

### State Management
```typescript
const [wsConnected, setWsConnected] = useState(false);
const [roomId, setRoomId] = useState<string>("");
const [urlCurrentUser, setUrlCurrentUser] = useState<string>("");
const autoStartedRef = useRef(false); // Prevents duplicate auto-starts
```

### URL Parsing Logic
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  const urlRoomId = params.get('roomId');
  const urlUser = params.get('currentUser');
  const callType = params.get('callType');
  const urlCallId = params.get('callId');
  
  // Auto-configure media mode
  if (callType === 'video' || callType === 'audio' || callType === 'screen') {
    setMediaMode(callType);
  }
  
  // If callId exists, this is the answering peer
  if (urlCallId && !autoStartedRef.current) {
    autoStartedRef.current = true;
    // Auto-start media and answer
  }
  // If only roomId exists, this is the calling peer
  else if (urlRoomId && !autoStartedRef.current) {
    autoStartedRef.current = true;
    // Auto-start media and create call
  }
}, []);
```

### Sending Call URL to Peer
```typescript
// After call is created
if (roomId && wsConnected) {
  const videoCallUrl = `${window.location.origin}/video?callId=${callId}&currentUser=${urlCurrentUser}&callType=${mediaMode}`;
  
  const messageData = {
    message: videoCallUrl,
    user: urlCurrentUser
  };
  
  send(`/app/chat/${roomId}`, messageData);
}
```

## Example Usage Flow

### Step 1: Doctor Initiates Call
```typescript
// Doctor navigates to:
window.location.href = `http://localhost:5173/video?roomId=room456&currentUser=doctor1&callType=video`;
```

### Step 2: System Auto-Creates Call
- Media starts automatically
- Call is created with Firebase
- URL is sent to patient via WebSocket

### Step 3: Patient Receives URL
The patient receives this message in the chat:
```
http://localhost:5173/video?callId=generatedId123&currentUser=doctor1&callType=video
```

### Step 4: Patient Clicks URL
- Patient's browser opens the URL
- Media starts automatically
- Call is automatically answered
- Connection established

## Error Handling

### WebSocket Connection Failed
```typescript
if (!wsConnected) {
  // URL won't be sent, but manual sharing is still possible
  console.error('WebSocket not connected');
}
```

### Media Permission Denied
```typescript
// Falls back to audio-only if video fails
// Creates silent stream if audio also fails
```

### Call Creation Failed
```typescript
// Error message displayed to user
setMediaError('Failed to create call: ...');
```

## Configuration Requirements

### Environment Variables
Ensure Firebase configuration is set in `.env`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### WebSocket Backend
WebSocket server must be running at:
```
http://localhost:8080/ws
```

With endpoint:
```
/app/chat/{roomId}
```

## Troubleshooting

### URL Not Being Sent
1. ✅ Check WebSocket connection status (`wsConnected`)
2. ✅ Verify `roomId` is present in URL
3. ✅ Check browser console for WebSocket errors

### Auto-Start Not Working
1. ✅ Check browser console for URL parameter logs
2. ✅ Verify URL format matches expected pattern
3. ✅ Check for duplicate calls to auto-start (should be prevented by ref)

### Media Not Starting
1. ✅ Grant browser camera/microphone permissions
2. ✅ Check if device has camera/microphone
3. ✅ Review console for media errors

## Testing

### Test as Calling Peer
```
http://localhost:5173/video?roomId=testRoom&currentUser=testUser1&callType=video
```

### Test as Answering Peer
```
http://localhost:5173/video?callId=testCallId123&currentUser=testUser2&callType=video
```

## Summary

This implementation provides a **seamless, zero-click call setup** experience:

✅ **Automatic media configuration** based on URL
✅ **Automatic call creation** for initiating peer  
✅ **Automatic call answering** for receiving peer  
✅ **WebSocket-based URL sharing** to other peer  
✅ **Flexible media modes** (video/audio/screen)  
✅ **Error handling** with fallbacks

Users simply click a URL and the call automatically starts!
