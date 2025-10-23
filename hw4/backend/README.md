# Rental Listings Backend API

Backend API for the rental listings application built with Express, TypeScript, and SQLite.

## Features

- User authentication with JWT
- Full CRUD operations for rental listings
- Google Maps integration (geocoding, reverse geocoding, places search)
- Distance-based search
- Advanced filtering (price, property type, bedrooms, bathrooms)
- Input validation and sanitization
- Rate limiting and security headers

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** SQLite (better-sqlite3)
- **Authentication:** JWT + bcrypt
- **Validation:** express-validator
- **Security:** helmet, cors, rate-limit

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Maps API key

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./database/rental_listings.db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Bcrypt Configuration
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /api/auth/me
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### Listings (`/api/listings`)

#### GET /api/listings
Get all listings with optional filters.

**Query Parameters:**
- `search` - Keyword search
- `distance` - Distance in km
- `lat` - Latitude for distance filter
- `lng` - Longitude for distance filter
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `propertyType` - Property type filter
- `bedrooms` - Minimum bedrooms
- `bathrooms` - Minimum bathrooms
- `status` - Listing status (available, rented, pending)

**Response (200):**
```json
{
  "listings": [...],
  "total": 10
}
```

#### GET /api/listings/:id
Get a single listing by ID.

**Response (200):**
```json
{
  "listing": {
    "id": 1,
    "user_id": 1,
    "title": "Modern 2BR Apartment",
    "description": "Beautiful apartment",
    "address": "123 Main St",
    "latitude": 25.0330,
    "longitude": 121.5654,
    "price": 30000,
    "bedrooms": 2,
    "bathrooms": 1,
    "area_sqft": 800,
    "property_type": "apartment",
    "status": "available",
    "username": "johndoe"
  }
}
```

#### POST /api/listings
Create a new listing (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Modern 2BR Apartment",
  "description": "Beautiful apartment",
  "address": "123 Main St",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "price": 30000,
  "bedrooms": 2,
  "bathrooms": 1,
  "area_sqft": 800,
  "property_type": "apartment"
}
```

**Response (201):**
```json
{
  "message": "Listing created successfully",
  "listing": {...}
}
```

#### PUT /api/listings/:id
Update a listing (requires authentication and ownership).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:** Same as POST (all fields optional)

**Response (200):**
```json
{
  "message": "Listing updated successfully",
  "listing": {...}
}
```

#### DELETE /api/listings/:id
Delete a listing (requires authentication and ownership).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Listing deleted successfully"
}
```

#### GET /api/listings/user/me
Get current user's listings (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "listings": [...],
  "total": 5
}
```

### Maps (`/api/maps`)

#### POST /api/maps/geocode
Convert address to coordinates.

**Request:**
```json
{
  "address": "123 Main St, Taipei"
}
```

**Response (200):**
```json
{
  "latitude": 25.0330,
  "longitude": 121.5654,
  "formattedAddress": "No. 123, Main St, Taipei"
}
```

#### POST /api/maps/reverse-geocode
Convert coordinates to address.

**Request:**
```json
{
  "latitude": 25.0330,
  "longitude": 121.5654
}
```

**Response (200):**
```json
{
  "address": "No. 123, Main St, Taipei"
}
```

#### GET /api/maps/places
Search for places.

**Query Parameters:**
- `query` - Search query
- `location` - lat,lng
- `radius` - Search radius in meters

**Response (200):**
```json
{
  "places": [
    {
      "name": "Place Name",
      "address": "Place Address",
      "latitude": 25.0330,
      "longitude": 121.5654
    }
  ]
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Database configuration
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication logic
│   │   ├── listings.controller.ts # Listings CRUD
│   │   └── maps.controller.ts   # Maps integration
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── authorization.middleware.ts # Ownership checks
│   │   ├── validation.middleware.ts # Input validation
│   │   └── errorHandler.ts      # Error handling
│   ├── models/
│   │   ├── User.ts              # User model
│   │   └── Listing.ts           # Listing model
│   ├── routes/
│   │   ├── auth.routes.ts       # Auth endpoints
│   │   ├── listings.routes.ts   # Listings endpoints
│   │   └── maps.routes.ts       # Maps endpoints
│   ├── services/
│   │   ├── geocoding.service.ts # Google Geocoding
│   │   ├── places.service.ts    # Google Places
│   │   └── maps.service.ts      # Distance calculations
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── utils/
│   │   ├── jwt.ts               # JWT utilities
│   │   └── validators.ts        # Validation helpers
│   ├── scripts/
│   │   └── initDatabase.ts      # DB initialization
│   └── server.ts                # Express app
├── database/                    # SQLite database files
├── .env                         # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens with expiration
- CORS configuration
- Helmet security headers
- Rate limiting
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- Authorization checks on protected routes

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Listings Table
```sql
CREATE TABLE listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqft INTEGER,
  property_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## License

MIT

