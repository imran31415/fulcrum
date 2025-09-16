#!/bin/bash

# Build and Deploy script for Fulcrum application
# This script builds the Docker image and deploys to Kubernetes

set -e

# Configuration
REGISTRY="registry.digitalocean.com/resourceloop"
IMAGE_NAME="fulcrum"
TAG="${1:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🚀 Fulcrum Build & Deploy Script"
echo "================================"

# Step 1: Build WASM module
echo "📦 Building WASM module..."
cd ../wasm
bash build.sh
cd ..

# Step 2: Build Docker image
echo "🐳 Building Docker image..."
docker build -t ${IMAGE_NAME}:${TAG} .
docker tag ${IMAGE_NAME}:${TAG} ${FULL_IMAGE}

# Step 3: Push to registry
echo "📤 Pushing to registry..."
docker push ${FULL_IMAGE}

# Step 4: Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
cd k8

# Apply the manifests using kustomize
kubectl apply -k .

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/fulcrum-app -n fulcrum --timeout=300s

# Get the service info
echo "✅ Deployment complete!"
echo ""
echo "📊 Deployment Status:"
kubectl get pods -n fulcrum -l app=fulcrum
echo ""
echo "🌐 Access your application at: https://fulcrum.scalebase.io"
echo ""
echo "📝 To check logs:"
echo "kubectl logs -f deployment/fulcrum-app -n fulcrum"
echo ""
echo "🔍 To check ingress status:"
kubectl get ingress -n fulcrum