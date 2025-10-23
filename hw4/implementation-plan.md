# Rental Listings Application - Detailed Implementation Plan
## Shadcn/UI Components & Backend Architecture

---

## 1. Frontend UI Component Mapping

### 1.1 Authentication Pages

#### Login Page (`/login`)
**Shadcn Block:** `login-01` or `login-02` (use as base template)

**Components Used:**
- `card` - Main container for login form
- `form` - Form wrapper with validation
- `label` - Field labels
- `input` - Email and password inputs
- `button` - Submit button
- `alert` - Error messages display
- `spinner` - Loading state during authentication
- `separator` - Visual divider between form sections

**Structure:**
```
Login Page
├── Card
│   ├── CardHeader (Title, Description)
│   ├── CardContent
│   │   ├── Form
│   │   │   ├── Field (Email)
│   │   │   │   ├── Label
│   │   │   │   └── Input
│   │   │   ├── Field (Password)
│   │   │   │   ├── Label
│   │   │   │   └── Input
│   │   │   └── Button (Submit)
│   │   └── Alert (Error Display)
│   └── CardFooter (Link to Register)
```

#### Register Page (`/register`)
**Shadcn Block:** `signup-01` or `signup-02` (use as base template)

**Components Used:**
- `card` - Main container
- `form` - Form wrapper with validation
- `label` - Field labels
- `input` - Username, email, password, confirm password
- `button` - Submit button
- `alert` - Error/success messages
- `spinner` - Loading state
- `checkbox` - Terms & conditions acceptance

**Structure:**
```
Register Page
├── Card
│   ├── CardHeader
│   ├── CardContent
│   │   ├── Form
│   │   │   ├── Field (Username)
│   │   │   ├── Field (Email)
│   │   │   ├── Field (Password)
│   │   │   ├── Field (Confirm Password)
│   │   │   ├── Checkbox (Terms)
│   │   │   └── Button (Register)
│   │   └── Alert
│   └── CardFooter (Link to Login)
```

---

### 1.2 Main Dashboard/Home Page

#### Layout Structure
**Shadcn Block:** `sidebar-07` or `sidebar-12` (for main navigation)

**Components Used:**
- `sidebar` - Left navigation panel
- `navigation-menu` - Main navigation items
- `avatar` - User profile display
- `dropdown-menu` - User menu dropdown
- `badge` - Notification indicators
- `button` - Action buttons
- `tooltip` - Helpful hints

**Navigation Items:**
- Dashboard (Map View)
- My Listings
- Create Listing
- Profile
- Logout

#### Map Dashboard View (`/dashboard`)

**Components Used:**
- `resizable` - Split view between map and listing cards
- `card` - Listing cards container
- `scroll-area` - Scrollable listing cards panel
- `input` - Search bar
- `button` - Filter toggles, action buttons
- `badge` - Property type tags, status indicators
- `popover` - Filter options panel
- `slider` - Price range filter
- `select` - Property type dropdown, sort options
- `checkbox` - Multi-select filters
- `dialog` - Listing details modal
- `separator` - Visual dividers
- `skeleton` - Loading placeholders
- `empty` - No results state

**Map Area Structure:**
```
Dashboard Page
├── Sidebar (Navigation)
└── Main Content
    └── Resizable
        ├── Left Panel (Google Map)
        │   ├── Map Container
        │   ├── Markers (Listings)
        │   └── Info Windows
        └── Right Panel (Listings)
            ├── Search Bar
            │   ├── Input (Search)
            │   └── Button (Search Icon)
            ├── Filters Section
            │   ├── Popover (Filter Panel)
            │   │   ├── Slider (Price Range)
            │   │   ├── Select (Property Type)
            │   │   ├── Checkbox Group (Amenities)
            │   │   └── Button (Apply Filters)
            │   └── Badge (Active Filters)
            ├── Sort Dropdown
            │   └── Select (Sort Options)
            └── Scroll Area (Listing Cards)
                ├── Card (Listing 1)
                │   ├── CardHeader (Image Placeholder)
                │   ├── CardContent
                │   │   ├── Title
                │   │   ├── Badge (Property Type)
                │   │   ├── Description
                │   │   └── Price
                │   └── CardFooter
                │       └── Button (View Details)
                ├── Card (Listing 2)
                └── Empty (No Results)
```

---

### 1.3 Listing Creation/Edit Page

#### Create/Edit Listing Form (`/listings/new`, `/listings/edit/:id`)

**Components Used:**
- `card` - Form container
- `form` - Form wrapper with validation
- `tabs` - Multi-step form sections
- `label` - Field labels
- `input` - Text inputs (title, price, bedrooms, bathrooms, area)
- `textarea` - Description field
- `select` - Property type dropdown, status dropdown
- `button` - Submit, cancel, map location button
- `dialog` - Map location picker modal
- `alert` - Validation errors, success messages
- `badge` - Selected features/amenities
- `checkbox-group` - Amenities selection
- `spinner` - Loading/saving state
- `separator` - Section dividers
- `tooltip` - Help text for fields

