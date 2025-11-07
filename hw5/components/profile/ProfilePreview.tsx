'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Avatar from '../common/Avatar'
import FollowButton from './FollowButton'
import { getPusherClient } from '@/lib/pusher-client'

interface User {
  id: string
  user_id: string | null
  name: string | null
  email: string | null
  avatar_url: string | null
  image: string | null
  bio: string | null
  background_image_url: string | null
  postCount: number
  followerCount: number
  followingCount: number
  isFollowing: boolean
  isOwnProfile: boolean
}

interface ProfilePreviewProps {
  userId: string | null
  onClose?: () => void
}

export default function ProfilePreview({ userId, onClose }: ProfilePreviewProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (!userId) {
      setUser(null)
      return
    }

    const fetchUser = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (!res.ok) throw new Error('Failed to fetch user')
        const data = await res.json()
        setUser(data)
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  // Listen for real-time follow updates
  useEffect(() => {
    const userIdValue = user?.id
    if (!userIdValue || typeof window === 'undefined') return

    const pusherClient = getPusherClient()
    if (!pusherClient) return

    const channel = pusherClient.subscribe(`user-${userIdValue}`)

    const handleFollowAdded = (data: { followerCount: number }) => {
      setUser(prev => prev ? { ...prev, followerCount: data.followerCount, isFollowing: true } : null)
    }

    const handleFollowRemoved = (data: { followerCount: number }) => {
      setUser(prev => prev ? { ...prev, followerCount: data.followerCount, isFollowing: false } : null)
    }

    channel.bind('follow-added', handleFollowAdded)
    channel.bind('follow-removed', handleFollowRemoved)

    return () => {
      channel.unbind('follow-added', handleFollowAdded)
      channel.unbind('follow-removed', handleFollowRemoved)
      pusherClient.unsubscribe(`user-${userIdValue}`)
    }
  }, [user?.id])

  if (!userId) return null

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-gray-500 text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-gray-500 text-center">User not found</div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Background Image */}
      <div className="h-32 bg-gray-800 relative overflow-hidden">
        {user.background_image_url ? (
          <img
            src={user.background_image_url}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : null}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 relative">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4">
          <Avatar
            src={user.avatar_url || user.image || undefined}
            alt={user.name || 'User'}
            size={64}
            className="border-4 border-card"
          />
        </div>

        {/* Follow Button */}
        {!user.isOwnProfile && session?.user && (
          <div className="mb-4">
            <FollowButton
              userId={user.user_id!}
              isFollowing={user.isFollowing}
              onUpdate={() => {
                // Refresh user data
                const fetchUser = async () => {
                  try {
                    const res = await fetch(`/api/users/${userId}`)
                    if (res.ok) {
                      const data = await res.json()
                      setUser(data)
                    }
                  } catch (error) {
                    console.error('Error fetching user:', error)
                  }
                }
                fetchUser()
              }}
            />
          </div>
        )}

        {/* User Info */}
        <div className="mb-4">
          <h2 className="text-xl font-bold">{user.name || 'Anonymous'}</h2>
          <p className="text-gray-500 text-sm">@{user.user_id || 'user'}</p>
          {user.bio && (
            <p className="mt-2 text-sm">{user.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex space-x-4 text-sm">
          <span>
            <span className="font-semibold">{user.postCount}</span> Posts
          </span>
          <span>
            <span className="font-semibold">{user.followerCount}</span> Followers
          </span>
          <span>
            <span className="font-semibold">{user.followingCount}</span> Following
          </span>
        </div>

        {/* View Full Profile Button */}
        <button
          onClick={() => {
            router.push(`/profile/${user.user_id}`)
            if (onClose) onClose()
          }}
          className="mt-4 w-full px-4 py-2 border border-border rounded-full hover:bg-gray-900 transition-colors font-semibold"
        >
          View Full Profile
        </button>
      </div>
    </div>
  )
}

