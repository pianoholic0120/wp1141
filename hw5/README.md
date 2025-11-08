# Vector

Vector is a Twitter-inspired social network built with Next.js (App Router), React 18, Tailwind CSS, Prisma, PostgreSQL, and Pusher. It supports multi-provider OAuth, custom user IDs, rich posting with mentions/hashtags, and real-time notifications across the stack.

> ⚠️ **LIVE DEPLOYMENT (READ FIRST!)**Production build: **https://wp1141-orpin.vercel.app**
>
> - Use *different* email addresses for each OAuth provider. GitHub and Google accounts sharing the same email can conflict and block login because the underlying user is already linked; use another provider (e.g., Facebook) or a separate email to avoid `AccountNotLinked` errors.
> - The **New Post notice** is intentionally scoped: it appears only when someone posts with an `@mention` that includes you, keeping the feed focused and preventing noisy global alerts.
> - The **Notifications badge** depends on the browser session and deployment state. Occasionally the sidebar counter may desync; opening the full Notifications page forces a refresh and ensures you do not miss any items.
>   Please review these behaviours before reporting an issue—they are part of the current product design.

## Highlights

- **Authentication** – NextAuth.js with Google, GitHub, Facebook, and credential-based user IDs.
- **Social graph** – Follow system, feed filters, reposts, likes, and threaded comments.
- **Content authoring** – Drafts, mention/hashtag parsing, repost with comment, visibility controls.
- **Realtime UX** – Pusher-driven live updates for feeds, notifications, and interaction counters.
- **Deployment ready** – Prisma migrations, environment-driven configuration, Vercel-friendly scripts.

## Local Development Setup

The quickest path is still the automation in `./scripts/setup.sh`, but the checklist below shows every step you need in order and explains the pieces that commonly fail in a fresh environment.

### 1. Install prerequisites

- Node.js 18 or later (recommend installing with `nvm` or Homebrew).
- npm (ships with Node.js).
- PostgreSQL 14+ running locally. On macOS you can install with Homebrew:
  ```bash
  brew install postgresql@14
  ```

### 2. Clone and install dependencies

```bash
git clone https://github.com/pianoholic0120/wp1141.git
cd wp1141/hw5
npm install
```

> Tip: `./scripts/setup.sh` wraps the same dependency install and Prisma steps, so you can run it instead of `npm install` + `prisma generate` if you prefer a single command.

### 3. Configure `.env.local`

Create your local environment file if it does not already exist:

```bash
cp .env.example .env.local
```

Populate at least the first six variables so Prisma and NextAuth can boot:

```env
# Database
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/vector?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-secure-random-string"
```

- Replace `YOUR_USER`/`YOUR_PASSWORD` with your local Postgres credentials. If you use the default macOS install without a password you can drop `:YOUR_PASSWORD`.
- Generate a secure `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
- Leave the OAuth provider keys commented out until you have real credentials; the app will fall back to email/password login locally.

### 4. Start PostgreSQL and create the `vector` database

1. Start the database service (Homebrew example):

   ```bash
   brew services start postgresql@14
   ```

   If you installed Postgres manually, use the matching `pg_ctl ... start` command.
2. Create the database and confirm the connection string matches `.env.local`:

   ```bash
   createdb vector
   ```

   or run the provided helper which both checks the service status and creates the database if missing:
   ```bash
   bash setup-database.sh
   ```

### 5. Generate Prisma client and push the schema

```bash
npx prisma generate
npx prisma db push
```

> `./scripts/setup.sh` also performs these Prisma steps automatically when it detects a valid `DATABASE_URL`.

### 6. Launch the development server

```bash
npm run dev
```

Visit `http://localhost:3000`. If you see a NextAuth database error, double-check that PostgreSQL is running and the `vector` database exists—Prisma will refuse to connect otherwise.

⚠️ Hard reload is recommended when first using the application!!!!!

### Common local issues

- **`ECONNREFUSED` or `PrismaClientInitializationError`** – PostgreSQL is not running or the `DATABASE_URL` user/database pair does not exist. Start Postgres (`brew services start postgresql@14`) and rerun `bash setup-database.sh`.
- **`AccountNotLinked`** during OAuth testing – use unique emails per provider or stick to the credentials flow while you finish local setup.
- **Environment variables not updating** – restart `npm run dev` after editing `.env.local`; Next.js only loads them on boot.

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
