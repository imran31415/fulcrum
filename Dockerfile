# Multi-stage build for Fulcrum application

# Stage 1: Build the Go WASM module
FROM golang:1.21-alpine AS wasm-builder

WORKDIR /app

# Copy wasm directory
COPY wasm/ ./wasm/

# Build the WASM module
WORKDIR /app/wasm
RUN GOOS=js GOARCH=wasm go build -o build/main.wasm src/main.go

# Stage 2: Build the React/Expo web application
FROM node:20-alpine AS web-builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application source
COPY . .

# Copy WASM build from previous stage
COPY --from=wasm-builder /app/wasm/build/main.wasm ./public/main.wasm

# Copy wasm_exec.js (Go's WASM support file)
COPY --from=wasm-builder /usr/local/go/misc/wasm/wasm_exec.js ./src/wasm/

# Build the web application
RUN yarn expo export --platform web

# Stage 3: Production image with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=web-builder /app/dist /usr/share/nginx/html

# Copy WASM files to public directory
COPY --from=web-builder /app/public/main.wasm /usr/share/nginx/html/main.wasm
COPY --from=web-builder /app/src/wasm/wasm_exec.js /usr/share/nginx/html/wasm_exec.js

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]