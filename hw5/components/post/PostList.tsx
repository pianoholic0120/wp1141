'use client'

import { useState, useEffect, useCallback } from 'react'
import PostCard from './PostCard'
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
}

interface PostListProps {
  filter?: 'all' | 'following'
  parentId?: string | null
  userId?: string
  likesOnly?: boolean
}

export default function PostList({ filter = 'all', parentId = null, userId, likesOnly = false }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    try {
      let url = '/api/posts'
      if (userId && likesOnly) {
        url = `/api/users/${userId}/likes`
      } else if (userId) {
        url = `/api/users/${userId}/posts`
      } else {
        url = `/api/posts?filter=${filter}${parentId ? `&parentId=${parentId}` : ''}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      setPosts(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setLoading(false)
    }
  }, [filter, parentId, userId, likesOnly])

  useEffect(() => {
    setLoading(true)
    fetchPosts()
  }, [fetchPosts])

  // Setup Pusher for real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return

    const pusherClient = getPusherClient()
    if (!pusherClient) return

    const channel = pusherClient.subscribe('posts')
    
    const handleNewPost = (data: { post: Post }) => {
      if (!parentId) {
        setPosts(prev => {
          // Check if post already exists to prevent duplicates
          const exists = prev.some(p => p.id === data.post.id)
          if (exists) {
            return prev
          }
          return [data.post, ...prev]
        })
      }
    }
    
    channel.bind('new-post', handleNewPost)

    // If showing comments (parentId exists), subscribe to parent post channel for new comments
    if (parentId) {
      const parentChannel = pusherClient.subscribe(`post-${parentId}`)
      
      const handleNewComment = (data: { postId: string, commentCount?: number, comment?: Post }) => {
        if (data.comment && parentId === data.postId) {
          // Add new comment to the list and refresh
          fetchPosts()
        }
      }
      
      parentChannel.bind('comment-added', handleNewComment)

      // Also subscribe to individual comment channels for likes
      const commentChannels = posts.map(post => {
        const commentChannel = pusherClient!.subscribe(`post-${post.id}`)
        
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

        commentChannel.bind('like-added', handleLikeAdded)
        commentChannel.bind('like-removed', handleLikeRemoved)

        return { channel: commentChannel, postId: post.id }
      })

      return () => {
        channel.unbind('new-post', handleNewPost)
        pusherClient!.unsubscribe('posts')
        parentChannel.unbind('comment-added', handleNewComment)
        pusherClient!.unsubscribe(`post-${parentId}`)
        commentChannels.forEach(({ channel: commentChannel, postId }) => {
          commentChannel.unbind_all()
          pusherClient!.unsubscribe(`post-${postId}`)
        })
      }
    }

    // Subscribe to individual post channels for likes/comments (for main feed)
    const postChannels = posts.map(post => {
      const postChannel = pusherClient!.subscribe(`post-${post.id}`)
      
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
      channel.unbind('new-post', handleNewPost)
      pusherClient!.unsubscribe('posts')
      postChannels.forEach(({ channel: postChannel, postId }) => {
        postChannel.unbind_all()
        pusherClient!.unsubscribe(`post-${postId}`)
      })
    }
  }, [posts, parentId, fetchPosts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">No posts yet</div>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
      ))}
    </div>
  )
}

