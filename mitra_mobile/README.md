# Mitra Mobile App 👋

This is the **main mobile application** for the Arya/Mitra project, built with [Expo](https://expo.dev) and React Native.

## ⚠️ Important: Repository Structure

This repository contains two main folders:

- **`mitra_mobile/` (this folder)** - The active mobile app development workspace ⭐
- **`frontend_reference/`** - Reference website code for understanding features 📚

**For development, always work here in `mitra_mobile/`.** The `frontend_reference/` folder contains the original website code that serves as a reference for what features to build in the mobile app. See [../README.md](../README.md) for complete repository documentation.

## Get started

1. **Environment Setup** (Required First Step)

   Set up your Firebase and environment variables:
   - See [SETUP.md](./SETUP.md) for general setup instructions
   - For **Web platform**, see [WEB_ENV_CONFIG.md](./WEB_ENV_CONFIG.md)
   - For **Mobile platforms**, see [ENV_CONFIG.md](./ENV_CONFIG.md)

2. Install dependencies

   ```bash
   npm install
   ```

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Reference Materials

**Need to understand what features to build?** Check the `../frontend_reference/` folder, which contains the original website code. Use it as a reference to understand requirements and implement equivalent features in this mobile app.

See [../frontend_reference/README.md](../frontend_reference/README.md) for details on how to use the reference materials effectively.

## Docker & Deployment

**Do you need Docker for this project?** Probably not! See [DOCKER_AUDIT.md](./DOCKER_AUDIT.md) for a comprehensive analysis.

**TL;DR:**
- For development: Use `npx expo start` (no Docker needed)
- For mobile builds: Use EAS Build (cloud service)
- For web deployment: Docker optional but can be useful

### Docker Usage (Optional)

If you choose to use Docker for web deployment or standardized development environments:

#### Production Web Build

Build and run the production web version:

```bash
# Build the Docker image
docker build -t mitra-mobile-web .

# Run the container
docker run -p 3000:80 mitra-mobile-web

# Or use docker-compose
docker-compose up mitra-mobile-web
```

The web app will be available at `http://localhost:3000`

#### Development Environment

Run the development server in Docker:

```bash
# Start development environment
docker-compose up mitra-mobile-dev

# Access Expo DevTools at http://localhost:19002
```

**Note:** For the build to succeed, ensure you have proper Firebase credentials configured. The Docker setup includes:
- `Dockerfile` - Multi-stage build for production web deployment
- `Dockerfile.dev` - Development environment
- `docker-compose.yml` - Orchestration for both environments
- `.dockerignore` - Excludes unnecessary files from Docker context
- `nginx.conf` - Production web server configuration

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
