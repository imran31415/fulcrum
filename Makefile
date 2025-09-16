# Fulcrum - React Native/Expo Development Makefile

.PHONY: help install run run-android run-ios run-web build clean lint format test doctor

# Default target
.DEFAULT_GOAL := help

## Development Commands
help: ## Show this help message
	@echo "Fulcrum - React Native/Expo Development"
	@echo "======================================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies using yarn
	@echo "Installing dependencies..."
	yarn install

run: ## Start the Expo development server on port 8084 (default for local dev)
	@echo "Starting Expo development server on port 8084..."
	PORT=8084 npx expo start --port 8084

run-android: ## Run the app on Android device/emulator (port 8084)
	@echo "Starting app on Android (port 8084)..."
	PORT=8084 npx expo start --android --port 8084

run-ios: ## Run the app on iOS simulator (macOS only, port 8084)
	@echo "Starting app on iOS simulator (port 8084)..."
	PORT=8084 npx expo start --ios --port 8084

run-web: ## Run the app in web browser on port 8084
	@echo "Starting app in web browser on port 8084..."
	PORT=8084 npx expo start --web --port 8084

## Build Commands
build: ## Build the app for production (placeholder for future use)
	@echo "Building app for production..."
	@echo "Note: Add specific build commands when needed (e.g., EAS Build)"

## WASM Build Commands
wasm-build: ## Build the WASM module from Go source and update wasmData.js
	@echo "Building WASM module and updating embedded data..."
	cd wasm && bash build.sh
	@echo "✅ WASM build complete"
	@echo "📦 wasmData.js updated with new WASM"

wasm-clean: ## Clean and rebuild WASM module
	@echo "Cleaning WASM build..."
	rm -f public/main.wasm
	$(MAKE) wasm-build

wasm-test: ## Test WASM build locally
	@echo "Testing WASM module..."
	cd wasm && go test ./...

wasm-dev: wasm-build ## Build WASM and start dev server on port 8084
	@echo "WASM built, starting dev server on port 8084..."
	$(MAKE) run

## Development Tools
clean: ## Clean node_modules and reinstall dependencies
	@echo "Cleaning node_modules and yarn cache..."
	rm -rf node_modules
	yarn cache clean
	yarn install

lint: ## Run linting (when ESLint is added)
	@echo "Linting code..."
	@if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then \
		yarn lint; \
	else \
		echo "ESLint not configured yet. Consider adding ESLint to your project."; \
	fi

format: ## Format code (when Prettier is added)
	@echo "Formatting code..."
	@if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ]; then \
		yarn format; \
	else \
		echo "Prettier not configured yet. Consider adding Prettier to your project."; \
	fi

test: ## Run tests (when testing is set up)
	@echo "Running tests..."
	@if [ -f "jest.config.js" ] || grep -q "jest" package.json; then \
		yarn test; \
	else \
		echo "Testing not configured yet. Consider adding Jest or another testing framework."; \
	fi

doctor: ## Check development environment setup
	@echo "Checking development environment..."
	@echo "Node.js version: $$(node --version)"
	@echo "Yarn version: $$(yarn --version)"
	@echo "Expo CLI: $$(expo --version 2>/dev/null || echo 'Not found globally, using local version')"
	@echo ""
	@echo "Checking for common development tools..."
	@which watchman >/dev/null 2>&1 && echo "✅ Watchman installed" || echo "⚠️  Watchman not found (recommended for React Native)"
	@which xcode-select >/dev/null 2>&1 && echo "✅ Xcode tools available" || echo "⚠️  Xcode tools not found (needed for iOS development)"

## Git hooks (optional)
setup-hooks: ## Set up git hooks (when pre-commit hooks are needed)
	@echo "Setting up git hooks..."
	@echo "Consider adding husky or similar for pre-commit hooks"

## Environment setup
setup-env: ## Set up development environment file
	@echo "Setting up environment configuration..."
	@if [ ! -f ".env.local" ]; then \
		echo "# Local environment variables" > .env.local; \
		echo "# Add your local development variables here" >> .env.local; \
		echo "Created .env.local file"; \
	else \
		echo ".env.local already exists"; \
	fi

