import { withAuth } from "next-auth/middleware"

// For database session strategy, we need to check the request differently
export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ req, token }) => {
      // For database strategy, token might be null but session cookie exists
      // Allow access if there's a session cookie
      const sessionToken = req.cookies.get('next-auth.session-token') || 
                          req.cookies.get('__Secure-next-auth.session-token')
      
      console.log('[Middleware] Has session cookie:', !!sessionToken)
      
      // If there's a session cookie or token, allow access
      return !!sessionToken || !!token
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

