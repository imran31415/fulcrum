#!/bin/bash

# Kill any existing process on port 8080
echo "Checking for existing processes on port 8080..."
PID=$(lsof -t -i:8080)
if [ ! -z "$PID" ]; then
    echo "Killing existing process on port 8080 (PID: $PID)"
    kill -9 $PID
    sleep 1
fi

# Start fulcrum
echo "Starting fulcrum..."
exec ./fulcrum