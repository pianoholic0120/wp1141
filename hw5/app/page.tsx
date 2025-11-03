'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

export default function RootPage() {
  const { data: session, status } = useSession()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return

    // Prevent multiple redirects
    if (hasRedirected.current) return
    hasRedirected.current = true

    // Redirect based on authentication status
    if (status === 'authenticated') {
      if (session?.user?.user_id) {
        console.log('[Root] Has user_id, redirecting to /home')
        window.location.href = '/home'
      } else {
        console.log('[Root] No user_id, redirecting to /register')
        window.location.href = '/register'
      }
    } else {
      // status === 'unauthenticated'
      console.log('[Root] Not authenticated, redirecting to /login')
      window.location.href = '/login'
    }
  }, [session, status])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-gray-500">Loading...</div>
    </div>
  )
}

