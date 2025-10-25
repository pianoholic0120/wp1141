# Rental Platform System

A comprehensive full-stack rental platform system that integrates Google Maps API to provide location services, featuring user authentication, property management, favorites and ratings functionality.

## Key Features

### Property Management

- Property creation, editing, and deletion
- Property search and filtering
- Geographic location marking
- Property status management

### Map Services

- Google Maps integration
- Address geocoding
- Interactive map markers
- Location search functionality

### User System

- User registration and login (JWT authentication)
- Password encryption storage (bcrypt)
- Automatic login state maintenance
- User profile management

### Favorites and Ratings

- Property favorites functionality
- Rating system (1-5 stars)
- Favorites list management
- Rating statistics display

### Advanced Filtering

- Price range filtering
- Property type filtering
- Amenities filtering
- Geographic location filtering

## Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │    │  Database       │
│  (React)        │    │  (Express)      │    │  (SQLite)       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ User UI     │ │◄──►│ │ API Routes  │ │◄──►│ │ User Data   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Map Component│ │◄──►│ │ Map Service │ │◄──►│ │ Property    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ Data        │ │
│                 │    │                 │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ Form        │ │◄──►│ │ Business    │ │◄──►│ ┌─────────────┐ │
│ │ Components  │ │    │ │ Logic       │ │    │ │ Favorites   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ & Ratings   │ │
└─────────────────┘    └─────────────────┘    │ └─────────────┘ │
         │                       │            └─────────────────┘
         └───────────────────────┼───────────────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Google Maps API  │
                    │ (Geocoding)      │
                    └─────────────────┘
```

## Quick Start

### Requirements

- Node.js 18.0 or higher
- npm or yarn package manager
- Google Maps API Key (required)

### One-Click Setup (Recommended)

```bash
# Clone the project
git clone <repository-url>
cd hw4

# Run automatic setup script
./setup.sh
```

After setup, edit environment variables files:

```bash
# Edit backend environment variables (you can use any method, e.g. vim, vi)
nano backend/.env

# Edit frontend environment variables (you can use any method, e.g. vim, vi)
nano frontend/.env
```

Replace `your_google_maps_api_key_here` with your Google Maps API Key.

### Quick Start

```bash
# Start the complete system
./start.sh
```

### Manual Setup (Optional)

If you prefer manual setup, follow these steps:

#### 1. Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env file and add your Google Maps API Key
npm run init-db
npm run generate-taiwan
npm run generate-reviewers
npm run add-ratings
npm run dev
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
cp env.example .env
# Edit .env file and add your Google Maps API Key
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card alert dialog tabs select textarea slider checkbox table dropdown-menu separator scroll-area tooltip badge popover alert-dialog
npm run dev
```

### System Data

The system comes pre-loaded with complete test data:

- **400 virtual properties**: Distributed across Taiwan with real addresses and coordinates
- **100 landlord users**: For property management
- **200 reviewer users**: Chinese names for rating system
- **Complete rating data**: 3-5 ratings per property with diverse comments
- **Favorites data**: User favorite property records

## Technology Stack

### Frontend Technologies

- React 18 + TypeScript
- Vite build tool
- Tailwind CSS styling framework
- shadcn/ui component library
- React Router for routing
- Axios HTTP client

### Backend Technologies

- Node.js + Express.js
- TypeScript for type safety
- SQLite database
- JWT authentication mechanism
- bcrypt password encryption
- Google Maps API integration

## Project Structure

```
hw4/
├── backend/                 # Backend service
│   ├── database/           # Database with complete test data
│   ├── src/                # Source code
│   ├── env.example         # Environment variables example
│   └── package.json        # Dependency management
├── frontend/               # Frontend application
│   ├── src/                # Source code
│   ├── env.example         # Environment variables example
│   └── package.json        # Dependency management
├── chat-history/           # Development records
├── setup.sh               # Automatic setup script
├── start.sh               # Quick start script
├── check-setup.sh         # Setup check script
├── README.md              # Complete documentation
└── .gitignore             # Git ignore rules
```

## Environment Variables Configuration

### Backend Environment Variables (.env)

```env
# Server configuration
PORT=3000
NODE_ENV=development

# Database configuration
DATABASE_PATH=./database/rental_listings.db

# JWT authentication configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS configuration
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Google Maps API configuration
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Password encryption configuration
BCRYPT_ROUNDS=10

# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10000
```

### Frontend Environment Variables (.env)

```env
# API base URL
VITE_API_BASE_URL=http://localhost:3000/api

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Application configuration
VITE_APP_NAME=Rental Platform
VITE_DEFAULT_MAP_CENTER_LAT=25.0330
VITE_DEFAULT_MAP_CENTER_LNG=121.5654
VITE_DEFAULT_MAP_ZOOM=12
```

## API Documentation

### Authentication APIs

#### User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

#### User Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### Get Current User Info

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Property APIs

#### Get All Properties

```bash
curl -X GET "http://localhost:3000/api/listings?page=1&limit=10&minPrice=10000&maxPrice=50000"
```

