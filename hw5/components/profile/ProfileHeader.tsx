'use client'

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Avatar from '../common/Avatar'
import EditProfileModal from './EditProfileModal'
import FollowButton from './FollowButton'
import FollowListModal from './FollowListModal'
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

interface ProfileHeaderProps {
  user: User
  onUpdate?: () => void
}

export default function ProfileHeader({ user, onUpdate }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState(false)
  const [followModalType, setFollowModalType] = useState<'followers' | 'following'>('followers')
  const [followerCount, setFollowerCount] = useState(user.followerCount)
  const { data: session } = useSession()

  // Update follower count when user prop changes
  useEffect(() => {
    setFollowerCount(user.followerCount)
  }, [user.followerCount])

  // Listen for real-time follow updates
  useEffect(() => {
    if (typeof window === 'undefined' || !user.id) return

    const pusherClient = getPusherClient()
    if (!pusherClient) return

    const channel = pusherClient.subscribe(`user-${user.id}`)

    const handleFollowAdded = (data: { followerCount: number }) => {
      setFollowerCount(data.followerCount)
      if (onUpdate) onUpdate()
    }

    const handleFollowRemoved = (data: { followerCount: number }) => {
      setFollowerCount(data.followerCount)
      if (onUpdate) onUpdate()
    }

    channel.bind('follow-added', handleFollowAdded)
    channel.bind('follow-removed', handleFollowRemoved)

    return () => {
      channel.unbind('follow-added', handleFollowAdded)
      channel.unbind('follow-removed', handleFollowRemoved)
      pusherClient.unsubscribe(`user-${user.id}`)
    }
  }, [user.id, onUpdate])

  return (
    <div className="border-b border-border">
      {/* Background Image */}
      <div className="h-48 bg-gray-800 relative overflow-hidden">
        {user.background_image_url ? (
          <img
            src={user.background_image_url}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : null}
        
        {/* Edit Profile / Follow Button - positioned at bottom right of background */}
        <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
          {user.isOwnProfile ? (
            <button
              onClick={() => {
                console.log('[ProfileHeader] Edit Profile button clicked')
                setShowEditModal(true)
              }}
              className="px-4 py-2 border border-border rounded-full hover:bg-gray-900 transition-colors font-semibold bg-background/90 backdrop-blur-sm cursor-pointer relative z-20"
            >
              Edit Profile
            </button>
          ) : session?.user ? (
            <div className="bg-background/90 backdrop-blur-sm rounded-full relative z-20 pointer-events-auto">
              <FollowButton
                userId={user.user_id!}
                isFollowing={user.isFollowing}
                onUpdate={onUpdate}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-4 relative z-10">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4 z-10">
          <Avatar
            src={user.avatar_url || user.image || undefined}
            alt={user.name || 'User'}
            size={128}
            className="border-4 border-background"
          />
        </div>

        {/* User Info */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{user.name || 'Anonymous'}</h2>
          <p className="text-gray-500">@{user.user_id || 'user'}</p>
          {user.bio && (
            <p className="mt-4">{user.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex space-x-4 text-sm">
          <span>
            <span className="font-semibold">{user.postCount}</span> Posts
          </span>
          <button
            onClick={() => {
              setFollowModalType('followers')
              setShowFollowModal(true)
            }}
            className="hover:underline transition-colors"
          >
            <span className="font-semibold">{followerCount}</span> Followers
          </button>
          <button
            onClick={() => {
              setFollowModalType('following')
              setShowFollowModal(true)
            }}
            className="hover:underline transition-colors"
          >
            <span className="font-semibold">{user.followingCount}</span> Following
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            if (onUpdate) onUpdate()
          }}
        />
      )}

      {showFollowModal && user.user_id && (
        <FollowListModal
          isOpen={showFollowModal}
          onClose={() => setShowFollowModal(false)}
          userId={user.user_id}
          type={followModalType}
        />
      )}
    </div>
  )
}

