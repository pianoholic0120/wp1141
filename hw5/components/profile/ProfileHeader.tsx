'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Avatar from '../common/Avatar'
import EditProfileModal from './EditProfileModal'
import FollowButton from './FollowButton'

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
  const { data: session } = useSession()

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
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-4 relative">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <Avatar
            src={user.avatar_url || user.image || undefined}
            alt={user.name || 'User'}
            size={128}
            className="border-4 border-background"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end mb-4">
          {user.isOwnProfile ? (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 border border-border rounded-full hover:bg-gray-900 transition-colors font-semibold"
            >
              Edit Profile
            </button>
          ) : session?.user ? (
            <FollowButton
              userId={user.user_id!}
              isFollowing={user.isFollowing}
              onUpdate={onUpdate}
            />
          ) : null}
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
          <span>
            <span className="font-semibold">{user.followerCount}</span> Followers
          </span>
          <span>
            <span className="font-semibold">{user.followingCount}</span> Following
          </span>
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
    </div>
  )
}

