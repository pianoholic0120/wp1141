'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import PostCard from './PostCard'
import { getPusherClient } from '@/lib/pusher-client'
import { ChevronUpIcon } from '@heroicons/react/24/outline'
import Avatar from '../common/Avatar'
import { useSession } from 'next-auth/react'

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
  visibility?: 'public' | 'followers' | 'mentioned'
  replySettings?: 'everyone' | 'followers' | 'mentioned'
}

interface PostListProps {
  filter?: 'all' | 'following'
  parentId?: string | null
  userId?: string
  likesOnly?: boolean
  onMentionClick?: (userId: string, event: React.MouseEvent) => void
}

export default function PostList({ filter = 'all', parentId = null, userId, likesOnly = false, onMentionClick }: PostListProps) {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPosts, setNewPosts] = useState<Post[]>([]) // Track new posts that haven't been shown
  const [showNewPostNotice, setShowNewPostNotice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSeenPostIdsRef = useRef<Set<string>>(new Set()) // Track posts that were visible when loaded

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
      
      // Track initial post IDs when loading
      if (data.length > 0) {
        lastSeenPostIdsRef.current = new Set(data.map((p: Post) => p.id))
      }
      
      // Clear new posts notice when manually refreshing
      setNewPosts([])
      setShowNewPostNotice(false)
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
    
    const handleNewPost = async (data: { post: Post }) => {
      if (!parentId) {
        const post = data.post
        const postVisibility = post.visibility || 'public'
        const currentUserId = session?.user?.id
        const isOwnPost = currentUserId === post.author.id

        // Post author can always see their own posts
        if (isOwnPost) {
          // Continue with normal flow
        } else if (postVisibility === 'public') {
          // Public posts: everyone can see
          // Continue with normal flow
        } else if (postVisibility === 'followers' || postVisibility === 'mentioned') {
          // For non-public posts, we need to verify visibility on the server
          // Re-fetch posts to get properly filtered list
          // Use the latest fetchPosts from closure
          fetchPosts()
          return
        }

        // Check if user is at the top of the page (within 200px)
        const isAtTop = window.scrollY < 200
        
        // Check if this post was already seen when page loaded
        const wasSeen = lastSeenPostIdsRef.current.has(post.id)
        if (wasSeen) {
          return
        }
        
        // Mark as seen
        lastSeenPostIdsRef.current.add(post.id)
        
        if (isAtTop) {
          // User is at top, add post immediately
          setPosts(prev => {
            // Double-check it doesn't exist (prevent duplicates)
            const exists = prev.some(p => p.id === post.id)
            if (exists) {
              return prev
            }
            return [post, ...prev]
          })
        } else {
          // User has scrolled down, show notice
          setNewPosts(prev => {
            // Check if post already exists in new posts
            const exists = prev.some(p => p.id === post.id)
            if (exists) {
              return prev
            }
            // Check if author already exists in new posts (limit to 3 unique authors)
            const authorExists = prev.some(p => p.author.id === post.author.id)
            if (authorExists || prev.length >= 3) {
              return prev
            }
            return [post, ...prev]
          })
          setShowNewPostNotice(true)
        }
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
      // Get current posts from state to avoid closure issues
      const currentPosts = posts
      const commentChannels = currentPosts.map(post => {
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
    }, [parentId, fetchPosts, session?.user?.id, posts])

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

  const handleShowNewPosts = () => {
    // Refresh posts to show new ones at the top
    fetchPosts()
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Clear new posts
    setNewPosts([])
    setShowNewPostNotice(false)
  }

  // Get unique authors from new posts (max 3)
  const newPostAuthors = newPosts
    .map(post => post.author)
    .filter((author, index, self) => 
      index === self.findIndex(a => a.id === author.id)
    )
    .slice(0, 3)

  return (
    <div ref={containerRef}>
      {/* New Post Notice */}
      {showNewPostNotice && newPosts.length > 0 && !parentId && (
        <div className="sticky top-16 z-20 mb-4 px-4 pt-4">
          <button
            onClick={handleShowNewPosts}
            className="w-full bg-primary hover:bg-primary-hover text-white rounded-full py-3 px-4 flex items-center justify-center space-x-3 transition-colors"
          >
            <ChevronUpIcon className="w-5 h-5" />
            {newPostAuthors.length > 0 && (
              <div className="flex items-center -space-x-2">
                {newPostAuthors.map((author, index) => (
                  <Avatar
                    key={author.id}
                    src={author.avatar_url || author.image || undefined}
                    alt={author.name || 'User'}
                    size={24}
                    className="border-2 border-white"
                    style={{ zIndex: 10 - index }}
                  />
                ))}
              </div>
            )}
            <span className="font-semibold">
              {newPosts.length === 1 && newPostAuthors.length > 0
                ? `${newPostAuthors[0]?.name || 'Someone'} posted`
                : `${newPosts.length} new post${newPosts.length > 1 ? 's' : ''}`}
            </span>
          </button>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={fetchPosts} onMentionClick={onMentionClick} />
      ))}
    </div>
  )
}

