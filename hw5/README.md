# Vector - Social Network

A Twitter-like social network built with Next.js, TypeScript, Prisma, PostgreSQL, and Pusher.

## Features

- **Authentication**: OAuth login with Google, GitHub, and Facebook via NextAuth.js
- **Custom User IDs**: Unique user identifiers (3-15 characters, alphanumeric + underscore)
- **Posts**: Create posts with 280 character limit, special counting for URLs, hashtags, and mentions
- **Interactions**: Like, comment, and repost functionality
- **Real-time Updates**: Live updates using Pusher for likes, comments, and reposts
- **Profile Pages**: View and edit profiles with background images and bio
- **Follow System**: Follow/unfollow users
- **Drafts**: Save and retrieve post drafts
- **Recursive Comments**: Navigate through nested comments
- **Feed Filters**: View all posts or only from users you follow

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Pusher
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)
- OAuth credentials from Google, GitHub, and/or Facebook
- Pusher account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

1. Create a PostgreSQL database
2. Copy `.env.example` to `.env.local` (if you created one) or create `.env.local` manually
3. Add your database connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/vector?schema=public"
```

### 3. Run Prisma Migrations

```bash
npm run db:push
npm run db:generate
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vector?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32

# OAuth Providers (at least one required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Pusher
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"
```

### 5. Setup OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`

### 6. Setup Pusher

1. Create an account at [Pusher](https://pusher.com/)
2. Create a new app/channel
3. Copy the credentials to your `.env.local`

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   └── api/               # API routes
├── components/            # React components
│   ├── common/           # Shared components
│   ├── layout/           # Layout components
│   ├── post/             # Post-related components
│   └── profile/          # Profile components
├── lib/                   # Utility libraries
│   ├── utils/            # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── pusher.ts         # Pusher configuration
├── prisma/               # Prisma schema and migrations
└── types/                # TypeScript type definitions
```

## Key Features Implementation

### Character Counting
- URLs always count as 23 characters regardless of actual length
- Hashtags (`#tag`) and mentions (`@user`) are excluded from count
- Maximum 280 characters

### Real-time Updates
- Uses Pusher channels for live updates
- Updates like counts, comment counts, and repost counts in real-time
- No page refresh required

### Post Navigation
- Click on a post to view it with all comments
- Click on a comment to view it with its replies
- Back button returns to previous view

### Drafts
- Posts can be saved as drafts when closing the post modal
- Drafts can be accessed and edited later
- Drafts are stored per user

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

Make sure to:
- Update OAuth redirect URLs to your production domain
- Update `NEXTAUTH_URL` to your production URL
- Set up a production PostgreSQL database (Vercel Postgres or external)

## License

ISC