**Structure:**
```
Create/Edit Listing Page
├── Sidebar (Navigation)
└── Main Content
    └── Card (Form Container)
        ├── CardHeader
        │   └── Tabs (Basic Info, Location, Details, Preview)
        └── CardContent
            ├── Tab Panel 1 (Basic Info)
            │   ├── Form
            │   │   ├── Field (Title)
            │   │   │   ├── Label
            │   │   │   └── Input
            │   │   ├── Field (Description)
            │   │   │   ├── Label
            │   │   │   └── Textarea
            │   │   ├── Field (Price)
            │   │   │   ├── Label
            │   │   │   └── Input
            │   │   └── Field (Property Type)
            │   │       ├── Label
            │   │       └── Select
            │   └── Separator
            ├── Tab Panel 2 (Location)
            │   ├── Field (Address)
            │   │   ├── Label
            │   │   └── Input (with autocomplete)
            │   ├── Button (Pick on Map)
            │   │   └── Dialog (Map Picker)
            │   │       ├── DialogHeader
            │   │       ├── DialogContent (Google Map)
            │   │       └── DialogFooter
            │   │           ├── Button (Cancel)
            │   │           └── Button (Confirm)
            │   ├── Field (Latitude) [Read-only]
            │   ├── Field (Longitude) [Read-only]
            │   └── Alert (Location Info)
            ├── Tab Panel 3 (Details)
            │   ├── Field (Bedrooms)
            │   │   ├── Label
            │   │   └── Input (number)
            │   ├── Field (Bathrooms)
            │   ├── Field (Area sq ft)
            │   ├── Field (Status)
            │   │   ├── Label
            │   │   └── Select
            │   └── Checkbox Group (Amenities)
            │       ├── Checkbox (Parking)
            │       ├── Checkbox (WiFi)
            │       ├── Checkbox (Laundry)
            │       └── Checkbox (Gym)
            └── Tab Panel 4 (Preview)
                └── Card (Listing Preview)
                    └── [Preview of how listing will appear]
        └── CardFooter
            ├── Button (Cancel)
            ├── Button (Save Draft)
            └── Button (Publish)
```

---

### 1.4 My Listings Page

#### User's Listings Management (`/my-listings`)

**Components Used:**
- `sidebar` - Navigation
- `table` - Listings table view
- `card` - Alternative grid view for listings
- `button` - Edit, delete, view actions
- `badge` - Status indicators (available, rented, pending)
- `alert-dialog` - Delete confirmation
- `dropdown-menu` - Row actions menu
- `pagination` - Page navigation
- `skeleton` - Loading state
- `empty` - No listings state
- `tabs` - Toggle between table/grid view
- `tooltip` - Action hints

**Structure:**
```
My Listings Page
├── Sidebar (Navigation)
└── Main Content
    ├── Header
    │   ├── Title
    │   ├── Button (Create New Listing)
    │   └── Tabs (Table View / Grid View)
    └── Content Area
        ├── Tab Panel (Table View)
        │   └── Table
        │       ├── TableHeader
        │       │   ├── TableHead (Image)
        │       │   ├── TableHead (Title)
        │       │   ├── TableHead (Price)
        │       │   ├── TableHead (Status)
        │       │   └── TableHead (Actions)
        │       └── TableBody
        │           └── TableRow (per listing)
        │               ├── TableCell (Image)
        │               ├── TableCell (Title)
        │               ├── TableCell (Price)
        │               ├── TableCell
        │               │   └── Badge (Status)
        │               └── TableCell
        │                   └── DropdownMenu
        │                       ├── DropdownMenuItem (View)
        │                       ├── DropdownMenuItem (Edit)
        │                       ├── Separator
        │                       └── DropdownMenuItem (Delete)
        │                           └── AlertDialog (Confirm Delete)
        ├── Tab Panel (Grid View)
        │   └── Grid of Cards
        │       └── Card (per listing)
        │           ├── CardHeader (Image)
        │           ├── CardContent
        │           │   ├── Title
        │           │   ├── Badge (Status)
        │           │   └── Price
        │           └── CardFooter
        │               ├── Button (Edit)
        │               └── Button (Delete)
        └── Pagination
            └── Pagination Component
```

---

### 1.5 Listing Details Page

#### Individual Listing View (`/listings/:id`)

**Components Used:**
- `card` - Main content container
- `carousel` - Image gallery (if images exist)
- `badge` - Property type, status tags
- `separator` - Section dividers
- `button` - Contact owner, edit (if owner), delete (if owner)
- `tabs` - Overview, amenities, location tabs
- `alert-dialog` - Delete confirmation
- `avatar` - Owner profile picture
- `hover-card` - Owner info on hover
- `tooltip` - Additional information hints
- `aspect-ratio` - Image display

**Structure:**
```
Listing Details Page
├── Sidebar (Navigation)
└── Main Content
    └── Card (Listing Details)
        ├── Carousel (Images) [If available]
        ├── CardHeader
        │   ├── Title
        │   ├── Badge Group (Property Type, Status)
        │   └── Price
        ├── Separator
        ├── CardContent
        │   ├── Tabs (Overview, Details, Location)
        │   │   ├── Tab Panel (Overview)
        │   │   │   ├── Description
        │   │   │   └── Key Features List
        │   │   ├── Tab Panel (Details)
        │   │   │   ├── Bedrooms
        │   │   │   ├── Bathrooms
        │   │   │   ├── Area
        │   │   │   └── Amenities with Badges
        │   │   └── Tab Panel (Location)
        │   │       ├── Address
        │   │       └── Map Embed
        │   ├── Separator
        │   └── Owner Section
        │       ├── Avatar
        │       ├── HoverCard (Owner Info)
        │       │   └── Owner Details
        │       └── Button (Contact Owner)
        └── CardFooter
            ├── Button (Back to Listings)
            └── [If Owner]
                ├── Button (Edit)
                └── Button (Delete)
                    └── AlertDialog (Confirm)
```

