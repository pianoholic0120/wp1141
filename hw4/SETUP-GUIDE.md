# 🚀 完整安裝指南

本指南將幫助您在 10 分鐘內完成整個系統的安裝和配置。

## 📋 前提條件

- ✅ Node.js 20+ (推薦) 或 18+
- ✅ npm 或 yarn
- ✅ Google Maps API Key（可選，系統提供快速選擇功能）

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd hw4/backend

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
PORT=3000
NODE_ENV=development
DATABASE_PATH=./database/rental_listings.db
JWT_SECRET=change_this_to_a_secure_random_string_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Initialize database
npm run init-db

# Start backend server
npm run dev
```

✅ Backend should now be running on **http://localhost:3000**

Test it: http://localhost:3000/health

## Step 2: Frontend Setup (2 minutes)

```bash
# Open a new terminal, navigate to frontend
cd hw4/frontend

# Install dependencies
npm install

# Install Tailwind CSS and shadcn dependencies
npm install -D tailwindcss-animate

# Create environment file
cat > .env << EOF
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Rental Listings
VITE_DEFAULT_MAP_CENTER_LAT=25.0330
VITE_DEFAULT_MAP_CENTER_LNG=121.5654
VITE_DEFAULT_MAP_ZOOM=12
EOF
```

## Step 3: Install shadcn/ui Components

```bash
# Still in frontend directory
# Initialize shadcn/ui (answer the prompts with defaults)
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
```

## Step 4: Start Frontend

```bash
# Start the development server
npm run dev
```

✅ Frontend should now be running on **http://localhost:5173**

## Step 5: Test the Application

1. Open http://localhost:5173 in your browser
2. Click "Sign up" to create a new account
3. Fill in the registration form:
   - Username: testuser
   - Email: test@example.com
   - Password: Test123!@# (must meet requirements)
   - Confirm password: Test123!@#
4. Click "Register"
5. You'll be redirected to the dashboard

## Troubleshooting

### Backend won't start

**Error: "Cannot find module"**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Error: "Database error"**
```bash
cd backend
rm -rf database
npm run init-db
npm run dev
```

### Frontend won't start

**Error: "Cannot find module '@/components/ui/...' "**

You need to install shadcn components. Run:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card alert
```

**Error: "tailwindcss-animate not found"**
```bash
npm install -D tailwindcss-animate
```

### Port already in use

**Backend (port 3000):**
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in backend/.env to 3001
```

**Frontend (port 5173):**
```bash
# Vite will automatically use next available port
# Or specify in vite.config.ts
```

### CORS errors

Make sure:
1. Backend is running on http://localhost:3000
2. Frontend .env has: `VITE_API_BASE_URL=http://localhost:3000/api`
3. Backend .env has: `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`

## What's Included

✅ **Backend (Complete)**
- User authentication (register, login, logout)
- JWT token management
- SQLite database with Users and Listings tables
- CRUD API for listings
- Google Maps services (geocoding, places)
- Input validation and security

✅ **Frontend (Foundational)**
- React 18 + TypeScript + Vite
- Authentication UI (login, register)
- Protected routes
- Basic dashboard with listing display
- Axios API client with interceptors
- Responsive design with Tailwind CSS

## Next Steps to Complete Full Implementation

The core authentication and API infrastructure is complete. To add the full feature set:

### 1. Enhanced Dashboard with Google Maps
Location: `frontend/src/pages/Dashboard.tsx`
- Install: `npm install @vis.gl/react-google-maps`
- Add interactive map showing listing locations
- Implement map marker click interactions

### 2. Create Listing Form
Location: `frontend/src/pages/CreateListing.tsx`
- Multi-step form with tabs
- Map location picker dialog
- Form validation
- Image upload support

### 3. My Listings Management Page
Location: `frontend/src/pages/MyListings.tsx`
- Table view with shadcn Table component
- Edit/delete actions
- Filter and sort capabilities

### 4. Advanced Filtering
Location: `frontend/src/components/FilterPanel.tsx`
- Price range slider
- Property type dropdown
- Distance-based search
- Bedroom/bathroom filters

See `implementation-plan.md` for detailed specifications.

## Directory Structure

```
hw4/
├── backend/               ✅ Complete
│   ├── src/
│   ├── database/
│   └── package.json
├── frontend/              ✅ Foundational (auth working)
│   ├── src/
│   ├── index.html
│   └── package.json
├── implementation-plan.md  📖 Detailed guide
├── README.md              📖 Overview
└── SETUP-GUIDE.md         📖 This file
```

## Quick Reference

### Backend Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Run production build
npm run init-db   # Initialize database
```

### Frontend Commands
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

### API Endpoints
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- GET `/api/listings` - Get all listings
- POST `/api/listings` - Create listing (auth)
- PUT `/api/listings/:id` - Update listing (auth)
- DELETE `/api/listings/:id` - Delete listing (auth)

### Default Credentials (after registration)
- Create your own account via the registration form
- No default admin account exists

## Getting Help

1. **Backend issues**: See `backend/README.md`
2. **Frontend issues**: See `frontend/README.md`
3. **Implementation details**: See `implementation-plan.md`
4. **API reference**: See `backend/README.md` API section

## Success Indicators

You know everything is working when:

✅ Backend health check returns: `{"status":"ok","message":"Server is running"}`
✅ Frontend loads without console errors
✅ You can register a new user
✅ You can login and see the dashboard
✅ Token is stored in localStorage
✅ Logout redirects to login page

Happy coding! 🚀

