#!/bin/bash

# Rental Platform System Quick Start Script

echo "Starting Rental Platform System..."

# Check environment variables files
if [ ! -f backend/.env ]; then
    echo "Error: Backend environment variables file does not exist"
    echo "Please run ./setup.sh first for initial setup"
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "Error: Frontend environment variables file does not exist"
    echo "Please run ./setup.sh first for initial setup"
    exit 1
fi

# Check if API Key has been set
if grep -q "your_google_maps_api_key_here" backend/.env; then
    echo "Warning: Backend API Key not set"
    echo "Please edit backend/.env file and replace 'your_google_maps_api_key_here' with your Google Maps API Key"
fi

if grep -q "your_google_maps_api_key_here" frontend/.env; then
    echo "Warning: Frontend API Key not set"
    echo "Please edit frontend/.env file and replace 'your_google_maps_api_key_here' with your Google Maps API Key"
fi

# Start backend
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "System startup completed!"
echo ""
echo "Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:3000"
echo ""
echo "System features:"
echo "   - Property browsing and search"
echo "   - Map interaction"
echo "   - User registration and login"
echo "   - Property management"
echo "   - Favorites and ratings"
echo ""
echo "Stop system: Press Ctrl+C"

# Wait for user interrupt
trap "echo 'Stopping system...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