---

### 1.6 Shared Components

#### Location Search/Autocomplete Component

**Components Used:**
- `command` - Command palette for location search
- `popover` - Dropdown for suggestions
- `input` - Search input field
- `skeleton` - Loading suggestions
- `empty` - No results state

#### Map Location Picker Component

**Components Used:**
- `dialog` - Modal wrapper
- `button` - Confirm/cancel actions
- `input` - Address search
- `alert` - Location selected confirmation
- Custom Google Maps integration

#### Filter Panel Component

**Components Used:**
- `popover` - Filter dropdown
- `slider` - Price range
- `select` - Dropdowns for categories
- `checkbox` - Multiple selections
- `button` - Apply/reset filters
- `badge` - Active filter chips
- `separator` - Section dividers

#### User Menu Component

**Components Used:**
- `dropdown-menu` - User actions menu
- `avatar` - User profile picture
- `separator` - Menu sections
- `badge` - Notification count

---

## 2. Backend Implementation Structure

### 2.1 Project Setup & Configuration

#### Package Dependencies
```
Core Framework:
- express (^4.18.2)
- typescript (^5.3.3)
- ts-node (^10.9.2)
- nodemon (^3.0.2)

Database:
- better-sqlite3 (^9.2.2)
- @types/better-sqlite3 (^7.6.8)

Authentication:
- bcrypt (^5.1.1)
- jsonwebtoken (^9.0.2)
- @types/bcrypt (^5.0.2)
- @types/jsonwebtoken (^9.0.5)

Google Maps:
- @googlemaps/google-maps-services-js (^3.3.40)

Utilities:
- cors (^2.8.5)
- dotenv (^16.3.1)
- express-validator (^7.0.1)
- express-rate-limit (^7.1.5)
- helmet (^7.1.0)
- morgan (^1.10.0)

Dev Dependencies:
- @types/node (^20.10.6)
- @types/express (^4.17.21)
- @types/cors (^2.8.17)
- @types/morgan (^1.9.9)
```

#### TypeScript Configuration (`tsconfig.json`)
```
Settings:
- target: ES2020
- module: commonjs
- moduleResolution: node
- outDir: ./dist
- rootDir: ./src
- strict: true
- esModuleInterop: true
- skipLibCheck: true
- resolveJsonModule: true
- declaration: true
- sourceMap: true
```

---

### 2.2 Database Layer

#### Database Setup (`src/config/database.ts`)

**Functions:**
- `initializeDatabase()` - Create connection and initialize schema
- `getDatabase()` - Get database instance
- `closeDatabase()` - Close connection
- `runMigrations()` - Execute schema migrations

#### Schema Initialization

**Tables:**

1. **Users Table**
   - Columns: id, email, username, password_hash, created_at, updated_at
   - Indexes: email, username
   - Auto-increment ID
   - Unique constraints on email and username

2. **Listings Table**
   - Columns: id, user_id, title, description, address, latitude, longitude, price, bedrooms, bathrooms, area_sqft, property_type, status, created_at, updated_at
   - Indexes: user_id, coordinates (latitude, longitude), status
   - Foreign key: user_id references users(id) ON DELETE CASCADE
   - Auto-increment ID

---

### 2.3 Models Layer

#### User Model (`src/models/User.ts`)

**Interface:**
```
User {
  id: number
  email: string
  username: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

UserDTO {
  id: number
  email: string
  username: string
}
```

**Methods:**
- `create(email, username, password)` - Register new user
- `findById(id)` - Get user by ID
- `findByEmail(email)` - Get user by email
- `findByUsername(username)` - Get user by username
- `update(id, data)` - Update user info
- `delete(id)` - Delete user
- `comparePassword(password, hash)` - Verify password
- `hashPassword(password)` - Hash password

#### Listing Model (`src/models/Listing.ts`)

**Interface:**
```
Listing {
  id: number
  user_id: number
  title: string
  description: string
  address: string
  latitude: number
  longitude: number
  price: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
  property_type: string
  status: 'available' | 'rented' | 'pending'
  created_at: Date
  updated_at: Date
}

ListingWithUser extends Listing {
  username: string
}

ListingFilters {
  search?: string
  distance?: number
  lat?: number
  lng?: number
  minPrice?: number
  maxPrice?: number
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  status?: string
}
```

**Methods:**
- `create(userId, data)` - Create new listing
- `findById(id)` - Get listing by ID
- `findAll(filters)` - Get all listings with filters
- `findByUserId(userId)` - Get user's listings
- `update(id, data)` - Update listing
- `delete(id)` - Delete listing
- `findNearby(lat, lng, radius)` - Find listings within radius
- `search(query)` - Search listings by keyword

---

### 2.4 Services Layer

#### Google Maps Services

##### Geocoding Service (`src/services/geocoding.service.ts`)

**Functions:**
- `geocodeAddress(address)` - Convert address to coordinates
  - Input: Address string
  - Output: { latitude, longitude, formattedAddress }
  - Uses: Google Geocoding API

- `reverseGeocode(lat, lng)` - Convert coordinates to address
  - Input: Latitude, longitude
  - Output: { address, formattedAddress }
  - Uses: Google Reverse Geocoding API

