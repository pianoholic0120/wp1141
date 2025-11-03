'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [userId, setUserId] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

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

  const handleUserIdLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim()) {
      return
    }

    setLoginError(null)
    setIsLoggingIn(true)
    try {
      const result = await signIn('userid', {
        redirect: false,
        user_id: userId.trim(),
      })

      if (result?.error) {
        console.error('[Login] UserID login failed:', result.error)
        setLoginError('Invalid User ID. Please check and try again, or use OAuth to register first.')
      } else if (result?.ok) {
        window.location.href = '/home'
      }
    } catch (error) {
      console.error('[Login] UserID login error:', error)
      setLoginError('Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
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

        <div className="space-y-4">
          {/* UserID Login Form */}
          <form onSubmit={handleUserIdLogin} className="space-y-3">
            <div>
              <input
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value)
                  setLoginError(null)
                }}
                placeholder="Enter your User ID"
                className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-white placeholder-gray-500"
                disabled={isLoggingIn}
              />
              {loginError && (
                <p className="mt-2 text-sm text-red-500">{loginError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!userId.trim() || isLoggingIn}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-full transition-colors"
            >
              {isLoggingIn ? 'Logging in...' : 'Login with User ID'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
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
    </div>
  )
}

