# Vector

Vector is a Twitter-inspired social network built with Next.js (App Router), React 18, Tailwind CSS, Prisma, PostgreSQL, and Pusher. It supports multi-provider OAuth, custom user IDs, rich posting with mentions/hashtags, and real-time notifications across the stack.

> ⚠️ **LIVE DEPLOYMENT (READ FIRST!)**  
> Production build: **https://wp1141-orpin.vercel.app**  
> - Use *different* email addresses for each OAuth provider. GitHub and Google accounts sharing the same email can conflict and block login because the underlying user is already linked; use another provider (e.g., Facebook) or a separate email to avoid `AccountNotLinked` errors.  
> - The **New Post notice** is intentionally scoped: it appears only when someone posts with an `@mention` that includes you, keeping the feed focused and preventing noisy global alerts.  
> - The **Notifications badge** depends on the browser session and deployment state. Occasionally the sidebar counter may desync; opening the full Notifications page forces a refresh and ensures you do not miss any items.  
> Please review these behaviours before reporting an issue—they are part of the current product design.

## Highlights

- **Authentication** – NextAuth.js with Google, GitHub, Facebook, and credential-based user IDs.
- **Social graph** – Follow system, feed filters, reposts, likes, and threaded comments.
- **Content authoring** – Drafts, mention/hashtag parsing, repost with comment, visibility controls.
- **Realtime UX** – Pusher-driven live updates for feeds, notifications, and interaction counters.
- **Deployment ready** – Prisma migrations, environment-driven configuration, Vercel-friendly scripts.

## Quick Start

```bash
git clone https://github.com/pianoholic0120/wp1141.git vector
cd vector
./scripts/setup.sh
npm run dev
```

The setup script installs dependencies, scaffolds `.env.local` from `.env.example`, generates the Prisma client, and (if your database credentials are already populated) applies the schema. Update `.env.local` with real secrets before running `npm run dev`.

### What the script checks
- Node.js 18+ with npm/npx available.
- `.env.example` presence (now tracked in the repository).
- `.env.local` creation (only if missing).
- Optional `prisma db push` execution—skipped while database credentials still contain placeholder values.

## Manual Setup (if you prefer step-by-step)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # edit .env.local with real credentials
   ```

3. **Prepare the database**
   ```bash
   npm run db:generate   # prisma generate
   npm run db:push       # applies schema to DATABASE_URL
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Environment Variables

`.env.example` lists every variable required to run Vector:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-secure-random-string"

# OAuth Providers
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

Replace every placeholder before running migrations or deploying. For production (Vercel), ensure `NEXTAUTH_URL`, OAuth redirect URIs, and `DATABASE_URL` point to hosted services (Neon, Supabase, etc.).

## OAuth Provider Notes

- **Google** – Authorized redirect: `http://localhost:3000/api/auth/callback/google`
- **GitHub** – Authorized callback: `http://localhost:3000/api/auth/callback/github`
- **Facebook** – Valid OAuth redirect: `http://localhost:3000/api/auth/callback/facebook`

For production, mirror the same paths under your deployed domain (e.g. `https://<your-domain>/api/auth/callback/google`).

## Project Layout

```
├── app/                 # Next.js app router structure
│   ├── (auth)/          # Sign-in and registration flows
│   ├── (main)/          # Authenticated application pages
│   └── api/             # REST-style endpoints
├── components/          # UI building blocks (common, layout, post, profile)
├── lib/                 # Auth, Prisma client, Pusher client, utilities
├── prisma/              # Schema and migration management
├── scripts/             # Developer tooling (e.g. setup.sh)
└── public/              # Static assets
```

## Deployment Checklist

- Push your code to GitHub (this repository already contains `.env.example` and automation).
- In Vercel:
  - Set `NEXTAUTH_URL` to the production domain.
  - Provide all OAuth credentials and the hosted `DATABASE_URL`.
  - Re-run Prisma during build (`npm run build` already calls `prisma generate`).
- Update provider dashboards with production redirect URIs.

After deployment the application is accessible immediately; OAuth providers may require you to re-authorize with the new domain.

## License

ISC