##### Places Service (`src/services/places.service.ts`)

**Functions:**
- `searchPlaces(query, location, radius)` - Search nearby places
  - Input: Query string, location coordinates, search radius
  - Output: Array of places with { name, address, latitude, longitude }
  - Uses: Google Places API

- `getPlaceAutocomplete(input, location)` - Get autocomplete suggestions
  - Input: Partial address, user location
  - Output: Array of address suggestions
  - Uses: Google Places Autocomplete API

##### Maps Service (`src/services/maps.service.ts`)

**Functions:**
- `calculateDistance(lat1, lng1, lat2, lng2)` - Haversine distance formula
  - Input: Two coordinate pairs
  - Output: Distance in kilometers

- `isWithinRadius(centerLat, centerLng, pointLat, pointLng, radius)` - Check if point is within radius
  - Input: Center coordinates, point coordinates, radius
  - Output: Boolean

---

### 2.5 Middleware Layer

#### Authentication Middleware (`src/middleware/auth.middleware.ts`)

**Functions:**
- `authenticateToken(req, res, next)` - Verify JWT token
  - Extract token from Authorization header
  - Verify token signature
  - Attach user to request object
  - Return 401 if invalid

- `optionalAuth(req, res, next)` - Attach user if token exists
  - Similar to authenticateToken but doesn't require token
  - Continue even if no token present

#### Authorization Middleware (`src/middleware/authorization.middleware.ts`)

**Functions:**
- `isOwner(req, res, next)` - Verify user owns resource
  - Check if req.user.id matches resource owner
  - Return 403 if not owner
  - Used for edit/delete operations

#### Validation Middleware (`src/middleware/validation.middleware.ts`)

**Validators:**
- `validateRegistration` - Email, username, password rules
  - Email: Valid email format, unique
  - Username: 3-20 chars, alphanumeric, unique
  - Password: Min 8 chars, uppercase, lowercase, number, special char

- `validateLogin` - Email and password required

- `validateListingCreate` - All listing fields
  - Title: Required, 5-100 chars
  - Description: Optional, max 2000 chars
  - Address: Required, max 500 chars
  - Coordinates: Required, valid latitude/longitude
  - Price: Required, positive number
  - Bedrooms: Optional, positive integer
  - Bathrooms: Optional, positive number
  - Area: Optional, positive integer
  - Property Type: Optional, enum validation
  - Status: Optional, enum validation

- `validateListingUpdate` - Same as create but all optional

- `validateFilters` - Query parameter validation
  - Distance: Positive number
  - Coordinates: Valid lat/lng
  - Price range: Positive numbers
  - Property type: Valid enum

#### Error Handler Middleware (`src/middleware/errorHandler.ts`)

**Functions:**
- `errorHandler(err, req, res, next)` - Global error handler
  - Log error details
  - Return appropriate status code
  - Format error response
  - Hide sensitive details in production

- `notFoundHandler(req, res)` - 404 handler

---

### 2.6 Controllers Layer

#### Auth Controller (`src/controllers/auth.controller.ts`)

**Endpoints:**

1. **Register** (`POST /api/auth/register`)
   - Validate input
   - Check if user exists
   - Hash password
   - Create user
   - Generate JWT token
   - Return user data and token

2. **Login** (`POST /api/auth/login`)
   - Validate input
   - Find user by email
   - Compare password
   - Generate JWT token
   - Return user data and token

3. **Logout** (`POST /api/auth/logout`)
   - Verify token (middleware)
   - Clear token (client-side mainly)
   - Return success message

4. **Get Current User** (`GET /api/auth/me`)
   - Verify token (middleware)
   - Get user from token
   - Return user data

#### Listings Controller (`src/controllers/listings.controller.ts`)

**Endpoints:**

1. **Get All Listings** (`GET /api/listings`)
   - Parse query parameters (filters)
   - Apply filters (search, price, type, location, distance)
   - Get listings from database
   - Calculate distances if location provided
   - Return listings with total count

2. **Get Single Listing** (`GET /api/listings/:id`)
   - Parse listing ID
   - Get listing from database
   - Return listing with owner username
   - Return 404 if not found

3. **Create Listing** (`POST /api/listings`)
   - Authenticate user (middleware)
   - Validate input (middleware)
   - Extract user ID from token
   - Create listing in database
   - Return created listing

4. **Update Listing** (`PUT /api/listings/:id`)
   - Authenticate user (middleware)
   - Validate input (middleware)
   - Check ownership (middleware)
   - Update listing in database
   - Return updated listing

5. **Delete Listing** (`DELETE /api/listings/:id`)
   - Authenticate user (middleware)
   - Check ownership (middleware)
   - Delete listing from database
   - Return success message

6. **Get User's Listings** (`GET /api/listings/user/me`)
   - Authenticate user (middleware)
   - Get all listings for user
   - Return listings

#### Maps Controller (`src/controllers/maps.controller.ts`)

**Endpoints:**

1. **Geocode Address** (`POST /api/maps/geocode`)
   - Validate address input
   - Call geocoding service
   - Return coordinates and formatted address

2. **Reverse Geocode** (`POST /api/maps/reverse-geocode`)
   - Validate coordinate input
   - Call reverse geocoding service
   - Return address

3. **Search Places** (`GET /api/maps/places`)
   - Parse query parameters
   - Call places service
   - Return matching places

---

