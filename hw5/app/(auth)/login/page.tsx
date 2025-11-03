'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && !isRedirecting) {
      console.log('[Login] Authenticated, user_id:', session?.user?.user_id)
      setIsRedirecting(true)
      
      // Immediate redirect with window.location
      if (session?.user?.user_id) {
        console.log('[Login] Redirecting to /home')
        window.location.href = '/home'
      } else {
        console.log('[Login] Redirecting to /register')
        window.location.href = '/register'
      }
    }
  }, [session, status, isRedirecting])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-500">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">V</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Vector</h1>
          <p className="text-gray-500">Join the conversation</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              console.log('[Login] Starting Google sign in')
              signIn('google', { redirect: true })
            }}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors"
          >
            Continue with Google
          </button>

          <button
            onClick={() => {
              console.log('[Login] Starting GitHub sign in')
              signIn('github', { redirect: true })
            }}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors"
          >
            Continue with GitHub
          </button>

          <button
            onClick={() => {
              console.log('[Login] Starting Facebook sign in')
              signIn('facebook', { redirect: true })
            }}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-full hover:bg-gray-200 transition-colors"
          >
            Continue with Facebook
          </button>
        </div>
      </div>
    </div>
  )
}

