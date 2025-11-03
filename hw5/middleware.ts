import { withAuth } from "next-auth/middleware"

// JWT strategy - token will be available in authorized callback
export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token }) => {
      // For JWT strategy, token contains the session data
      // Allow access if token exists
      return !!token
    },
  },
})

export const config = {
  matcher: [
    '/home/:path*',
    '/profile/:path*',
    '/post/:path*',
  ]
}

