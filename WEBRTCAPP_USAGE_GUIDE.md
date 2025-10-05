# WebRTCApp.tsx - URL-Based Auto Call Setup

## ✅ Fixed in WebRTCApp.tsx (not WebRTCCall.tsx)

Your **WebRTCApp.tsx** now supports automatic call setup via URL parameters!

## 🚀 How to Use

### From Your Chat or Booking Page:

```typescript
// When user clicks "Video Call" button
const initiateVideoCall = (roomId: string, userId: string) => {
  const videoUrl = `http://localhost:5173/video?roomId=${roomId}&currentUser=${userId}&callType=video`;
  window.location.href = videoUrl;
};

// Or for audio only:
const initiateAudioCall = (roomId: string, userId: string) => {
  const audioUrl = `http://localhost:5173/video?roomId=${roomId}&currentUser=${userId}&callType=audio`;
  window.location.href = audioUrl;
};
```

## 📋 URL Format

```
http://localhost:5173/video?roomId={ROOM_ID}&currentUser={USER_ID}&callType={TYPE}
```

### Parameters:

- **roomId** - The chat room ID where the call link will be sent
- **currentUser** - The user initiating the call
- **callType** - Either `video` or `audio`

## 🔄 Automatic Flow

### 1️⃣ **Calling Peer** (opens first URL)
```
http://localhost:5173/video?roomId=room123&currentUser=doctor1&callType=video
```

**What happens automatically:**
1. ✅ WebSocket connects
2. ✅ Camera/mic start automatically
3. ✅ Call is created (generates callId)
4. ✅ URL is sent via WebSocket to `room123`:
   ```
   http://localhost:5173/video?callId=abc123&currentUser=doctor1&callType=video
   ```

### 2️⃣ **Answering Peer** (receives and clicks URL)
```
http://localhost:5173/video?callId=abc123&currentUser=doctor1&callType=video
```

**What happens automatically:**
1. ✅ WebSocket connects
2. ✅ Camera/mic start automatically  
3. ✅ Call is answered automatically
4. ✅ Connection established!

## 📨 WebSocket Message Format

When call is created, this message is sent:

```typescript
{
  message: "http://localhost:5173/video?callId=abc123&currentUser=doctor1&callType=video",
  user: "doctor1"
}
```

**Sent to:** `/app/chat/${roomId}`

## 🎥 Media Modes

### Video Call (`callType=video`)
- ✅ Camera enabled
- ✅ Microphone enabled
- Shows both local and remote video

### Audio Call (`callType=audio`)
- ❌ Camera disabled
- ✅ Microphone enabled
- Audio-only conversation

## 💡 Example Integration

### In Your Doctor Chat Component:

```typescript
import { useState } from 'react';

function DoctorChat() {
  const roomId = "room-12345";
  const currentUser = "doctor-abc";
  
  const startVideoCall = () => {
    const url = `http://localhost:5173/video?roomId=${roomId}&currentUser=${currentUser}&callType=video`;
    window.location.href = url;
  };
  
  return (
    <button onClick={startVideoCall} className="btn-video-call">
      📹 Start Video Call
    </button>
  );
}
```

### In Your Patient Chat Component:

```typescript
// Patient will receive the URL in chat automatically
// When they click it, the call auto-answers!

function PatientChat({ messages }) {
  return (
    <div>
      {messages.map(msg => {
        // If message contains video call URL, render as button
        if (msg.message.includes('/video?callId=')) {
          return (
            <a href={msg.message} className="video-call-link">
              📞 Join Video Call
            </a>
          );
        }
        return <div>{msg.message}</div>;
      })}
    </div>
  );
}
```

## 🔍 Console Logs

You'll see these logs for debugging:

**Calling Peer:**
```
📋 URL Parameters: {roomId: "room123", currentUser: "doctor1", callType: "video"}
🎥 Media mode set to: video
🎬 Auto-starting webcam for calling...
📞 Auto-creating call...
✅ Video call URL sent to room: room123
```

**Answering Peer:**
```
📋 URL Parameters: {callId: "abc123", currentUser: "doctor1", callType: "video"}
🎥 Media mode set to: video
🎬 Auto-starting webcam for answering...
📞 Auto-answering call...
```

## ⚠️ Requirements

### Backend WebSocket Server:
- Must be running at `http://localhost:8080/ws`
- Must support endpoint: `/app/chat/{roomId}`

### Firebase Firestore:
- Configured with environment variables
- Used for WebRTC signaling

## 🐛 Troubleshooting

### URL not being sent?
- ✅ Check WebSocket connection in console
- ✅ Verify `roomId` is in URL
- ✅ Look for errors in browser console

### Auto-start not working?
- ✅ Check URL format matches exactly
- ✅ Grant camera/microphone permissions
- ✅ Look for console error logs

### Call not connecting?
- ✅ Check Firebase configuration
- ✅ Verify both peers have working cameras
- ✅ Check network/firewall settings

## 🎯 Summary

**Zero-click call setup:**
1. User clicks button → Opens URL with `roomId`
2. Camera starts automatically
3. Call creates automatically  
4. URL sent to other peer automatically
5. Other peer clicks URL
6. Their camera starts automatically
7. Call answers automatically
8. **You're connected!** 🎉

No manual "Start Camera" → "Create Call" → "Copy ID" → "Paste ID" needed!
