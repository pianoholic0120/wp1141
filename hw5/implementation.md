# Full-Stack Implementation Plan for Vector Social Network

I'll create a comprehensive implementation plan for your Twitter-like social network "Vector". This plan covers architecture, database design, API structure, and step-by-step development phases.

## 🏗️ Technology Stack

**Frontend:**

* Next.js 14+ (App Router)
* React 18+
* Tailwind CSS
* TypeScript
* Pusher-js (real-time updates)

**Backend:**

* Next.js API Routes (RESTful)
* NextAuth.js (OAuth authentication)
* Pusher (server-side)

**Database:**

* PostgreSQL (primary choice for relational data)
* Prisma ORM (type-safe database access)

**Deployment:**

* Vercel

---

## 📊 Database Schema Design

### Core Tables

```sql
-- Users
Table: users
- id: UUID (PK)
- user_id: STRING (unique, indexed) // Custom username like "ric2k1"
- name: STRING // Full name from OAuth
- email: STRING (unique)
- avatar_url: STRING
- bio: TEXT
- background_image_url: STRING
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

-- OAuth Accounts (NextAuth)
Table: accounts
- id: UUID (PK)
- user_id: UUID (FK -> users)
- provider: STRING (google/github/facebook)
- provider_account_id: STRING
- access_token: TEXT
- refresh_token: TEXT
- expires_at: INTEGER
- created_at: TIMESTAMP

-- Sessions
Table: sessions
- id: UUID (PK)
- user_id: UUID (FK -> users)
- session_token: STRING (unique, indexed)
- expires: TIMESTAMP

-- Posts
Table: posts
- id: UUID (PK)
- author_id: UUID (FK -> users)
- content: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- is_repost: BOOLEAN (default: false)
- original_post_id: UUID (FK -> posts, nullable)
- parent_post_id: UUID (FK -> posts, nullable) // For comments

-- Likes
Table: likes
- id: UUID (PK)
- user_id: UUID (FK -> users)
- post_id: UUID (FK -> posts)
- created_at: TIMESTAMP
- UNIQUE(user_id, post_id)

-- Follows
Table: follows
- id: UUID (PK)
- follower_id: UUID (FK -> users)
- following_id: UUID (FK -> users)
- created_at: TIMESTAMP
- UNIQUE(follower_id, following_id)

-- Drafts
Table: drafts
- id: UUID (PK)
- user_id: UUID (FK -> users)
- content: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

-- Hashtags
Table: hashtags
- id: UUID (PK)
- tag: STRING (unique, indexed)
- created_at: TIMESTAMP

-- Post Hashtags (junction table)
Table: post_hashtags
- post_id: UUID (FK -> posts)
- hashtag_id: UUID (FK -> hashtags)
- PRIMARY KEY(post_id, hashtag_id)

-- Mentions (junction table)
Table: mentions
- post_id: UUID (FK -> posts)
- user_id: UUID (FK -> users)
- PRIMARY KEY(post_id, user_id)
```

---

## 🎯 API Endpoints Design

### Authentication APIs

```
POST   /api/auth/callback/[provider]  # OAuth callbacks (NextAuth)
GET    /api/auth/session               # Get current session
POST   /api/auth/signout               # Sign out
POST   /api/auth/register              # Complete registration with userID
```

### User APIs

```
GET    /api/users/check-userid         # Check if userID is available
GET    /api/users/[userId]             # Get user profile
PUT    /api/users/[userId]             # Update user profile
GET    /api/users/[userId]/posts       # Get user's posts
GET    /api/users/[userId]/likes       # Get user's liked posts (private)
GET    /api/users/[userId]/followers   # Get followers list
GET    /api/users/[userId]/following   # Get following list
```

### Post APIs

```
POST   /api/posts                      # Create new post
GET    /api/posts                      # Get all posts (with filters)
GET    /api/posts/[postId]             # Get single post with comments
DELETE /api/posts/[postId]             # Delete post (author only)
POST   /api/posts/[postId]/like        # Toggle like
POST   /api/posts/[postId]/repost      # Repost
POST   /api/posts/[postId]/comment     # Add comment
GET    /api/posts/[postId]/comments    # Get all comments
```

### Follow APIs

```
POST   /api/follows/[userId]           # Follow user
DELETE /api/follows/[userId]           # Unfollow user
GET    /api/follows/status/[userId]    # Check follow status
```

### Draft APIs

```
GET    /api/drafts                     # Get all drafts
POST   /api/drafts                     # Save draft
DELETE /api/drafts/[draftId]           # Delete draft
```

---

## 🎨 Frontend Component Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx                  # Login page
│   └── register/
│       └── page.tsx                  # Registration with userID
├── (main)/
│   ├── layout.tsx                    # Main layout with sidebar
│   ├── home/
│   │   └── page.tsx                  # Home feed
│   ├── profile/
│   │   └── [userId]/
│   │       └── page.tsx              # User profile
│   └── post/
│       └── [postId]/
│           └── page.tsx              # Single post view
└── api/
    ├── auth/
    │   └── [...nextauth]/
    │       └── route.ts              # NextAuth configuration
    ├── users/
    ├── posts/
    ├── follows/
    └── drafts/

