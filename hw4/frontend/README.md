# Rental Listings Frontend

React frontend application for the rental listings platform with shadcn/ui components.

## Features

- User authentication (login/register)
- Protected routes with authentication guards
- Listing dashboard with modern UI
- Responsive design with Tailwind CSS
- Type-safe with TypeScript
- Ready for Google Maps integration
- Optimized with Vite

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context API

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:3000

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Install shadcn/ui Components

The project requires shadcn/ui components. Install the necessary components:

```bash
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add popover
```

### 3. Environment Variables

Create a `.env` file in the frontend directory:

```env
# Google Maps Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# App Configuration
VITE_APP_NAME=Rental Listings
VITE_DEFAULT_MAP_CENTER_LAT=25.0330
VITE_DEFAULT_MAP_CENTER_LNG=121.5654
VITE_DEFAULT_MAP_ZOOM=12
```

### 4. Run Development Server

```bash
npm run dev
```

The app will start on `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Login form component
│   │   │   ├── RegisterForm.tsx    # Registration form
│   │   │   └── ProtectedRoute.tsx  # Route guard
│   │   └── ui/                     # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication context
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── Register.tsx            # Register page
│   │   └── Dashboard.tsx           # Main dashboard
│   ├── services/
│   │   ├── api.ts                  # Axios configuration
│   │   ├── auth.service.ts         # Auth API calls
│   │   ├── listings.service.ts     # Listings API calls
│   │   └── maps.service.ts         # Maps API calls
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   ├── utils/
│   │   └── cn.ts                   # Utility functions
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## Available Routes

- `/` - Redirects to dashboard
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)

## API Integration

The frontend communicates with the backend API through Axios. The API client is configured in `src/services/api.ts` with:

- Automatic token injection for authenticated requests
- Response interceptors for error handling
- Automatic redirect to login on 401 errors

### Authentication Flow

1. User logs in or registers
2. Token is stored in localStorage
3. Token is automatically attached to all API requests
4. On token expiration, user is redirected to login

## State Management

Authentication state is managed through React Context (`AuthContext`):

```typescript
const { user, loading, login, register, logout, isAuthenticated } = useAuth();
```

## Styling

The project uses Tailwind CSS with shadcn/ui for components. The theme can be customized in:

- `tailwind.config.ts` - Tailwind configuration
- `src/index.css` - CSS variables for theming

## Development Tips

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Use `<ProtectedRoute>` wrapper for authenticated pages

### Using shadcn/ui Components

Import components from `@/components/ui/`:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

### Making API Calls

Use the service functions:

```tsx
import { listingsService } from '@/services/listings.service';

const listings = await listingsService.getAllListings();
```

## Expanding the Application

To add more features as per the implementation plan:

### 1. Google Maps Dashboard

Install maps dependencies:
```bash
npm install @vis.gl/react-google-maps
```

Create MapView component in `src/components/map/MapView.tsx`

### 2. Listing Form

Create `src/components/listings/ListingForm.tsx` with tabs for:
- Basic Info
- Location (with map picker)
- Details
- Preview

### 3. My Listings Page

Create `src/pages/MyListings.tsx` with table view using shadcn Table component

### 4. Filters and Search

Add filter components using shadcn Popover, Slider, and Select components

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the app:

```typescript
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Troubleshooting

### Module not found errors

Make sure all shadcn/ui components are installed:
```bash
npx shadcn-ui@latest add [component-name]
```

### API connection issues

1. Check that backend is running on http://localhost:3000
2. Verify VITE_API_BASE_URL in .env
3. Check CORS configuration in backend

### TypeScript errors

Run type checking:
```bash
npm run build
```

## License

MIT

