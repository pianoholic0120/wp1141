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
          console.log('[Credentials] No user_id provided')
          return null
        }

        const userId = (credentials.user_id as string).trim()
        console.log('[Credentials] Looking for user_id:', userId)

        // Find user by user_id (case-sensitive)
        const user = await prisma.user.findUnique({
          where: { user_id: userId },
          include: {
            accounts: true
          }
        })

        if (!user) {
          console.log('[Credentials] User not found with user_id:', userId)
          return null
        }

        console.log('[Credentials] User found:', user.id, 'with', user.accounts?.length || 0, 'accounts')

        // User must have at least one OAuth account (registered through OAuth)
        if (!user.accounts || user.accounts.length === 0) {
          console.log('[Credentials] User has no OAuth accounts')
          return null
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          user_id: user.user_id,
          avatar_url: user.avatar_url,
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
      // Facebook automatically includes email in public_profile scope
      // Explicitly set authorization to only request public_profile
      // This prevents NextAuth from requesting the invalid 'email' scope
      authorization: {
        params: {
          scope: 'public_profile',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if user has user_id
      if (account && account.provider !== 'userid') {
        // Handle case where email might be undefined (e.g., Facebook with only public_profile)
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { user_id: true }
          })
          
          // If user exists but has no user_id, allow sign in (will redirect to register)
          // If user doesn't exist, PrismaAdapter will create it
        }
        // Always allow sign in - PrismaAdapter will handle user creation
        // Even if email is undefined, PrismaAdapter can create user with account relation
        return true
      }
      // Allow credentials provider sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // After OAuth callback, redirect to base URL
      // Client-side will check user_id and redirect to /register if needed
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to base URL (client-side will check user_id)
      return baseUrl
    },
    async session({ session, user, token }) {
      // Since we're using JWT strategy, always use token
      if (token) {
        session.user.id = token.id as string
        session.user.user_id = token.user_id as string | null
        session.user.avatar_url = token.avatar_url as string | null
        session.user.name = token.name as string | null
        session.user.email = token.email as string | null
        // Use avatar_url first, then image, then fallback
        session.user.image = (token.avatar_url as string | null) || (token.image as string | null) || null
      }
      return session
    },
    async jwt({ token, user, account, profile, trigger }) {
      // Initial sign in - fetch user data from database
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
          // Handle case where email might be undefined (e.g., Facebook with only public_profile)
          if (user.email) {
            // Use email to find user (more reliable for new OAuth users)
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
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
              token.name = dbUser.name || user.name
              // Priority: avatar_url > image > user.image
              token.image = dbUser.avatar_url || dbUser.image || user.image
            } else {
              // New user from OAuth - user will be created by PrismaAdapter
              // But for JWT, we need to set initial values
              token.id = user.id
              token.email = user.email
              token.name = user.name
              token.image = user.image
              token.user_id = null
              token.avatar_url = null
            }
          } else {
            // No email provided (e.g., Facebook user without email permission)
            // Try to find user by account provider and providerAccountId
            if (account && account.provider && account.providerAccountId) {
              const accountRecord = await prisma.account.findUnique({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                  }
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      user_id: true,
                      email: true,
                      name: true,
                      image: true,
                      avatar_url: true,
                    }
                  }
                }
              })
              
              if (accountRecord && accountRecord.user) {
                token.id = accountRecord.user.id
                token.user_id = accountRecord.user.user_id
                token.avatar_url = accountRecord.user.avatar_url
                token.email = accountRecord.user.email
                token.name = accountRecord.user.name || user.name
                token.image = accountRecord.user.avatar_url || accountRecord.user.image || user.image
              } else {
                // New user without email - will be created by PrismaAdapter
                token.id = user.id
                token.email = null
                token.name = user.name
                token.image = user.image
                token.user_id = null
                token.avatar_url = null
              }
            } else {
              // Fallback: set basic values
              token.id = user.id
              token.email = null
              token.name = user.name
              token.image = user.image
              token.user_id = null
              token.avatar_url = null
            }
          }
        }
      }
      
      // Refresh token when session is updated (e.g., after profile update)
      if (trigger === 'update') {
        // Try to find user by email first
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
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
            token.name = dbUser.name
            token.image = dbUser.avatar_url || dbUser.image
          }
        } else if (token.id) {
          // Fallback: find by ID if no email
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
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
            token.image = dbUser.avatar_url || dbUser.image
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