components/
├── layout/
│   ├── Sidebar.tsx                   # Main navigation sidebar
│   ├── Header.tsx
│   └── UserMenu.tsx                  # User avatar dropdown
├── post/
│   ├── PostCard.tsx                  # Single post display
│   ├── PostList.tsx                  # List of posts
│   ├── PostModal.tsx                 # Create post modal
│   ├── InlinePostComposer.tsx        # Inline post creation
│   ├── CommentSection.tsx
│   └── PostActions.tsx               # Like, repost, comment buttons
├── profile/
│   ├── ProfileHeader.tsx
│   ├── EditProfileModal.tsx
│   └── FollowButton.tsx
└── common/
    ├── Avatar.tsx
    ├── LinkPreview.tsx
    ├── HashtagLink.tsx
    └── MentionLink.tsx

lib/
├── prisma.ts                         # Prisma client
├── pusher.ts                         # Pusher configuration
├── auth.ts                           # NextAuth configuration
└── utils/
    ├── textParser.ts                 # Parse @mentions, #hashtags, URLs
    ├── characterCount.ts             # Calculate character count
    └── timeFormat.ts                 # Format relative time
```

---

## 🔐 Authentication Flow

### 1. Initial OAuth Setup (NextAuth Configuration)

```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "./prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user has completed registration (has user_id)
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      })
    
      if (!existingUser?.user_id) {
        // Redirect to registration page to set userID
        return '/register'
      }
      return true
    },
    async session({ session, user }) {
      session.user.id = user.id
      session.user.user_id = user.user_id
      return session
    }
  },
  pages: {
    signIn: '/login',
    newUser: '/register'
  }
}
```

### 2. Registration Flow

* User clicks OAuth provider (Google/GitHub/Facebook)
* OAuth completes, redirects to `/register`
* User enters desired `user_id` (validate: 3-15 chars, alphanumeric + underscore)
* Backend checks availability
* Save `user_id` to database
* Redirect to `/home`

---

## 📝 Text Parsing & Character Counting

### Character Count Rules Implementation

```typescript
// lib/utils/characterCount.ts
interface CharacterCountResult {
  count: number
  isValid: boolean
  links: string[]
  hashtags: string[]
  mentions: string[]
}

export function calculateCharacterCount(text: string): CharacterCountResult {
  const URL_LENGTH = 23
  const MAX_LENGTH = 280
  
  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const links = text.match(urlRegex) || []
  
  // Extract hashtags
  const hashtagRegex = /#[\w]+/g
  const hashtags = text.match(hashtagRegex) || []
  
  // Extract mentions
  const mentionRegex = /@[\w]+/g
  const mentions = text.match(mentionRegex) || []
  
  // Remove hashtags and mentions from counting
  let countableText = text
  hashtags.forEach(tag => {
    countableText = countableText.replace(tag, '')
  })
  mentions.forEach(mention => {
    countableText = countableText.replace(mention, '')
  })
  
  // Replace each URL with 23 characters
  links.forEach(link => {
    countableText = countableText.replace(link, 'x'.repeat(URL_LENGTH))
  })
  
  const count = countableText.length
  
  return {
    count,
    isValid: count <= MAX_LENGTH,
    links,
    hashtags,
    mentions
  }
}
```

---

## 🔄 Pusher Real-time Updates

### Setup

```typescript
// lib/pusher.ts (Server)
import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
})

// lib/pusher-client.ts (Client)
import PusherClient from 'pusher-js'

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
})
```

### Real-time Events

```typescript
// When a post is liked
pusher.trigger(`post-${postId}`, 'like-added', {
  postId,
  userId,
  likeCount: newCount
})

// When a comment is added
pusher.trigger(`post-${postId}`, 'comment-added', {
  postId,
  comment: newComment,
  commentCount: newCount
})

