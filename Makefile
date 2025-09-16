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

run: ## Start the Expo development server (default for local dev)
	@echo "Starting Expo development server..."
	yarn start

run-android: ## Run the app on Android device/emulator
	@echo "Starting app on Android..."
	yarn android

run-ios: ## Run the app on iOS simulator (macOS only)
	@echo "Starting app on iOS simulator..."
	yarn ios

run-web: ## Run the app in web browser
	@echo "Starting app in web browser..."
	yarn web

## Build Commands
build: ## Build the app for production (placeholder for future use)
	@echo "Building app for production..."
	@echo "Note: Add specific build commands when needed (e.g., EAS Build)"

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