## Info
info: ## Show project information
	@echo "Project: $$(grep -o '"name": "[^"]*' package.json | cut -d'"' -f4)"
	@echo "Version: $$(grep -o '"version": "[^"]*' package.json | cut -d'"' -f4)"
	@echo "Expo SDK: $$(grep -o '"expo": "[^"]*' package.json | cut -d'"' -f4)"
	@echo "React Native: $$(grep -o '"react-native": "[^"]*' package.json | cut -d'"' -f4)"

#################################
## DEPLOYMENT COMMANDS         ##
#################################

# Deployment Configuration
APP_NAME := fulcrum
REGISTRY := registry.digitalocean.com/resourceloop
IMAGE_NAME := $(REGISTRY)/$(APP_NAME)
NAMESPACE := fulcrum
KUSTOMIZE_DIR := k8

# Git-based versioning for deployment
GIT_COMMIT := $(shell git rev-parse --short HEAD)
GIT_BRANCH := $(shell git rev-parse --abbrev-ref HEAD)
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)

# Image tags
TAG_LATEST := latest
TAG_GIT := $(GIT_COMMIT)
TAG_TIMESTAMP := $(GIT_BRANCH)-$(TIMESTAMP)

# Colors for deployment output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

## Docker & Kubernetes Deployment
docker-build: ## Build multi-architecture Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	@echo "Tags: $(TAG_LATEST), $(TAG_GIT), $(TAG_TIMESTAMP)"
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-t $(IMAGE_NAME):$(TAG_LATEST) \
		-t $(IMAGE_NAME):$(TAG_GIT) \
		-t $(IMAGE_NAME):$(TAG_TIMESTAMP) \
		.
	@echo "$(GREEN)✅ Docker build complete$(NC)"

docker-push: ## Push Docker image to DigitalOcean registry
	@echo "$(GREEN)Logging into DigitalOcean registry...$(NC)"
	doctl registry login
	@echo "$(GREEN)Pushing Docker images...$(NC)"
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-t $(IMAGE_NAME):$(TAG_LATEST) \
		-t $(IMAGE_NAME):$(TAG_GIT) \
		-t $(IMAGE_NAME):$(TAG_TIMESTAMP) \
		--push .
	@echo "$(GREEN)✅ Push complete$(NC)"
	@echo "Images pushed:"
	@echo "  - $(IMAGE_NAME):$(TAG_LATEST)"
	@echo "  - $(IMAGE_NAME):$(TAG_GIT)"
	@echo "  - $(IMAGE_NAME):$(TAG_TIMESTAMP)"

deploy: docker-build docker-push k8s-apply ## 🚀 Full deployment: build, push, and deploy to Kubernetes
	@echo "$(GREEN)🎉 Deployment complete!$(NC)"
	@echo "$(BLUE)Application URL: https://fulcrum.scalebase.io$(NC)"
	@echo "$(BLUE)Health check: https://fulcrum.scalebase.io/health$(NC)"

deploy-fast: docker-push-latest k8s-restart ## ⚡ Fast deployment using existing build
	@echo "$(GREEN)🚀 Fast deployment complete!$(NC)"

docker-push-latest: ## Push only the latest tag (faster)
	@echo "$(GREEN)Pushing latest tag...$(NC)"
	doctl registry login
	docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-t $(IMAGE_NAME):$(TAG_LATEST) \
		--push .

k8s-apply: ## Apply Kubernetes manifests
	@echo "$(GREEN)Applying Kubernetes manifests...$(NC)"
	kubectl apply -k $(KUSTOMIZE_DIR)/
	@echo "$(GREEN)Waiting for deployment rollout...$(NC)"
	kubectl -n $(NAMESPACE) rollout status deployment/$(APP_NAME)-app --timeout=300s
	@echo "$(GREEN)✅ Kubernetes deployment complete$(NC)"

k8s-restart: ## Restart Kubernetes deployment
	@echo "$(GREEN)Restarting deployment...$(NC)"
	kubectl -n $(NAMESPACE) rollout restart deployment/$(APP_NAME)-app
	kubectl -n $(NAMESPACE) rollout status deployment/$(APP_NAME)-app --timeout=300s
	@echo "$(GREEN)✅ Restart complete$(NC)"

k8s-rollback: ## Rollback to previous deployment
	@echo "$(YELLOW)Rolling back deployment...$(NC)"
	kubectl -n $(NAMESPACE) rollout undo deployment/$(APP_NAME)-app
	kubectl -n $(NAMESPACE) rollout status deployment/$(APP_NAME)-app --timeout=300s
	@echo "$(GREEN)✅ Rollback complete$(NC)"

k8s-status: ## Show Kubernetes deployment status
	@echo "$(GREEN)=== Deployment Status ===$(NC)"
	@echo "$(YELLOW)Pods:$(NC)"
	kubectl -n $(NAMESPACE) get pods -l app=$(APP_NAME)
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	kubectl -n $(NAMESPACE) get svc
	@echo ""
	@echo "$(YELLOW)Ingress:$(NC)"
	kubectl -n $(NAMESPACE) get ingress
	@echo ""
	@echo "$(YELLOW)HPA:$(NC)"
	kubectl -n $(NAMESPACE) get hpa

k8s-logs: ## Show application logs
	@echo "$(GREEN)Recent application logs:$(NC)"
	kubectl -n $(NAMESPACE) logs -l app=$(APP_NAME) --tail=100

k8s-logs-follow: ## Follow application logs in real-time
	@echo "$(GREEN)Following logs (Ctrl+C to exit)...$(NC)"
	kubectl -n $(NAMESPACE) logs -l app=$(APP_NAME) --tail=100 -f

k8s-shell: ## Get shell access to running pod
	@POD_NAME=$$(kubectl -n $(NAMESPACE) get pods -l app=$(APP_NAME) -o jsonpath='{.items[0].metadata.name}'); \
	echo "$(GREEN)Connecting to pod: $$POD_NAME$(NC)"; \
	kubectl -n $(NAMESPACE) exec -it $$POD_NAME -- /bin/sh

## Testing deployment
test-local-docker: ## Build and test Docker image locally
	@echo "$(GREEN)Building local test image...$(NC)"
	docker build -t $(APP_NAME):test .
	@echo "$(GREEN)Running local test container...$(NC)"
	docker run -d --name $(APP_NAME)-test -p 8080:80 $(APP_NAME):test
	@sleep 5
	@if curl -f http://localhost:8080/health >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Local health check passed$(NC)"; \
	else \
		echo "$(RED)❌ Local health check failed$(NC)"; \
	fi
	@docker stop $(APP_NAME)-test && docker rm $(APP_NAME)-test
	@docker rmi $(APP_NAME):test

test-production: ## Test production deployment
	@echo "$(GREEN)Testing production deployment...$(NC)"
	@if curl -f https://fulcrum.scalebase.io/health >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Production health check passed$(NC)"; \
	else \
		echo "$(RED)❌ Production health check failed$(NC)"; \
		exit 1; \
	fi
	@if curl -f -I https://fulcrum.scalebase.io >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Main application accessible$(NC)"; \
	else \
		echo "$(RED)❌ Main application not accessible$(NC)"; \
		exit 1; \
	fi

## Setup commands
setup-k8s-secrets: ## Create registry secret (one-time setup)
	@echo "$(GREEN)Setting up registry secret...$(NC)"
	kubectl get namespace $(NAMESPACE) || kubectl create namespace $(NAMESPACE)
	@if kubectl -n $(NAMESPACE) get secret digitalocean-registry >/dev/null 2>&1; then \
		echo "$(YELLOW)Registry secret already exists$(NC)"; \
	else \
		echo "$(GREEN)Copying registry secret from gorph namespace...$(NC)"; \
		kubectl get secret umi-backend -n gorph -o yaml | \
		sed 's/namespace: gorph/namespace: $(NAMESPACE)/' | \
		sed 's/name: umi-backend/name: digitalocean-registry/' | \
		kubectl apply -f -; \
	fi
	@echo "$(GREEN)✅ Registry secret ready$(NC)"

## Information commands
deployment-info: ## Show deployment configuration
	@echo "$(GREEN)=== Deployment Information ===$(NC)"
	@echo "App Name: $(APP_NAME)"
	@echo "Registry: $(REGISTRY)"
	@echo "Image: $(IMAGE_NAME)"
	@echo "Namespace: $(NAMESPACE)"
	@echo "Git Commit: $(GIT_COMMIT)"
	@echo "Git Branch: $(GIT_BRANCH)"
	@echo "Timestamp: $(TIMESTAMP)"
	@echo ""
	@echo "$(YELLOW)Image Tags:$(NC)"
	@echo "  - $(TAG_LATEST)"
	@echo "  - $(TAG_GIT)"
	@echo "  - $(TAG_TIMESTAMP)"

k8s-context: ## Show current kubectl context
	@echo "$(GREEN)Current Kubernetes context:$(NC)"
	kubectl config current-context

clean-docker: ## Clean up local Docker images
	@echo "$(YELLOW)Cleaning up local Docker images...$(NC)"
	docker rmi $(IMAGE_NAME):$(TAG_LATEST) 2>/dev/null || true
	docker system prune -f
	@echo "$(GREEN)✅ Docker cleanup complete$(NC)"