// When a repost happens
pusher.trigger(`post-${postId}`, 'repost-added', {
  postId,
  userId,
  repostCount: newCount
})
```

---

## 🚀 Development Phases

### Phase 1: Project Setup & Authentication (Week 1)

1. Initialize Next.js project with TypeScript
2. Setup Tailwind CSS
3. Setup PostgreSQL database (local or Supabase)
4. Configure Prisma ORM
5. Implement NextAuth with OAuth providers
6. Create login/register pages
7. Implement userID registration flow
8. Setup session management

**Deliverable:** Working authentication system

---

### Phase 2: Core Database & API (Week 1-2)

1. Create all Prisma schemas
2. Run migrations
3. Implement user CRUD APIs
4. Implement post CRUD APIs
5. Implement follow/unfollow APIs
6. Setup API error handling
7. Add API input validation

**Deliverable:** Complete RESTful API

---

### Phase 3: Main Layout & Sidebar (Week 2)

1. Create main layout component
2. Build sidebar navigation
   * Vector logo
   * Home button
   * Profile button
   * Post button (primary)
   * User menu with logout
3. Implement responsive design
4. Add hover effects and active states

**Deliverable:** Complete navigation system

---

### Phase 4: Post Creation (Week 2-3)

1. Build PostModal component
2. Implement text parser for:
   * URL detection and character counting
   * @mention parsing
   * #hashtag parsing
3. Add character counter display
4. Implement draft save/discard flow
5. Create drafts list modal
6. Build inline post composer

**Deliverable:** Complete post creation system

---

### Phase 5: Feed & Post Display (Week 3)

1. Create PostCard component
2. Implement post list with infinite scroll
3. Add "All" vs "Following" filter
4. Display post metadata (time, author, counts)
5. Implement recursive post/comment navigation
6. Add back navigation arrows
7. Format relative timestamps

**Deliverable:** Working feed system

---

### Phase 6: Interactions (Week 3-4)

1. Implement like/unlike functionality
2. Add repost feature
3. Build comment system (recursive)
4. Create delete post functionality
5. Add action buttons UI
6. Implement toggle states

**Deliverable:** Complete interaction system

---

### Phase 7: Profile Pages (Week 4)

1. Build profile header component
2. Display user stats (posts, followers, following)
3. Create EditProfile modal
4. Implement profile update API
5. Add follow/unfollow button
6. Create Posts/Likes tabs
7. Show user's posts and reposts

**Deliverable:** Complete profile system

---

### Phase 8: Real-time with Pusher (Week 4-5)

1. Setup Pusher server and client
2. Implement real-time like updates
3. Add real-time comment updates
4. Add real-time repost updates
5. Test with multiple accounts
6. Optimize event handling

**Deliverable:** Real-time interactions

---

### Phase 9: Polish & UX (Week 5)

1. Add loading states
2. Implement error boundaries
3. Add toast notifications
4. Optimize performance (React.memo, useMemo)
5. Add skeleton loaders
6. Implement smooth transitions
7. Mobile responsive design
8. Accessibility improvements (ARIA labels, keyboard navigation)

**Deliverable:** Production-ready UI

---

### Phase 10: Deployment (Week 5-6)

1. Setup environment variables in Vercel
2. Configure PostgreSQL connection (Vercel Postgres or Supabase)
3. Setup OAuth redirect URLs for production
4. Deploy to Vercel
5. Test all features in production
6. Setup monitoring and error tracking
7. Performance optimization

**Deliverable:** Live application on Vercel

---

## 🔑 Environment Variables

```bash
# .env.local
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="..."
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="..."
```

---

## 📱 Key UI/UX Considerations

### Post Modal Behavior

* Clicking "X" shows confirmation: "Save as draft" or "Discard"
* Draft saved with timestamp
* Can access drafts from "Drafts" button

### Feed Behavior

* Default to "All" posts
* "Following" shows posts from followed users + their reposts
* Sort by newest first (created_at DESC)
* Infinite scroll pagination

### Recursive Navigation

* Clicking a post shows post + all its comments
* Clicking a comment shows that comment + its replies
* Back arrow returns to previous level
* Breadcrumb trail maintained

### Real-time Updates

* Likes update immediately across all clients
* Comments append to list without page refresh
* Don't interrupt user's current scroll position
* Show notification badge for new posts at top

---

## 🧪 Testing Strategy

1. **Authentication Testing**
   * Test each OAuth provider
   * Test userID validation
   * Test session persistence
2. **API Testing**
   * Use Postman or Thunder Client
   * Test all CRUD operations
   * Test error cases
   * Test authorization checks
3. **Multi-user Testing**
   * Use two browsers (regular + incognito)
   * Test real-time updates
   * Test follow/unfollow
   * Test privacy (can't see others' likes)
4. **Mobile Testing**
   * Test responsive design
   * Test touch interactions
   * Test mobile OAuth flow

---

## 🎯 Success Criteria

✅ Users can register with any of 3 OAuth providers

✅ Each OAuth creates unique user account with custom userID

✅ Users can post with 280 character limit (URL = 23 chars)

✅ @mentions and #hashtags excluded from character count

✅ Users can like, comment, repost

✅ Users can follow/unfollow

✅ Profile pages show posts, stats, editable info

✅ Real-time updates via Pusher work across multiple users

✅ Recursive post/comment navigation works

✅ Drafts can be saved and retrieved

✅ App deployed and accessible on Vercel

---

## 📚 Additional Resources

* **Next.js Docs** : https://nextjs.org/docs
* **NextAuth.js** : https://next-auth.js.org/
* **Prisma** : https://www.prisma.io/docs
* **Pusher** : https://pusher.com/docs
* **Tailwind CSS** : https://tailwindcss.com/docs
* **Vercel Deployment** : https://vercel.com/docs

---

This plan provides a complete roadmap for building your Vector social network. Start with Phase 1 and progress sequentially. Each phase builds on the previous one, ensuring a solid foundation. Good luck with your project! 🚀
