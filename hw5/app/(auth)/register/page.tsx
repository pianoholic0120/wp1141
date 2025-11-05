'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import toast from 'react-hot-toast'

const userIdSchema = z.string().min(3).max(15).regex(/^[a-zA-Z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores')

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.user_id) {
      // User already has user_id, redirect to home
      router.push('/home')
    }
    // If authenticated but no user_id, stay on register page
  }, [session, status, router])

  const checkUserId = async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null)
      return
    }

    const validation = userIdSchema.safeParse(value)
    if (!validation.success) {
      setIsAvailable(false)
      return
    }

    setIsChecking(true)
    try {
      const res = await fetch(`/api/users/check-userid?user_id=${encodeURIComponent(value)}`)
      const data = await res.json()
      setIsAvailable(data.available)
    } catch (error) {
      setIsAvailable(false)
    } finally {
      setIsChecking(false)
    }
  }

  const handleUserIdChange = (value: string) => {
    setUserId(value)
    checkUserId(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = userIdSchema.safeParse(userId)
    if (!validation.success) {
      toast.error(validation.error.errors[0].message)
      return
    }

    if (!isAvailable) {
      toast.error('User ID is not available')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Registration failed')
      }

      toast.success('Registration complete!')
      
      // Refresh the session to get updated user_id
      const { update } = await import('next-auth/react')
      
      // Trigger session update
      await update()
      
      // Wait a bit longer for session to fully update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Force a full page reload to ensure session is updated
      console.log('[Register] Complete, redirecting to /home')
      window.location.href = '/home'
    } catch (error: any) {
      toast.error(error.message || 'Registration failed')
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">V</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Choose your User ID</h1>
          <p className="text-gray-500">This is how others will find you on Vector</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={userId}
              onChange={(e) => handleUserIdChange(e.target.value)}
              placeholder="user_id"
              className="w-full bg-transparent border border-border rounded-lg px-4 py-3 outline-none focus:border-primary text-lg"
              maxLength={15}
            />
            <div className="mt-2 text-sm text-gray-500">
              {isChecking && 'Checking...'}
              {!isChecking && isAvailable === true && (
                <span className="text-green-500">✓ Available</span>
              )}
              {!isChecking && isAvailable === false && (
                <span className="text-red-500">✗ Not available</span>
              )}
              {userId && isAvailable === null && (
                <span className="text-gray-500">3-15 characters, letters, numbers, and underscores only</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isAvailable || isSubmitting || isChecking}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-full transition-colors"
          >
            {isSubmitting ? 'Creating account...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

