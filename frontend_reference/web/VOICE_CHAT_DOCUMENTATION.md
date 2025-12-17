# Voice Chat Interface Documentation

## Overview

The voice chat interface provides a full-featured voice + text chat experience using the circular AIarya logo as the central control. Users can interact with the astrology engine through voice commands, receive spoken responses, and view their conversation history.

## Features

### Core Functionality
- **Voice Input**: Click the circular logo to start/stop voice recording
- **Real-time Transcription**: Live interim transcripts displayed while speaking
- **Chat Engine Integration**: Voice messages processed through existing astrology engines
- **Text-to-Speech**: Assistant responses can be played back as audio
- **Conversation History**: Full chat timeline with message bubbles
- **State Management**: Robust state machine handling all interaction states

### Accessibility
- **Keyboard Navigation**: Space/Enter to toggle recording, Escape to cancel
- **ARIA Labels**: Proper semantic markup and screen reader support
- **Live Regions**: Real-time status announcements for screen readers
- **Focus Management**: Clear visual indicators for keyboard users
- **Touch Targets**: Minimum 44x44px clickable areas

### Visual Feedback
- **State Animations**: Pulse rings during listening, glow effects when speaking
- **Audio Visualization**: Optional waveform display during recording
- **Transcript Overlay**: Live transcripts shown above the control
- **Status Text**: Clear state indicators (Listening, Processing, Speaking)

## Component Structure

### Pages
- **`/web/pages/voice.tsx`**: Main voice chat page with full state management

### Components
- **`VoiceControl`**: Core circular logo control with state-based visuals
- **`TranscriptOverlay`**: Displays interim and final transcripts
- **`ChatTimeline`**: Message history with scrollable timeline
- **`MessageBubble`**: Individual message display with engine data expansion
- **`VoiceWaveform`**: Canvas-based audio level visualization
- **`TTSControls`**: Playback controls for text-to-speech audio

### API Endpoints
- **`/api/voice/transcribe`**: Audio transcription endpoint (STT stub)
- **`/api/voice/chat`**: Chat processing with backend integration

### Assets
- **`/web/public/logo/AIarya-circle*.png`**: Circular logo variants (96px, 120px)
- **`/web/public/logo/AIarya-halo*.png`**: Glow effect overlays
- All assets include @2x and @3x retina variants

### Styles
- **`/web/styles/voice.css`**: Complete styling for all voice components

## State Machine

```
idle → awaitingPermission → listening → interim → processing → speaking → idle
                                 ↓                                ↓
                               error ← ← ← ← ← ← ← ← ← ← ← ← ← ← 
```

### States
- **idle**: Ready for user interaction
- **awaitingPermission**: Requesting microphone access
- **listening**: Recording audio
- **interim**: Receiving partial transcripts
- **processing**: Transcribing and sending to backend
- **speaking**: Playing TTS response
- **error**: Error state with retry option

## Usage

### Basic Flow
1. User navigates to `/voice`
2. User clicks the circular logo
3. Browser requests microphone permission
4. User speaks their question
5. Live transcripts appear above the logo
6. User clicks again to stop recording
7. Audio is transcribed and sent to chat engine
8. Assistant response appears in timeline
9. TTS audio plays automatically (if available)

### Keyboard Shortcuts
- **Space/Enter**: Start/Stop recording
- **Escape**: Cancel current operation

### Mobile Support
- Touch-optimized controls
- Responsive layout adapts to screen size
- Transcript overlay scales with viewport

## Integration Points

### ASR (Speech-to-Text)
The `/api/voice/transcribe` endpoint is a stub ready for integration with:
- Google Cloud Speech-to-Text
- Deepgram
- Azure Speech Services
- OpenAI Whisper API
- Local Whisper deployment

### TTS (Text-to-Speech)
The `/api/voice/chat` endpoint supports TTS integration with:
- ElevenLabs
- AWS Polly
- Google Cloud Text-to-Speech
- Azure Neural TTS
- OpenAI TTS

### Chat Engine
Voice messages are routed through the existing chat backend at:
- `${NEXT_PUBLIC_BACKEND_URL}/api/v1/chat`

## Configuration

### Environment Variables
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000  # Backend API URL
```

### Customization
- Logo size: Modify `size` prop on `VoiceControl`
- Colors: Update CSS variables in `voice.css`
- Audio settings: Adjust MediaRecorder options in `voice.tsx`

## Browser Support

### Requirements
- Modern browser with MediaRecorder API support
- Microphone access permission
- Audio playback capability

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Local Testing
```bash
cd web
npm install
npm run dev
```

Navigate to `http://localhost:3000/voice`

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Future Enhancements

### Planned Features
- [ ] WebRTC support for streaming audio
- [ ] WebSocket support for real-time interim transcripts
- [ ] Word-level highlighting during TTS playback
- [ ] Voice activity detection (VAD)
- [ ] Multiple language support
- [ ] Offline audio queue
- [ ] Audio storage and playback history
- [ ] Voice profile personalization

### Backend Integration
- [ ] Connect real ASR service
- [ ] Connect TTS service with word timings
- [ ] Implement subscription gating for premium features
- [ ] Add usage tracking and analytics
- [ ] Implement audio storage with encryption
- [ ] Add worker queue for heavy operations

## Security Considerations

- Microphone permission is requested explicitly
- Audio data is transmitted over HTTPS
- Authentication tokens required for API calls
- Consider implementing consent UI for audio storage
- Plan for GDPR compliance with audio data retention policies

## Performance

### Optimizations
- Circular logos preloaded on page load
- Retina images served via srcset
- Audio chunks collected every 100ms for efficiency
- Canvas-based waveform for smooth animation
- Lazy loading for non-critical components

### Monitoring
- Track microphone permission success/failure
- Monitor transcription latency
- Log TTS generation times
- Track state transition errors

## Troubleshooting

### Microphone Not Working
1. Check browser permissions
2. Ensure HTTPS connection (required for getUserMedia)
3. Verify microphone is not in use by another app
4. Check browser console for errors

### Transcription Fails
1. Verify backend API is running
2. Check network connectivity
3. Confirm audio format is supported
4. Review API endpoint responses

### TTS Not Playing
1. Check audio URL validity
2. Verify audio format support
3. Check browser autoplay policies
4. Review console for playback errors

## Contributing

When contributing to the voice chat interface:
1. Maintain existing state machine logic
2. Follow accessibility best practices
3. Test on multiple browsers and devices
4. Update documentation for new features
5. Add appropriate error handling
6. Include TypeScript types for new components
