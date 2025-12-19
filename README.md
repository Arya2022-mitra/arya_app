# Arya App - Mobile Application Repository

Welcome to the Arya App repository! This repository contains the mobile application development workspace and reference materials.

## 📁 Repository Structure

This repository is organized into two main directories:

### 1. `mitra_mobile/` - **Main Mobile Application** ⭐

**This is the active development folder for the mobile app.**

- **Technology:** React Native with Expo
- **Platforms:** iOS, Android, Web
- **Language:** TypeScript
- **Purpose:** The actual mobile application being developed

**Key Files:**
- `README.md` - Getting started guide for the mobile app
- `SETUP.md` - Detailed setup instructions
- `DOCKER_AUDIT.md` - Comprehensive Docker analysis and recommendations

**To start developing:**
```bash
cd mitra_mobile
npm install
npx expo start
```

👉 **See [mitra_mobile/README.md](./mitra_mobile/README.md) for complete documentation**

---

### 2. `frontend_reference/` - **Reference Website Code** 📚

**⚠️ IMPORTANT: This folder is REFERENCE ONLY - Do NOT modify or use for deployment**

**Purpose:** Contains the original website codebase that serves as a reference for building the mobile app

**What's inside:**
- Complete Next.js website implementation
- UI/UX components to replicate in the mobile app
- Business logic and features to port to React Native
- Design patterns and architecture examples

**How to use:**
- 📖 **Read** the code to understand features and functionality
- 🎨 **Reference** UI designs and component structures
- 🔍 **Analyze** business logic to implement in the mobile app
- ✨ **Replicate** features in the mobile application

**DO NOT:**
- ❌ Deploy this folder as a production website
- ❌ Make modifications to this reference code
- ❌ Use it as the primary development workspace
- ❌ Confuse it with the mobile app development

👉 **See [frontend_reference/README.md](./frontend_reference/README.md) for more details**

---

## 🚀 Quick Start Guide

### For Developers (Human or AI Agents)

1. **Primary Workspace:** Always work in `mitra_mobile/` for mobile app development
2. **Reference Material:** Use `frontend_reference/` to understand what features to build
3. **Documentation:** Refer to `mitra_mobile/DOCKER_AUDIT.md` for Docker-related decisions

### Workflow

```bash
# 1. Clone the repository (if not already done)
git clone <repository-url>

# 2. Navigate to the mobile app directory
cd mitra_mobile

# 3. Install dependencies
npm install

# 4. Start development
npx expo start
```

---

## 📋 Key Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Mobile App README | [`mitra_mobile/README.md`](./mitra_mobile/README.md) | Getting started with the mobile app |
| Setup Guide | [`mitra_mobile/SETUP.md`](./mitra_mobile/SETUP.md) | Detailed setup instructions |
| Docker Analysis | [`mitra_mobile/DOCKER_AUDIT.md`](./mitra_mobile/DOCKER_AUDIT.md) | Docker usage recommendations |
| Reference Code Info | [`frontend_reference/README.md`](./frontend_reference/README.md) | How to use reference materials |
| Web Reference Setup | [`frontend_reference/web/SETUP.md`](./frontend_reference/web/SETUP.md) | Reference web app setup (for context only) |

---

## 🎯 Development Guidelines

### For AI Agents and Developers

When working on this repository, please follow these guidelines:

1. **Active Development Location**
   - All mobile app development happens in `mitra_mobile/`
   - Do not modify files in `frontend_reference/`

2. **Using Reference Materials**
   - Browse `frontend_reference/` to understand features
   - Implement equivalent features in `mitra_mobile/` using React Native
   - Maintain design consistency while adapting for mobile

3. **Docker Usage**
   - Refer to `mitra_mobile/DOCKER_AUDIT.md` for Docker decisions
   - Docker is optional for this project (see audit for details)
   - Use native Expo tooling for most development tasks

4. **Code Organization**
   - Follow the existing structure in `mitra_mobile/`
   - Use TypeScript for type safety
   - Follow Expo and React Native best practices

---

## 🏗️ Architecture Overview

### Mobile App (`mitra_mobile/`)

```
mitra_mobile/
├── app/              # Main application code (Expo Router)
│   ├── components/   # Reusable UI components
│   ├── screens/      # Screen components
│   └── ...
├── assets/           # Images, fonts, icons
├── lib/              # Utility libraries and API clients
├── shared/           # Shared contexts and providers
└── types/            # TypeScript type definitions
```

### Reference Website (`frontend_reference/`)

```
frontend_reference/
└── web/             # Next.js web application
    ├── components/  # Web UI components (reference)
    ├── pages/       # Web pages (reference)
    └── ...
```

---

## 🔧 Technology Stack

### Mobile App
- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **Auth:** Firebase Authentication
- **State:** React Context
- **Backend:** Railway.app hosted API

### Reference Website
- **Framework:** Next.js
- **Language:** TypeScript / JavaScript
- **Purpose:** Reference implementation only

---

## 📞 Support & Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/router/introduction/)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## ⚠️ Important Notes

### For Human Developers
- The main development happens in `mitra_mobile/`
- The `frontend_reference/` is for understanding requirements only
- Do not deploy or modify the reference code

### For AI Agents
- Primary workspace: `mitra_mobile/`
- Reference materials: `frontend_reference/`
- Docker information: `mitra_mobile/DOCKER_AUDIT.md`
- Always work in the mobile app directory for code changes
- Use reference code to understand what to build, not where to build it

---

## 📝 License

[Add your license information here]

---

**Last Updated:** December 19, 2025
