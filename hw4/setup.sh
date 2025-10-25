#!/bin/bash

# Rental Platform System Auto Setup Script
# This script will automatically set up frontend and backend environments and initialize the database

echo "Starting Rental Platform System Setup..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Error: Please install Node.js 18.0 or higher first"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version is too low, please upgrade to 18.0 or higher"
    exit 1
fi

echo "Node.js version check passed: $(node -v)"

# Setup backend
echo "Setting up backend..."
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

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
echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and frontend/.env files"
echo "2. Replace 'your_google_maps_api_key_here' with your Google Maps API Key"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "System will run at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:3000"
echo ""
echo "System includes:"
echo "   - 400 virtual listings (distributed across Taiwan)"
echo "   - 100 landlord users"
echo "   - 200 reviewer users"
echo "   - Complete rating and favorite data"
echo ""
echo "Important reminder:"
echo "   Please ensure you have a valid Google Maps API Key, otherwise map functionality will not work"
