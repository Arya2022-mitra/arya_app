# React Error Debugging Guide

## Overview
This guide helps developers debug React errors and common issues in the MitraVeda application.

## Debugging React Errors (423/418/425)

### Option 1: Use React Error Decoder
When you see a minified React error in production (e.g., "Minified React error #423"), open the decoder link shown in the console. The link contains the invariant number and shows the full error message.

Example: https://reactjs.org/docs/error-decoder.html?invariant=423

### Option 2: Run Development Build
```bash
cd web
npm run dev
```

In development mode, React shows:
- Full error messages (not minified)
- Component stack traces pointing to specific files and line numbers
- More actionable debugging information

## Common Issues and Solutions

### 1. Video Autoplay Errors
**Problem**: Uncaught promise rejection from `video.play()`

**Solution**: All `video.play()` calls now include `.catch()` handlers:
```typescript
const playPromise = video.play();
if (playPromise !== undefined) {
  playPromise.catch((error) => {
    // Handle autoplay blocked error
  });
}
```

**Files Fixed**:
- `web/components/SecureAutoPlayVideo.tsx`
- `web/pages/process_profile.tsx`

### 2. API Response Validation (422 Errors)
**Problem**: Server returns 422 status due to validation errors

**Debugging Steps**:
1. Open browser DevTools Network tab
2. Find the failing request
3. Check the Response tab for JSON error details
4. Verify the request payload matches server expectations

**Solution**: Added defensive checks for API responses:
- Check if response data is an array before mapping
- Use nullish coalescing (`??`) for optional fields
- Validate required fields exist before accessing

**Files Fixed**:
- `web/pages/add_profile.tsx` - City suggestions API
- `web/pages/process_profile.tsx` - Profile creation API

### 3. Unguarded Property Access
**Problem**: Runtime errors from accessing properties on undefined/null objects

**Solution**: Use optional chaining and nullish coalescing:
```typescript
// Before
const city = item.city;

// After
const city = item?.city ?? '';
```

## Error Boundary

An ErrorBoundary component has been added to catch React errors and prevent total app failure.

**Location**: `web/components/ErrorBoundary.tsx`

**Features**:
- Catches errors in child components
- Displays user-friendly error message
- Shows detailed error info in development mode
- Provides "Try Again" and "Go Home" buttons
- Logs errors to console for debugging

**Usage**:
The ErrorBoundary is already wrapping the entire app in `_app.tsx`. You can also wrap specific components:

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Development Workflow

### 1. Before Making Changes
```bash
# Check current build status
cd web
npm run build

# Run linter
npm run lint
```

### 2. During Development
```bash
# Run dev server with hot reload
npm run dev

# Monitor console for errors
# Check browser DevTools for network issues
```

### 3. Before Committing
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Build to verify no regressions
npm run build
```

## Debugging Tips

### Inspect Component Stack
In dev mode, React errors show the component stack. Look for:
- Your application frames (not React internals)
- The first component in your code that triggered the error
- Components like `AddProfile`, `ProcessProfile`, etc.

### Check Network Responses
For API errors:
1. Open DevTools → Network tab
2. Filter by XHR/Fetch
3. Look for failed requests (red status codes)
4. Check Response and Preview tabs for error details

### Console Logging
Strategic console.log statements added in:
- `add_profile.tsx` - Line 221, 474 (profile form submission)
- Component mount/unmount lifecycle
- API request/response flow

### Media Playback Issues
If videos don't autoplay:
- Check browser autoplay policy (requires muted or user interaction)
- Look for console messages about autoplay being blocked
- Verify user has interacted with the page
- All errors are now caught and logged in development mode

## File Change Summary

### New Files
- `web/components/ErrorBoundary.tsx` - Global error boundary component

### Modified Files
- `web/pages/_app.tsx` - Added ErrorBoundary wrapper
- `web/components/SecureAutoPlayVideo.tsx` - Fixed video.play() promises
- `web/pages/process_profile.tsx` - Fixed video.play() promises, improved API error handling
- `web/pages/add_profile.tsx` - Added defensive checks for API responses

## Testing Checklist

- [x] Build completes successfully
- [x] No ESLint errors or warnings
- [x] All video.play() calls have .catch() handlers
- [x] ErrorBoundary catches and displays errors
- [x] API response parsing includes defensive checks
- [ ] Manual testing in dev mode
- [ ] Verify error messages in production build

## Next Steps for Manual Testing

1. Run `npm run dev` and test profile creation flow
2. Simulate API errors to verify ErrorBoundary
3. Test video playback on different browsers
4. Verify mobile responsiveness
5. Check console for any remaining warnings
