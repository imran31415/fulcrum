# Fulcrum Text Analysis Makefile

.PHONY: all build run dev clean kill help

# Default target
all: kill build run

# Build the Go binary
build:
	@echo "Building fulcrum..."
	go build -o fulcrum main.go

# Kill any existing processes on port 8080
kill:
	@echo "Checking for existing processes on port 8080..."
	@PID=$$(lsof -t -i:8080 2>/dev/null); \
	if [ ! -z "$$PID" ]; then \
		echo "Killing existing process on port 8080 (PID: $$PID)"; \
		kill -9 $$PID; \
		sleep 1; \
	else \
		echo "No existing processes found on port 8080"; \
	fi

# Run the built binary
run: kill
	@echo "Starting fulcrum..."
	./fulcrum

# Development mode - run with go run (auto-rebuild)
dev: kill
	@echo "Starting fulcrum in development mode..."
	go run main.go

# Start both frontend and backend (same as run since it's a single binary serving both)
start: kill build run

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f fulcrum
	go clean

# Test the application
test:
	@echo "Running tests..."
	go test ./...

# Help
help:
	@echo "Available targets:"
	@echo "  all     - Kill existing processes, build, and run"
	@echo "  build   - Build the Go binary"
	@echo "  run     - Kill existing processes and run the built binary"
	@echo "  dev     - Kill existing processes and run with 'go run' (development mode)"
	@echo "  start   - Alias for 'all' (kill, build, run)"
	@echo "  kill    - Kill any existing processes on port 8080"
	@echo "  clean   - Clean build artifacts"
	@echo "  test    - Run tests"
	@echo "  help    - Show this help message"