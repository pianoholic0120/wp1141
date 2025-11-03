import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // UserID login (must be first to show in login UI)
    CredentialsProvider({
      id: "userid",
      name: "User ID",
      credentials: {
        user_id: { label: "User ID", type: "text", placeholder: "your_user_id" }
      },
      async authorize(credentials) {
        if (!credentials?.user_id) {
          return null
        }

        // Find user by user_id
        const user = await prisma.user.findUnique({
          where: { user_id: credentials.user_id as string },
          include: {
            accounts: true
          }
        })

        if (!user) {
          return null
        }

        // User must have at least one OAuth account (registered through OAuth)
        if (!user.accounts || user.accounts.length === 0) {
          return null
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          user_id: user.user_id,
        }
      }
    }),
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
      // Allow sign in - we'll handle user_id registration separately
      return true
    },
    async redirect({ url, baseUrl }) {
      // After OAuth callback, redirect based on callbackUrl parameter
      // If callbackUrl is provided and safe, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Otherwise redirect to base URL (will be handled by client-side routing)
      return baseUrl
    },
    async session({ session, user, token }) {
      // Handle credentials provider (token-based) vs adapter (user-based)
      if (user) {
        // Database session (from adapter)
        session.user.id = user.id
        session.user.user_id = (user as any).user_id || null
        session.user.avatar_url = (user as any).avatar_url || null
        session.user.name = (user as any).name || session.user.name
        session.user.image = (user as any).image || session.user.image
      } else if (token) {
        // JWT session (from credentials provider)
        session.user.id = token.id as string
        session.user.user_id = token.user_id as string | null
        session.user.avatar_url = token.avatar_url as string | null
        session.user.name = token.name as string | null
        session.user.email = token.email as string | null
        session.user.image = token.image as string | null
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // When user signs in (credentials or OAuth), persist user data in token
      if (user) {
        // For credentials provider, user object is already complete
        if ((user as any).user_id) {
          token.id = user.id
          token.user_id = (user as any).user_id
          token.avatar_url = (user as any).avatar_url
          token.email = user.email
          token.name = user.name
          token.image = user.image
        } else {
          // For OAuth provider, fetch user data from database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              user_id: true,
              email: true,
              name: true,
              image: true,
              avatar_url: true,
            }
          })
          
          if (dbUser) {
            token.id = dbUser.id
            token.user_id = dbUser.user_id
            token.avatar_url = dbUser.avatar_url
            token.email = dbUser.email
            token.name = dbUser.name
            token.image = dbUser.image || dbUser.avatar_url
          }
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt", // Use JWT for credentials provider compatibility
  },
}

