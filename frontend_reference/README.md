# Frontend Reference - Reference Materials Only

⚠️ **IMPORTANT: THIS FOLDER IS FOR REFERENCE PURPOSES ONLY**

## Purpose

This folder contains the **original website codebase** that serves as a reference for building the mobile application. It is **NOT** meant to be used for deployment or active development.

## What This Folder Contains

The `web/` directory contains a complete Next.js website implementation with:

- ✅ Complete UI/UX components and designs
- ✅ Business logic and feature implementations
- ✅ API integration patterns
- ✅ Authentication flows
- ✅ State management examples
- ✅ Design patterns and architecture

## How to Use This Reference

### ✅ DO:

1. **Study the Code**
   - Read through components to understand functionality
   - Analyze the UI/UX design patterns
   - Review business logic and workflows

2. **Extract Requirements**
   - Identify features to implement in the mobile app
   - Understand data structures and API contracts
   - Learn the user flows and navigation patterns

3. **Reference Designs**
   - Use as a guide for mobile app UI design
   - Maintain consistency in user experience
   - Adapt web patterns to mobile conventions

4. **Understand Architecture**
   - See how components are structured
   - Learn the state management approach
   - Understand authentication patterns

### ❌ DO NOT:

1. **Deploy This Code**
   - This is not the production website
   - It's not maintained for deployment
   - Use only as a reference guide

2. **Modify This Code**
   - Changes here won't affect the mobile app
   - This is not the active development workspace
   - Keep it intact as a reference

3. **Confuse with Mobile App**
   - This is a Next.js website, NOT React Native
   - Mobile development happens in `mitra_mobile/`
   - This folder serves informational purposes only

4. **Use for Active Development**
   - All new features go in `mitra_mobile/`
   - This code is frozen as reference material
   - Don't waste time updating reference code

## Structure

```
frontend_reference/
└── web/                    # Next.js website (REFERENCE ONLY)
    ├── components/         # Web UI components - study these for mobile app design
    ├── pages/              # Web pages - understand features to build
    ├── lib/                # Utilities - see patterns to adapt
    ├── hooks/              # React hooks - learn logic patterns
    ├── state/              # State management - understand data flow
    ├── public/             # Static assets - reference for design
    └── SETUP.md            # Setup guide (for understanding only)
```

## Using This as a Reference for Mobile Development

When building features in the mobile app (`mitra_mobile/`), follow this workflow:

1. **Find the Feature**
   ```bash
   # Browse the reference code to find similar functionality
   cd frontend_reference/web
   # Look in components/, pages/, etc.
   ```

2. **Understand the Logic**
   - Read the component implementation
   - Note the props, state, and data flow
   - Identify API calls and data structures

3. **Implement in Mobile App**
   ```bash
   # Go to the mobile app directory
   cd ../../mitra_mobile
   
   # Create equivalent React Native component
   # Adapt web patterns to mobile conventions
   # Use React Native components instead of HTML
   ```

4. **Maintain Consistency**
   - Keep the same business logic
   - Adapt UI for mobile UX
   - Use similar naming conventions
   - Maintain data structure compatibility

## Example: Converting a Feature

### Reference Web Component (frontend_reference/web)
```typescript
// This is REFERENCE ONLY - don't modify
// File: frontend_reference/web/components/UserProfile.tsx

export function UserProfile({ user }) {
  return (
    <div className="profile-card">
      <img src={user.avatar} alt="Profile" />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### Mobile Implementation (mitra_mobile)
```typescript
// This is where you BUILD - implement here
// File: mitra_mobile/app/components/UserProfile.tsx

import { View, Image, Text, StyleSheet } from 'react-native';

export function UserProfile({ user }) {
  return (
    <View style={styles.profileCard}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: { padding: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  name: { fontSize: 20, fontWeight: 'bold' },
  email: { fontSize: 14, color: '#666' },
});
```

## Key Differences: Web vs Mobile

| Aspect | Reference Web (Next.js) | Mobile App (React Native) |
|--------|-------------------------|---------------------------|
| UI Elements | `<div>`, `<span>`, etc. | `<View>`, `<Text>`, etc. |
| Styling | CSS, Tailwind | StyleSheet, inline styles |
| Navigation | Next.js Router | Expo Router |
| Images | `<img>` tag | `<Image>` component |
| Input | `<input>` tag | `<TextInput>` component |
| Platform | Web browsers | iOS, Android, Web |
| Location | `frontend_reference/` | `mitra_mobile/` |

## Setup (For Understanding Only)

If you want to run the reference website locally to explore it interactively:

```bash
cd frontend_reference/web
npm install
npm run dev
```

⚠️ **Remember:** This is just to help you understand the features. All actual development should happen in `mitra_mobile/`.

## Important Reminders

### For Developers
- 📱 Build mobile app in `mitra_mobile/`
- 📚 Use this folder to understand requirements
- 🚫 Don't deploy or modify this reference code
- ✅ Replicate features in React Native, not copy web code

### For AI Agents
- 🎯 Primary development workspace: `mitra_mobile/`
- 📖 This folder provides context and requirements
- 🚫 Do NOT make code changes here
- ✅ Read and analyze, then implement in mobile app
- 🔍 Use this to understand what to build, not where to build it

## Questions?

- For mobile app development: See [`../mitra_mobile/README.md`](../mitra_mobile/README.md)
- For setup instructions: See [`../mitra_mobile/SETUP.md`](../mitra_mobile/SETUP.md)
- For Docker questions: See [`../mitra_mobile/DOCKER_AUDIT.md`](../mitra_mobile/DOCKER_AUDIT.md)
- For repository overview: See [`../README.md`](../README.md)

---

**Last Updated:** December 19, 2025

**Remember:** This is a reference library, not a development workspace! 📚
