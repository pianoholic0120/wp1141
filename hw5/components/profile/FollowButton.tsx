'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onUpdate?: () => void
}

export default function FollowButton({ userId, isFollowing: initialIsFollowing, onUpdate }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    // Optimistic update - immediately update UI for better UX
    const newFollowingState = !isFollowing
    setIsFollowing(newFollowingState)
    setIsLoading(true)
    
    try {
      const res = await fetch(`/api/follows/${userId}`, {
        method: isFollowing ? 'DELETE' : 'POST'
      })

      if (!res.ok) {
        // Revert on error
        setIsFollowing(isFollowing)
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'}`)
      }

      // Success - state is already updated
      toast.success(newFollowingState ? 'Following!' : 'Unfollowed')
      if (onUpdate) onUpdate()
    } catch (error) {
      // Revert on error
      setIsFollowing(isFollowing)
      toast.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('[FollowButton] Button clicked, userId:', userId)
        handleToggle()
      }}
      disabled={isLoading}
      className={`px-4 py-2 rounded-full font-semibold transition-all duration-150 disabled:opacity-50 cursor-pointer relative z-20 ${
        isFollowing
          ? 'border border-border hover:bg-gray-900'
          : 'bg-white text-black hover:bg-gray-200'
      }`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

