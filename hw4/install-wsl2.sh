#!/bin/bash

# WSL2 Environment Setup Script for Rental Platform System
# This script handles the specific requirements for running the project in WSL2

echo "Setting up Rental Platform System for WSL2 environment..."

# Check if we're actually in WSL2
if ! grep -q "microsoft" /proc/version 2>/dev/null; then
    echo "This script is designed for WSL2 environment."
    echo "If you're not using WSL2, please use ./setup.sh instead."
    exit 1
fi

echo "WSL2 environment detected."

# Update package list
echo "Updating package list..."
sudo apt-get update -qq

# Install essential build tools
echo "Installing build tools..."
sudo apt-get install -y build-essential python3-dev python3-pip

# Install additional tools that might be needed
echo "Installing additional development tools..."
sudo apt-get install -y curl wget git

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Upgrading Node.js to version 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js version: $(node -v)"

# Setup backend with WSL2-specific flags
echo "Setting up backend with WSL2 compatibility..."
cd backend

# Clean any existing node_modules
if [ -d "node_modules" ]; then
    echo "Cleaning existing node_modules..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies with WSL2-specific flags
echo "Installing backend dependencies..."
npm install --build-from-source --sqlite=/usr

# Copy environment variables file
if [ ! -f .env ]; then
    echo "Creating backend environment variables file..."
    cp env.example .env
    echo "Please edit backend/.env file and add your Google Maps API Key"
fi

# Initialize database
echo "Initializing database..."
npm run init-db

# Generate test data
echo "Generating test data..."
npm run generate-taiwan

# Generate reviewer users
echo "Generating reviewer users..."
npm run generate-reviewers

# Add rating data
echo "Adding rating data..."
npm run add-ratings

echo "Backend setup completed"

# Setup frontend
echo "Setting up frontend..."
cd ../frontend

# Clean any existing node_modules
if [ -d "node_modules" ]; then
    echo "Cleaning existing node_modules..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Copy environment variables file
if [ ! -f .env ]; then
    echo "Creating frontend environment variables file..."
    cp env.example .env
    echo "Please edit frontend/.env file and add your Google Maps API Key"
fi

# Install shadcn/ui components
echo "Installing UI components..."
npx shadcn-ui@latest init --yes
npx shadcn-ui@latest add button input label card alert dialog tabs select textarea slider checkbox table dropdown-menu separator scroll-area tooltip badge popover alert-dialog --yes

echo "Frontend setup completed"

echo ""
echo "WSL2 setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and frontend/.env files"
echo "2. Replace 'your_google_maps_api_key_here' with your Google Maps API Key"
echo "3. Start the system: ./start.sh"
echo ""
echo "System will run at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:3000"
echo ""
echo "Important notes for WSL2:"
echo "   - Make sure Windows Defender allows Node.js processes"
echo "   - If you encounter permission issues, run: sudo chown -R \$USER:\$USER ."
echo "   - For better performance, consider running the project in Windows directly"