### 2.7 Routes Layer

#### Auth Routes (`src/routes/auth.routes.ts`)

```
Router: /api/auth
├── POST /register
│   └── Middleware: validateRegistration
├── POST /login
│   └── Middleware: validateLogin
├── POST /logout
│   └── Middleware: authenticateToken
└── GET /me
    └── Middleware: authenticateToken
```

#### Listings Routes (`src/routes/listings.routes.ts`)

```
Router: /api/listings
├── GET /
│   └── Middleware: optionalAuth, validateFilters
├── GET /user/me
│   └── Middleware: authenticateToken
├── GET /:id
│   └── Middleware: optionalAuth
├── POST /
│   └── Middleware: authenticateToken, validateListingCreate
├── PUT /:id
│   └── Middleware: authenticateToken, validateListingUpdate, isOwner
└── DELETE /:id
    └── Middleware: authenticateToken, isOwner
```

#### Maps Routes (`src/routes/maps.routes.ts`)

```
Router: /api/maps
├── POST /geocode
├── POST /reverse-geocode
└── GET /places
```

---

### 2.8 Utilities Layer

#### JWT Utilities (`src/utils/jwt.ts`)

**Functions:**
- `generateToken(userId)` - Create JWT token
  - Input: User ID
  - Output: Signed JWT string
  - Payload: { userId, iat, exp }
  - Expiration: 7 days (configurable)

- `verifyToken(token)` - Verify JWT token
  - Input: Token string
  - Output: Decoded payload or null
  - Validates signature and expiration

- `decodeToken(token)` - Decode without verification
  - Input: Token string
  - Output: Decoded payload (unsafe)

#### Validators (`src/utils/validators.ts`)

**Functions:**
- `isValidEmail(email)` - Email format validation
- `isValidPassword(password)` - Password strength validation
- `isValidCoordinates(lat, lng)` - Coordinate range validation
- `sanitizeString(input)` - Remove dangerous characters
- `validatePropertyType(type)` - Check valid property types
- `validateStatus(status)` - Check valid listing statuses

---

### 2.9 Server Entry Point

#### Server Setup (`src/server.ts`)

**Initialization Flow:**
1. Load environment variables
2. Initialize database connection
3. Create Express app
4. Configure middleware:
   - Helmet (security headers)
   - CORS (cross-origin)
   - Morgan (logging)
   - Express JSON parser
   - Rate limiting
5. Mount routes:
   - /api/auth
   - /api/listings
   - /api/maps
6. Error handlers:
   - 404 handler
   - Global error handler
7. Start server on configured port
8. Graceful shutdown handling

---

## 3. Implementation Workflow

### Phase 1: Backend Foundation (Days 1-2)

#### Day 1 Morning: Project Setup
- Initialize Node.js project
- Install all dependencies
- Configure TypeScript
- Set up environment variables
- Create folder structure

#### Day 1 Afternoon: Database & Models
- Create database configuration
- Initialize SQLite database
- Create Users table schema
- Create Listings table schema
- Implement User model with all methods
- Implement Listing model with all methods

#### Day 2 Morning: Authentication
- Create JWT utilities
- Implement auth middleware
- Implement auth controller
- Create auth routes
- Test authentication endpoints

#### Day 2 Afternoon: Listings CRUD
- Implement validation middleware
- Implement authorization middleware
- Implement listings controller
- Create listings routes
- Test CRUD endpoints

### Phase 2: Backend Integration (Day 3)

#### Day 3 Morning: Google Maps Integration
- Set up Google Maps API client
- Implement geocoding service
- Implement places service
- Implement maps service
- Create maps controller
- Create maps routes

#### Day 3 Afternoon: Testing & Polish
- Test all API endpoints
- Implement error handling
- Add rate limiting
- Configure CORS properly
- Test authentication flow
- Test with distance filters

---

### Phase 3: Frontend Foundation (Days 4-5)

#### Day 4 Morning: Project Setup
- Initialize Vite + React + TypeScript
- Install dependencies (react-router-dom, axios, etc.)
- Configure Tailwind CSS
- Set up environment variables
- Create folder structure

#### Day 4 Afternoon: Shadcn/UI Setup
- Initialize shadcn/ui
- Install base components (button, input, card, etc.)
- Configure theme
- Create TypeScript types/interfaces
- Set up Axios instance with interceptors

#### Day 5 Morning: Authentication UI
- Implement login-01 block as base
- Create LoginForm component with shadcn components
- Implement signup-01 block as base
- Create RegisterForm component
- Create AuthContext
- Implement auth service (API calls)

#### Day 5 Afternoon: Routing & Protected Routes
- Set up React Router
- Create ProtectedRoute component
- Implement token storage
- Implement auto-login on app load
- Test authentication flow

---

### Phase 4: Core Features (Days 6-8)

#### Day 6 Morning: Navigation & Layout
- Implement sidebar-07 or sidebar-12 block
- Create main app layout
- Create navigation menu
- Implement user dropdown menu
- Add logout functionality

#### Day 6 Afternoon: Google Maps Integration
- Set up @vis.gl/react-google-maps
- Create MapView component
- Implement map click handler
- Implement marker placement
- Create InfoWindow component

#### Day 7 Full Day: Dashboard Page
- Create dashboard layout with resizable panels
- Implement map in left panel
- Create listing cards in right panel
- Implement scroll-area for cards
- Add search input
- Create filter popover with components
- Implement two-way interaction (map ↔ cards)
- Add loading skeletons
- Add empty state

