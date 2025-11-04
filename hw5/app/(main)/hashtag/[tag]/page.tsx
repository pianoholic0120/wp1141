'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import PostCard from '@/components/post/PostCard'
import { getPusherClient } from '@/lib/pusher-client'

interface Post {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    user_id: string | null
    name: string | null
    avatar_url: string | null
    image: string | null
  }
  originalPost?: Post | null
  isLiked: boolean
  likeCount: number
  commentCount: number
  repostCount: number
  is_repost?: boolean
}

export default function HashtagPage() {
  const params = useParams()
  const router = useRouter()
  const tag = decodeURIComponent(params.tag as string)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/hashtags/${encodeURIComponent(tag)}/posts`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      setPosts(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setLoading(false)
    }
  }, [tag])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Setup Pusher for real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return

    const pusherClient = getPusherClient()
    if (!pusherClient) return

    // Subscribe to individual post channels for likes/comments
    const postChannels = posts.map(post => {
      const postChannel = pusherClient.subscribe(`post-${post.id}`)

      const handleLikeAdded = (data: { postId: string, likeCount: number }) => {
        setPosts(prev => prev.map(p =>
          p.id === data.postId ? { ...p, likeCount: data.likeCount, isLiked: true } : p
        ))
      }

      const handleLikeRemoved = (data: { postId: string, likeCount: number }) => {
        setPosts(prev => prev.map(p =>
          p.id === data.postId ? { ...p, likeCount: data.likeCount, isLiked: false } : p
        ))
      }

      const handleCommentAdded = (data: { postId: string, commentCount?: number }) => {
        setPosts(prev => prev.map(p =>
          p.id === data.postId ? { ...p, commentCount: data.commentCount ?? p.commentCount + 1 } : p
        ))
      }

      const handleRepostAdded = (data: { postId: string, repostCount: number }) => {
        setPosts(prev => prev.map(p =>
          p.id === data.postId ? { ...p, repostCount: data.repostCount } : p
        ))
      }

      const handleRepostRemoved = (data: { postId: string, repostCount: number }) => {
        setPosts(prev => prev.map(p =>
          p.id === data.postId ? { ...p, repostCount: data.repostCount } : p
        ))
      }

      postChannel.bind('like-added', handleLikeAdded)
      postChannel.bind('like-removed', handleLikeRemoved)
      postChannel.bind('comment-added', handleCommentAdded)
      postChannel.bind('repost-added', handleRepostAdded)
      postChannel.bind('repost-removed', handleRepostRemoved)

      return { channel: postChannel, postId: post.id }
    })

    return () => {
      postChannels.forEach(({ channel, postId }) => {
        channel.unbind_all()
        pusherClient.unsubscribe(`post-${postId}`)
      })
    }
  }, [posts])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
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
          <h1 className="text-xl font-bold">#{tag}</h1>
          <p className="text-sm text-gray-500">{posts.length} Posts</p>
        </div>
      </div>

      {/* Post List */}
      {posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">No posts found with this hashtag</div>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  )
}

