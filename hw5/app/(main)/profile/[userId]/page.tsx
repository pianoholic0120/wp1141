'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import PostList from '@/components/post/PostList'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      const data = await res.json()
      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">User not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border p-4 flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-900 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.postCount} Posts</p>
        </div>
      </div>

      {/* Profile Header */}
      <ProfileHeader user={user} onUpdate={() => {
        fetchUser()
        setRefreshKey(prev => prev + 1)
      }} />

      {/* Tabs */}
      {user.isOwnProfile && (
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${
              activeTab === 'likes'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Likes
          </button>
        </div>
      )}

      {/* Post List */}
      <div key={refreshKey}>
        <PostList
          userId={userId}
          likesOnly={activeTab === 'likes' && user.isOwnProfile}
        />
      </div>
    </div>
  )
}

