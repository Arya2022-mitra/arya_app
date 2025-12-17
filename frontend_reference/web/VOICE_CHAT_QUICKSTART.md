# Voice Chat Interface - Quick Start Guide

## Accessing the Voice Chat

1. **Navigate to Voice Chat**
   - Click the hamburger menu (☰) in the top-left
   - Select "🎙️ Voice Chat" from the menu
   - Or directly visit: `/voice`

2. **Using Voice Chat**
   - Click the circular AIarya logo to start speaking
   - Your speech will be transcribed in real-time (shown above the logo)
   - Click again to stop recording
   - The message will be sent to the astrology engine
   - Listen to the spoken response automatically

3. **Keyboard Shortcuts**
   - **Space** or **Enter**: Start/Stop recording
   - **Escape**: Cancel current operation

## Features Overview

### Voice Control States
- **Idle** (Blue): Ready to start
- **Listening** (Pulsing): Recording your voice
- **Processing** (Spinning): Transcribing and analyzing
- **Speaking** (Glowing): Playing audio response
- **Error** (Red): Something went wrong, click to retry

### Visual Indicators
- **Pulse Ring**: Appears when listening
- **Glow Effect**: Appears when assistant is speaking
- **Live Transcript**: Shows above the logo while you speak
- **Audio Waveform**: Visual representation of sound levels

### Playback Controls
- **Pause**: Pause the current audio response
- **Resume**: Continue playing paused audio
- **Stop**: Stop audio completely
- **Replay**: Replay the last response

## Requirements

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Permissions Required
- **Microphone Access**: Required for voice input
- **Audio Playback**: Required for spoken responses

### Network
- HTTPS connection (required for microphone access)
- Stable internet connection for real-time processing

## Troubleshooting

### "Microphone permission denied"
1. Click the lock icon in your browser's address bar
2. Allow microphone access
3. Refresh the page
4. Try again

### "No supported audio format found"
- Your browser doesn't support WebM audio recording
- Try using Chrome or Firefox for best compatibility

### Transcription not working
- Check that you're connected to the internet
- Verify the backend API is running
- Look for errors in the browser console (F12)

### Audio not playing
- Check your device volume
- Ensure audio isn't muted in your browser
- Try clicking the Replay button

## Tips for Best Results

1. **Speak Clearly**: Talk at a normal pace in a quiet environment
2. **Short Questions**: Ask one question at a time for best results
3. **Wait for Processing**: Allow time for transcription and analysis
4. **Use Keyboard**: Space bar is faster than clicking
5. **Review Transcript**: Check the live transcript for accuracy

## Example Questions

Try asking:
- "What is my moon sign?"
- "Tell me about my current dasha"
- "What planets are in my first house?"
- "Give me today's panchang"
- "What is my nakshatra?"

## Current Limitations

⚠️ **Development Stage**: The voice interface is currently in development

- **ASR Integration**: Using mock transcription (to be replaced with real service)
- **TTS Integration**: Audio responses not yet implemented (to be added)
- **WebSocket**: Real-time streaming not yet implemented
- **Word Highlighting**: TTS word-level highlighting not yet available

## Next Steps for Development

The following integrations need to be completed:

1. **ASR Service**: Connect to Google Speech-to-Text, Deepgram, or Whisper
2. **TTS Service**: Connect to ElevenLabs, AWS Polly, or Azure TTS
3. **WebSocket**: Implement for real-time transcription streaming
4. **Backend Routes**: Add voice-specific endpoints to Flask backend
5. **Testing**: Comprehensive browser and device testing

## Privacy & Security

- Microphone access is only active while recording
- Audio is transmitted securely over HTTPS
- Transcripts are processed through your existing account
- No audio is stored without explicit consent

## Getting Help

If you encounter issues:
1. Check browser console for errors (F12 → Console tab)
2. Verify microphone permissions
3. Try a different browser
4. Check network connectivity
5. Review the full documentation: `VOICE_CHAT_DOCUMENTATION.md`

## For Developers

See the full technical documentation in:
- `VOICE_CHAT_DOCUMENTATION.md` - Complete implementation guide
- `components/voice/` - React components
- `pages/api/voice/` - API endpoints
- `pages/voice.tsx` - Main page implementation

### Local Development
```bash
cd web
npm install
npm run dev
# Visit http://localhost:3000/voice
```

### Integration Tasks
1. Replace mock ASR in `/api/voice/transcribe.ts`
2. Add TTS generation in `/api/voice/chat.ts`
3. Connect to real backend endpoints
4. Test with actual microphone input
5. Implement subscription gating if needed

---

**Status**: ✅ Core implementation complete, ready for service integrations
**Version**: 1.0.0-dev
**Last Updated**: November 2024
