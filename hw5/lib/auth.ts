import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
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
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        // PrismaAdapter automatically includes all user fields in the user object
        session.user.user_id = (user as any).user_id || null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "database",
  },
}

