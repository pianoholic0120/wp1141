'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Avatar from '../common/Avatar'
import FollowButton from './FollowButton'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  user_id: string | null
  name: string | null
  avatar_url: string | null
  image: string | null
  bio: string | null
  isFollowing?: boolean
}

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'followers' | 'following'
}

export default function FollowListModal({ isOpen, onClose, userId, type }: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (!isOpen || !userId) return

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/users/${userId}/${type}`)
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        
        // Fetch follow status for each user if we have a session
        if (session?.user) {
          const usersWithStatus = await Promise.all(
            data.map(async (u: User) => {
              try {
                const statusRes = await fetch(`/api/follows/status/${u.user_id}`)
                if (statusRes.ok) {
                  const statusData = await statusRes.json()
                  return { ...u, isFollowing: statusData.isFollowing }
                }
              } catch (error) {
                console.error('Error checking follow status:', error)
              }
              return { ...u, isFollowing: false }
            })
          )
          setUsers(usersWithStatus)
        } else {
          setUsers(data.map((u: User) => ({ ...u, isFollowing: false })))
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [isOpen, userId, type, session])

  const handleUserClick = (user_id: string | null) => {
    if (!user_id) return
    onClose()
    router.push(`/profile/${user_id}`)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-900 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold capitalize">{type}</h2>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>

          {/* User List */}
          <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No {type === 'followers' ? 'followers' : 'following'} yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => handleUserClick(user.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar
                          src={user.avatar_url || user.image || undefined}
                          alt={user.name || 'User'}
                          size={48}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{user.name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-500 truncate">
                            @{user.user_id || 'user'}
                          </div>
                          {user.bio && (
                            <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {user.bio}
                            </div>
                          )}
                        </div>
                      </div>
                      {session?.user && session.user.user_id !== user.user_id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="ml-4"
                        >
                          <FollowButton
                            userId={user.user_id!}
                            isFollowing={user.isFollowing || false}
                            onUpdate={() => {
                              // Refresh the list to update follow status
                              const fetchUsers = async () => {
                                try {
                                  const res = await fetch(`/api/users/${userId}/${type}`)
                                  if (!res.ok) throw new Error('Failed to fetch users')
                                  const data = await res.json()
                                  // Fetch follow status for each user
                                  const usersWithStatus = await Promise.all(
                                    data.map(async (u: User) => {
                                      try {
                                        const statusRes = await fetch(`/api/follows/status/${u.user_id}`)
                                        if (statusRes.ok) {
                                          const statusData = await statusRes.json()
                                          return { ...u, isFollowing: statusData.isFollowing }
                                        }
                                      } catch (error) {
                                        console.error('Error checking follow status:', error)
                                      }
                                      return { ...u, isFollowing: false }
                                    })
                                  )
                                  setUsers(usersWithStatus)
                                } catch (error) {
                                  console.error(`Error fetching ${type}:`, error)
                                }
                              }
                              fetchUsers()
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

