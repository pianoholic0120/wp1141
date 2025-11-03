'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (hasRedirected || status === 'loading') return

    setHasRedirected(true)

    // Small delay to ensure state is stable
    setTimeout(() => {
      if (status === 'authenticated') {
        if (session?.user?.user_id) {
          console.log('[Root] Has user_id, redirecting to /home')
          window.location.href = '/home'
        } else {
          console.log('[Root] No user_id, redirecting to /register')
          window.location.href = '/register'
        }
      } else if (status === 'unauthenticated') {
        console.log('[Root] Not authenticated, redirecting to /login')
        window.location.href = '/login'
      }
    }, 100)
  }, [session, status, router, hasRedirected])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-gray-500">Loading...</div>
    </div>
  )
}

