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
    setIsLoading(true)
    try {
      const res = await fetch(`/api/follows/${userId}`, {
        method: isFollowing ? 'DELETE' : 'POST'
      })

      if (!res.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'}`)
      }

      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? 'Unfollowed' : 'Following!')
      if (onUpdate) onUpdate()
    } catch (error) {
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
      className={`px-4 py-2 rounded-full font-semibold transition-colors disabled:opacity-50 cursor-pointer relative z-20 ${
        isFollowing
          ? 'border border-border hover:bg-gray-900'
          : 'bg-white text-black hover:bg-gray-200'
      }`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}

