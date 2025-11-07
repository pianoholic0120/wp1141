'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import Sidebar from '@/components/layout/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // Only redirect once
    if (hasRedirected.current) return
    
    console.log('[MainLayout] Status:', status, 'Has user_id:', !!session?.user?.user_id)
    
    if (status === 'unauthenticated') {
      console.log('[MainLayout] Unauthenticated, redirecting to /login')
      hasRedirected.current = true
      window.location.href = '/login'
    } else if (status === 'authenticated' && !session?.user?.user_id) {
      console.log('[MainLayout] No user_id, redirecting to /register')
      hasRedirected.current = true
      window.location.href = '/register'
    }
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Don't render if not authenticated or no user_id
  if (status === 'unauthenticated' || !session?.user?.user_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-500">Redirecting...</div>
      </div>
    )
  }

  console.log('[MainLayout] Rendering home with user:', session.user.user_id)
  console.log('[MainLayout] About to render Sidebar component')
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}