#### Day 8 Full Day: Listing Form
- Create form with tabs (Basic, Location, Details, Preview)
- Implement all form fields with validation
- Create map location picker dialog
- Implement address autocomplete
- Add location selection on map click
- Implement form submission
- Add success/error alerts
- Create edit mode logic

---

### Phase 5: Additional Features (Days 9-10)

#### Day 9 Morning: My Listings Page
- Create table view with shadcn table
- Create grid view with cards
- Implement tabs for view switching
- Add dropdown menu for actions
- Implement delete with alert-dialog
- Add pagination component

#### Day 9 Afternoon: Listing Details Page
- Create detailed listing view
- Implement tabs (Overview, Details, Location)
- Add owner info with hover-card
- Embed map for location
- Add edit/delete buttons for owners
- Implement contact owner button (optional)

#### Day 10 Morning: Filtering & Search
- Implement advanced filters
- Add distance-based search with map center
- Add price range slider
- Add property type select
- Implement filter badges
- Add sort options

#### Day 10 Afternoon: Polish & UX
- Add loading states with spinners
- Implement error handling with alerts
- Add tooltips for better UX
- Ensure responsive design
- Test all interactions
- Fix any bugs

---

### Phase 6: Testing & Deployment (Day 11)

#### Day 11 Morning: Testing
- End-to-end testing of all features
- Test authentication flow
- Test CRUD operations
- Test map interactions
- Test filters and search
- Cross-browser testing
- Mobile responsiveness testing

#### Day 11 Afternoon: Documentation & Deployment
- Write comprehensive README
- Document API endpoints
- Create user guide
- Prepare environment variables guide
- Create deployment configuration
- Final bug fixes and optimization

---

## 4. Component Reusability Map

### Shared Components to Create

1. **LoadingSpinner**
   - Uses: `spinner`
   - Used in: All pages during API calls

2. **ErrorAlert**
   - Uses: `alert`
   - Used in: All forms and pages

3. **ConfirmDialog**
   - Uses: `alert-dialog`
   - Used in: Delete operations, logout

4. **EmptyState**
   - Uses: `empty`
   - Used in: Dashboard, My Listings when no data

5. **ListingCard**
   - Uses: `card`, `badge`, `button`
   - Used in: Dashboard, My Listings, Search Results

6. **FilterPanel**
   - Uses: `popover`, `slider`, `select`, `checkbox`, `button`
   - Used in: Dashboard, Search Page

7. **MapLocationPicker**
   - Uses: `dialog`, `button`, `input`
   - Used in: Listing form, Search filters

8. **UserMenu**
   - Uses: `dropdown-menu`, `avatar`, `separator`
   - Used in: All authenticated pages

9. **PageHeader**
   - Uses: `button`, `badge`
   - Used in: All main pages

10. **FormField**
    - Uses: `label`, `input`, `textarea`, `select`
    - Used in: All forms

---

## 5. API Integration Points

### Frontend Services Structure

#### Auth Service (`src/services/auth.service.ts`)
- `login(email, password)` → POST /api/auth/login
- `register(email, username, password)` → POST /api/auth/register
- `logout()` → POST /api/auth/logout
- `getCurrentUser()` → GET /api/auth/me

#### Listings Service (`src/services/listings.service.ts`)
- `getAllListings(filters)` → GET /api/listings?...
- `getListing(id)` → GET /api/listings/:id
- `createListing(data)` → POST /api/listings
- `updateListing(id, data)` → PUT /api/listings/:id
- `deleteListing(id)` → DELETE /api/listings/:id
- `getUserListings()` → GET /api/listings/user/me

#### Maps Service (`src/services/maps.service.ts`)
- `geocodeAddress(address)` → POST /api/maps/geocode
- `reverseGeocode(lat, lng)` → POST /api/maps/reverse-geocode
- `searchPlaces(query, location, radius)` → GET /api/maps/places?...

---

## 6. State Management Structure

### Context Providers

#### AuthContext
**State:**
- `user: User | null`
- `token: string | null`
- `loading: boolean`

**Methods:**
- `login(email, password)`
- `register(email, username, password)`
- `logout()`
- `updateUser(userData)`

#### ListingsContext (Optional)
**State:**
- `listings: Listing[]`
- `filters: FilterState`
- `selectedListing: Listing | null`
- `loading: boolean`

**Methods:**
- `fetchListings(filters)`
- `selectListing(listing)`
- `updateFilters(newFilters)`
- `clearFilters()`

---

## 7. File Tree Summary