#### Create New Property

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Cozy Studio",
    "description": "A cozy studio in the city center",
    "address": "Taipei City, Xinyi District, Xinyi Road Section 5, No. 7",
    "price": 25000,
    "bedrooms": 1,
    "bathrooms": 1,
    "area_sqft": 15,
    "property_type": "Studio",
    "amenities": ["Air Conditioning", "Internet", "Washing Machine"]
  }'
```

#### Get User Properties

```bash
curl -X GET http://localhost:3000/api/listings/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Map Service APIs

#### Address Geocoding

```bash
curl -X POST http://localhost:3000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Taipei City, Xinyi District, Xinyi Road Section 5, No. 7"
  }'
```

### Favorites and Ratings APIs

#### Add Favorite

```bash
curl -X POST http://localhost:3000/api/favorites/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get User Favorites

```bash
curl -X GET http://localhost:3000/api/favorites \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Add Rating

```bash
curl -X POST http://localhost:3000/api/ratings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 5,
    "comment": "Excellent property!"
  }'
```

#### Get Property Ratings

```bash
curl -X GET http://localhost:3000/api/ratings/1
```

#### Update Rating

```bash
curl -X PUT http://localhost:3000/api/ratings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 4,
    "comment": "Updated comment"
  }'
```

#### Delete Rating

```bash
curl -X DELETE http://localhost:3000/api/ratings/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Search Places

```bash
curl -X POST http://localhost:3000/api/maps/places/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Taipei 101"
  }'
```

#### Reverse Geocoding

```bash
curl -X POST http://localhost:3000/api/maps/reverse-geocode \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 25.0330,
    "lng": 121.5654
  }'
```

## Database Structure

### Users Table (users)

- id: Primary key
- email: Email address (unique)
- username: Username (unique)
- password_hash: Password hash
- created_at: Creation time
- updated_at: Update time

### Properties Table (listings)

- id: Primary key
- user_id: User ID (foreign key)
- title: Property title
- description: Property description
- address: Address
- latitude: Latitude
- longitude: Longitude
- price: Rent price
- bedrooms: Number of bedrooms
- bathrooms: Number of bathrooms
- area_sqft: Area in square feet
- property_type: Property type
- status: Status
- amenities: Amenities (JSON)
- floor: Floor
- contact_phone: Contact phone
- management_fee: Management fee
- created_at: Creation time
- updated_at: Update time

### Favorites Table (favorites)

- id: Primary key
- user_id: User ID (foreign key)
- listing_id: Property ID (foreign key)
- created_at: Creation time

### Ratings Table (ratings)

- id: Primary key
- user_id: User ID (foreign key)
- listing_id: Property ID (foreign key)
- rating: Rating (1-5)
- comment: Rating comment
- created_at: Creation time
- updated_at: Update time

## Security Risk Explanation

### Google Maps API Key Security

This project uses Google Maps API Key to provide map services. If the API Key is not restricted by IP, there are the following security risks:

1. **API Abuse Risk**: Unauthorized users may abuse the API Key, causing quota to be exceeded
2. **Cost Risk**: API calls may generate costs, and unrestricted Keys may be maliciously used
3. **Data Leakage Risk**: API Key exposed in frontend code may be obtained through reverse engineering

### Recommended Security Measures

1. **Set API Restrictions**: Set HTTP referrer restrictions in Google Cloud Console
2. **Monitor Usage**: Regularly check API usage and set quota alerts
3. **Regular Rotation**: Regularly change API Keys
4. **Environment Separation**: Use different API Keys for development, testing, and production environments
5. **Proxy Service**: Consider using backend proxy for Google Maps API requests

### Other Security Considerations

1. **JWT Secret**: Production environment must use strong random keys
2. **HTTPS**: Production environment must use HTTPS
3. **Input Validation**: All user inputs are validated and sanitized
4. **SQL Injection Protection**: Use parameterized queries to prevent SQL injection
5. **Rate Limiting**: Implement API rate limiting to prevent abuse

## Known Issues and Future Improvements

### Known Issues

1. **Image Upload Functionality**: Image upload functionality has been removed and needs to be re-implemented
2. **Performance Optimization**: Map loading may be slow with large numbers of properties
3. **Mobile Device Adaptation**: Some features need improvement on mobile devices
4. **Search Functionality**: Current search functionality is basic and lacks full-text search

### Future Improvements

1. **Image Management System**: Implement property image upload, management, and display functionality
2. **Advanced Search**: Add full-text search and intelligent recommendation features
3. **Real-time Communication**: Real-time chat functionality between landlords and tenants
4. **Payment Integration**: Integrate third-party payment services
5. **Mobile Application**: Develop native mobile applications
6. **Data Analytics**: Add property view statistics and user behavior analysis
7. **Multi-language Support**: Internationalization functionality
8. **API Documentation**: Use Swagger to generate complete API documentation

## Development Guide

### Local Development

```bash
# Start backend development server
cd backend
npm run dev

# Start frontend development server
cd frontend
npm run dev
```

### Production Deployment

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
# Deploy dist/ directory to web server
```

### Testing

```bash
# Backend testing
cd backend
npm test

# Frontend testing
cd frontend
npm test
```

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or suggestions, please contact us through:

- Submit an Issue
- Send a Pull Request
- Email contact
