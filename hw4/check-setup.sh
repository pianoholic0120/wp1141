#!/bin/bash

# Rental Platform System Setup Check Script

echo "Checking Rental Platform System Setup..."

# Check required files
echo "Checking required files..."

REQUIRED_FILES=(
    "backend/package.json"
    "frontend/package.json"
    "backend/env.example"
    "frontend/env.example"
    "backend/database/rental_listings.db"
    "setup.sh"
    "start.sh"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "PASS: $file"
    else
        echo "FAIL: $file does not exist"
        exit 1
    fi
done

# Check environment variables files
echo ""
echo "Checking environment variables files..."

if [ -f "backend/.env" ]; then
    echo "PASS: backend/.env exists"
else
    echo "WARN: backend/.env does not exist, please run ./setup.sh"
fi

if [ -f "frontend/.env" ]; then
    echo "PASS: frontend/.env exists"
else
    echo "WARN: frontend/.env does not exist, please run ./setup.sh"
fi

# Check database
echo ""
echo "Checking database..."

if [ -f "backend/database/rental_listings.db" ]; then
    echo "PASS: Database file exists"
    
    # Check database content
    LISTING_COUNT=$(sqlite3 backend/database/rental_listings.db "SELECT COUNT(*) FROM listings;" 2>/dev/null || echo "0")
    USER_COUNT=$(sqlite3 backend/database/rental_listings.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    RATING_COUNT=$(sqlite3 backend/database/rental_listings.db "SELECT COUNT(*) FROM ratings;" 2>/dev/null || echo "0")
    
    echo "Database statistics:"
    echo "   - Listings: $LISTING_COUNT"
    echo "   - Users: $USER_COUNT"
    echo "   - Ratings: $RATING_COUNT"
    
    if [ "$LISTING_COUNT" -gt 0 ] && [ "$USER_COUNT" -gt 0 ] && [ "$RATING_COUNT" -gt 0 ]; then
        echo "PASS: Database contains complete test data"
    else
        echo "WARN: Database may be missing test data, please run ./setup.sh"
    fi
else
    echo "FAIL: Database file does not exist"
    exit 1
fi

# Check Node.js version
echo ""
echo "Checking Node.js version..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo "PASS: Node.js version: $(node -v)"
    
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo "PASS: Node.js version meets requirements"
    else
        echo "WARN: Node.js version is too low, please upgrade to 18.0 or higher"
    fi
else
    echo "FAIL: Node.js is not installed"
    exit 1
fi

# Check dependencies
echo ""
echo "Checking dependencies..."

if [ -d "backend/node_modules" ]; then
    echo "PASS: Backend dependencies installed"
else
    echo "WARN: Backend dependencies not installed, please run cd backend && npm install"
fi

if [ -d "frontend/node_modules" ]; then
    echo "PASS: Frontend dependencies installed"
else
    echo "WARN: Frontend dependencies not installed, please run cd frontend && npm install"
fi

echo ""
echo "Check completed!"
echo ""
echo "Next steps:"
echo "1. If environment variables files do not exist, please run: ./setup.sh"
echo "2. If dependencies are not installed, please run:"
echo "   cd backend && npm install"
echo "   cd frontend && npm install"
echo "3. Edit .env files and add your Google Maps API Key"
echo "4. Start system: ./start.sh"
echo ""
echo "System will run at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:3000"