```
rental-listings-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          [Database connection & initialization]
│   │   │   └── env.ts               [Environment variables validation]
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts   [Register, Login, Logout, Me]
│   │   │   ├── listings.controller.ts [CRUD operations]
│   │   │   └── maps.controller.ts   [Geocoding, Reverse, Places]
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   [JWT authentication]
│   │   │   ├── authorization.middleware.ts [Ownership checks]
│   │   │   ├── validation.middleware.ts [Input validation]
│   │   │   └── errorHandler.ts      [Global error handling]
│   │   ├── models/
│   │   │   ├── User.ts              [User CRUD methods]
│   │   │   └── Listing.ts           [Listing CRUD methods]
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       [Auth endpoints]
│   │   │   ├── listings.routes.ts   [Listings endpoints]
│   │   │   └── maps.routes.ts       [Maps endpoints]
│   │   ├── services/
│   │   │   ├── geocoding.service.ts [Address ↔ Coordinates]
│   │   │   ├── places.service.ts    [Place search, autocomplete]
│   │   │   └── maps.service.ts      [Distance calculations]
│   │   ├── types/
│   │   │   └── index.ts             [TypeScript interfaces]
│   │   ├── utils/
│   │   │   ├── jwt.ts               [Token generation, verification]
│   │   │   └── validators.ts        [Validation helpers]
│   │   └── server.ts                [Express app setup]
│   ├── database/
│   │   └── rental_listings.db       [SQLite database]
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── LoginForm.tsx            [Uses: card, form, input, button, alert]
    │   │   │   ├── RegisterForm.tsx         [Uses: card, form, input, button, checkbox, alert]
    │   │   │   └── ProtectedRoute.tsx       [Route guard]
    │   │   ├── map/
    │   │   │   ├── MapView.tsx              [Google Maps component]
    │   │   │   ├── MapMarker.tsx            [Custom marker]
    │   │   │   └── MapLocationPicker.tsx    [Uses: dialog, button, input]
    │   │   ├── listings/
    │   │   │   ├── ListingForm.tsx          [Uses: card, form, tabs, input, textarea, select, dialog, button]
    │   │   │   ├── ListingCard.tsx          [Uses: card, badge, button]
    │   │   │   ├── ListingList.tsx          [Uses: scroll-area, skeleton, empty]
    │   │   │   └── ListingDetails.tsx       [Uses: card, tabs, badge, carousel, avatar, hover-card]
    │   │   ├── shared/
    │   │   │   ├── LoadingSpinner.tsx       [Uses: spinner]
    │   │   │   ├── ErrorAlert.tsx           [Uses: alert]
    │   │   │   ├── ConfirmDialog.tsx        [Uses: alert-dialog]
    │   │   │   ├── EmptyState.tsx           [Uses: empty]
    │   │   │   ├── FilterPanel.tsx          [Uses: popover, slider, select, checkbox]
    │   │   │   └── UserMenu.tsx             [Uses: dropdown-menu, avatar]
    │   │   ├── layout/
    │   │   │   ├── AppSidebar.tsx           [Uses: sidebar-07 block, navigation-menu]
    │   │   │   ├── AppHeader.tsx            [Uses: button, avatar, dropdown-menu]
    │   │   │   └── MainLayout.tsx           [Layout wrapper]
    │   │   └── ui/                          [Shadcn components]
    │   │       ├── accordion.tsx
    │   │       ├── alert.tsx
    │   │       ├── alert-dialog.tsx
    │   │       ├── avatar.tsx
    │   │       ├── badge.tsx
    │   │       ├── button.tsx
    │   │       ├── card.tsx
    │   │       ├── checkbox.tsx
    │   │       ├── command.tsx
    │   │       ├── dialog.tsx
    │   │       ├── dropdown-menu.tsx
    │   │       ├── empty.tsx
    │   │       ├── form.tsx
    │   │       ├── hover-card.tsx
    │   │       ├── input.tsx
    │   │       ├── label.tsx
    │   │       ├── pagination.tsx
    │   │       ├── popover.tsx
    │   │       ├── resizable.tsx
    │   │       ├── scroll-area.tsx
    │   │       ├── select.tsx
    │   │       ├── separator.tsx
    │   │       ├── sidebar.tsx
    │   │       ├── skeleton.tsx
    │   │       ├── slider.tsx
    │   │       ├── spinner.tsx
    │   │       ├── table.tsx
    │   │       ├── tabs.tsx
    │   │       ├── textarea.tsx
    │   │       └── tooltip.tsx
    │   ├── pages/
    │   │   ├── Home.tsx                     [Landing page]
    │   │   ├── Login.tsx                    [Uses: login-01 block]
    │   │   ├── Register.tsx                 [Uses: signup-01 block]
    │   │   ├── Dashboard.tsx                [Uses: resizable, map, cards, filters]
    │   │   ├── MyListings.tsx               [Uses: table, card, pagination, alert-dialog]
    │   │   ├── CreateListing.tsx            [Uses: ListingForm]
    │   │   ├── EditListing.tsx              [Uses: ListingForm]
    │   │   └── ListingDetails.tsx           [Uses: ListingDetails component]
    │   ├── services/
    │   │   ├── api.ts                       [Axios instance with interceptors]
    │   │   ├── auth.service.ts              [Auth API calls]
    │   │   ├── listings.service.ts          [Listings API calls]
    │   │   └── maps.service.ts              [Maps API calls]
    │   ├── contexts/
    │   │   ├── AuthContext.tsx              [Global auth state]
    │   │   └── ListingsContext.tsx          [Global listings state (optional)]
    │   ├── types/
    │   │   └── index.ts                     [TypeScript interfaces]
    │   ├── utils/
    │   │   ├── validation.ts                [Form validation helpers]
    │   │   └── formatting.ts                [Data formatting]
    │   ├── hooks/
    │   │   ├── useAuth.ts                   [Auth hook]
    │   │   └── useListings.ts               [Listings hook]
    │   ├── App.tsx                          [Main app component]
    │   └── main.tsx                         [Entry point]
    ├── .env.example
    ├── .env
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 8. Testing Checklist

### Backend Testing
- [ ] User registration with valid data
- [ ] User registration with duplicate email
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] JWT token generation and verification
- [ ] Create listing with authentication
- [ ] Create listing without authentication (should fail)
- [ ] Update own listing
- [ ] Update other user's listing (should fail)
- [ ] Delete own listing
- [ ] Delete other user's listing (should fail)
- [ ] Get all listings without filters
- [ ] Get listings with price filter
- [ ] Get listings with distance filter
- [ ] Geocode address to coordinates
- [ ] Reverse geocode coordinates to address
- [ ] Search places with query

### Frontend Testing
- [ ] Login form validation
- [ ] Register form validation
- [ ] Successful login redirects to dashboard
- [ ] Protected routes require authentication
- [ ] Map renders correctly
- [ ] Map markers appear for listings
- [ ] Click marker shows listing details
- [ ] Click listing card centers map
- [ ] Location picker dialog opens
- [ ] Click map updates coordinates
- [ ] Create listing form validation
- [ ] Submit create listing form
- [ ] Edit listing loads existing data
- [ ] Submit update listing form
- [ ] Delete listing shows confirmation
- [ ] Confirm delete removes listing
- [ ] Filters update listing display
- [ ] Search updates results
- [ ] Price slider filters correctly
- [ ] Distance filter works with map
- [ ] Logout clears session
- [ ] Token expiration handling
- [ ] Responsive design on mobile
- [ ] Loading states display correctly
- [ ] Error messages display correctly

---

## 9. Security Implementation

### Backend Security Measures
1. **Password Security**
   - Bcrypt hashing with 10+ rounds
   - Never store plain text passwords
   - Minimum password requirements enforced

2. **JWT Security**
   - Secret key stored in environment variable
   - Token expiration (7 days)
   - Token verification on protected routes
   - No sensitive data in token payload

3. **CORS Configuration**
   - Specific origin whitelist
   - Credentials allowed
   - Proper headers configuration

4. **Input Validation**
   - express-validator on all inputs
   - SQL injection prevention (parameterized queries)
   - XSS prevention (sanitize inputs)
   - Request size limits

5. **Authorization**
   - Ownership verification on update/delete
   - User ID from token, not from request body
   - Role-based access if needed

6. **Rate Limiting**
   - Auth endpoints: 5 requests per 15 minutes
   - API endpoints: 100 requests per 15 minutes
   - IP-based limiting

7. **Headers Security**
   - Helmet.js for security headers
   - HTTPS in production
   - CSP (Content Security Policy)

### Frontend Security Measures
1. **Token Storage**
   - Store JWT in localStorage (or httpOnly cookie for better security)
   - Clear token on logout
   - Token expiration handling

2. **API Calls**
   - Always include token in Authorization header
   - Handle 401/403 responses
   - Automatic logout on token expiration

3. **Input Sanitization**
   - Validate all form inputs
   - Prevent XSS in user-generated content
   - Escape HTML in listings display

4. **Environment Variables**
   - Never expose API keys in code
   - Use VITE_ prefix for Vite variables
   - Different keys for dev/production

---

## 10. Performance Optimization

### Backend Optimizations
1. **Database**
   - Indexes on frequently queried columns
   - Query optimization
   - Connection pooling

2. **API Responses**
   - Gzip compression
   - Pagination for listings
   - Limit response payload size

3. **Caching** (Optional)
   - Cache geocoding results
   - Cache popular search queries
   - Redis for session management

### Frontend Optimizations
1. **Code Splitting**
   - React.lazy for route components
   - Dynamic imports for heavy components
   - Separate vendor bundles

2. **Map Optimization**
   - Marker clustering for many listings
   - Lazy load map component
   - Debounce map interactions

3. **Asset Optimization**
   - Image lazy loading
   - Optimize image sizes
   - SVG for icons

4. **State Management**
   - React.memo for expensive components
   - useMemo for expensive calculations
   - useCallback for event handlers

5. **Network**
   - Debounce search inputs
   - Cache API responses
   - Prefetch data on hover

---

## Summary

This implementation plan provides:

1. **Complete UI Component Mapping** - Every page and feature mapped to specific shadcn/ui components and blocks
2. **Detailed Backend Architecture** - Full breakdown of models, controllers, services, middleware, and utilities
3. **Implementation Timeline** - 11-day structured plan with morning/afternoon tasks
4. **Testing Strategy** - Comprehensive checklist for backend and frontend testing
5. **Security Measures** - Both frontend and backend security implementations
6. **Performance Guidelines** - Optimization strategies for both layers

**Key Shadcn Blocks to Use:**
- `login-01` or `login-02` for authentication pages
- `signup-01` or `signup-02` for registration
- `sidebar-07` or `sidebar-12` for main navigation
- `dashboard-01` for dashboard inspiration (optional)

**Essential Shadcn Components:**
- Form components: `form`, `input`, `textarea`, `select`, `checkbox`, `button`, `label`
- Layout components: `card`, `tabs`, `resizable`, `separator`, `sidebar`
- Feedback components: `alert`, `alert-dialog`, `spinner`, `skeleton`, `empty`
- Interactive components: `dialog`, `popover`, `dropdown-menu`, `hover-card`, `tooltip`
- Display components: `badge`, `avatar`, `table`, `pagination`, `scroll-area`

This plan ensures a modern, professional, and fully functional rental listing application with excellent UX using shadcn/ui components throughout.

