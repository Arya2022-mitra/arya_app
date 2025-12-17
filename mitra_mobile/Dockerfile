# Stage 1: Build the Expo web application
FROM node:18-alpine AS builder

WORKDIR /app

# Install Expo CLI
RUN npm install -g expo-cli

# Copy package configuration files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the static web output
# The output will be in the /app/dist directory
RUN expo export -p web

# Stage 2: Serve the static files with a lightweight server
FROM node:18-alpine

WORKDIR /app

# Install a simple static server
RUN npm install -g serve

# Copy the build output from the builder stage
COPY --from=builder /app/dist .

# Expose port 8080 to the outside world
EXPOSE 8080

# Start the server
CMD ["serve", "-s", ".", "-l", "8080"]
