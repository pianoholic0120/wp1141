'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
  TrashIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid'
import Avatar from '../common/Avatar'
import ParsedText from '../common/ParsedText'
import { formatRelativeTime } from '@/lib/utils/timeFormat'
import toast from 'react-hot-toast'

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
  replySettings?: string
  visibility?: string
}

interface PostCardProps {
  post: Post
  onUpdate?: () => void
  showComments?: boolean
  onMentionClick?: (userId: string, event: React.MouseEvent) => void
}

export default function PostCard({ post, onUpdate, showComments = false, onMentionClick }: PostCardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLike = async () => {
    if (!session) {
      toast.error('Please login to like posts')
      return
    }

    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1)

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await res.json()
      setIsLiked(data.liked)
      setLikeCount(data.likeCount)
      if (onUpdate) onUpdate()
    } catch (error) {
      setIsLiked(!newLiked)
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1)
      toast.error('Failed to toggle like')
    }
  }

  const handleRepost = async () => {
    if (!session) {
      toast.error('Please login to repost')
      return
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/repost`, {
        method: 'POST'
      })

      if (!res.ok) {
        throw new Error('Failed to repost')
      }

      const data = await res.json()
      if (onUpdate) onUpdate()
      toast.success(data.reposted ? 'Reposted!' : 'Unreposted')
    } catch (error) {
      toast.error('Failed to repost')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete post')
      }

      toast.success('Post deleted')
      if (onUpdate) onUpdate()
    } catch (error) {
      toast.error('Failed to delete post')
      setIsDeleting(false)
    }
  }

  const handleComment = () => {
    router.push(`/post/${post.id}`)
  }

  const handlePostClick = () => {
    router.push(`/post/${post.id}`)
  }

  const displayPost = post.originalPost || post
  const author = displayPost.author

  const isOwnPost = session?.user?.id === post.author.id && !post.is_repost

  // Check if current user can reply
  // Note: Full permission check is done on the server side
  // This is just for UI display purposes - we show the button if user is logged in
  // Server will do the actual validation (check follow relationship, mention, etc.)
  const canReply = () => {
    if (!session?.user) return false
    if (isOwnPost) return true // Post author can always reply
    
    const settings = post.replySettings || 'everyone'
    if (settings === 'everyone') return true
    
    // For 'followers' and 'mentioned', we show the button if user is logged in
    // Server will validate the actual permission
    return true
  }

  const userCanReply = canReply()

  return (
    <div className="border-b border-border p-4 hover:bg-gray-950 transition-colors">
      {/* Repost indicator */}
      {post.is_repost && post.originalPost && (
        <div className="text-sm text-gray-500 mb-2 flex items-center space-x-2">
          <ArrowPathIcon className="w-4 h-4" />
          <span>{post.author.name} reposted</span>
        </div>
      )}

      <div className="flex space-x-3">
        <Avatar
          src={author.avatar_url || author.image || undefined}
          alt={author.name || 'User'}
          size={48}
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span
              className="font-semibold hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/profile/${author.user_id}`)
              }}
            >
              {author.name || 'Anonymous'}
            </span>
            <span
              className="text-gray-500 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/profile/${author.user_id}`)
              }}
            >
              @{author.user_id || 'user'}
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm">
              {formatRelativeTime(post.createdAt)}
            </span>
            {isOwnPost && (
              <div className="relative ml-auto" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-gray-800"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleDelete()
                      }}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left hover:bg-gray-900 flex items-center space-x-2 text-red-500"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clickable post content area */}
          <div 
            onClick={(e) => {
              // Only navigate if clicking on text, not on links/mentions/hashtags
              const target = e.target as HTMLElement
              if (target.tagName === 'A' || target.closest('a') || target.closest('[role="button"]')) {
                return
              }
              handlePostClick()
            }}
            className="mb-3 cursor-pointer"
          >
            <ParsedText text={displayPost.content} onMentionClick={onMentionClick} />
          </div>

          {/* Interaction buttons - prevent navigation when clicking buttons */}
          <div 
            className="flex items-center space-x-8 text-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Comment */}
            {userCanReply || isOwnPost ? (
              <button
                onClick={handleComment}
                className="flex items-center space-x-2 hover:text-primary transition-colors"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span>{post.commentCount}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600 cursor-not-allowed" title="You can't reply to this post">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span>{post.commentCount}</span>
              </div>
            )}

            {/* Repost */}
            <button
              onClick={handleRepost}
              className="flex items-center space-x-2 hover:text-green-500 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span>{post.repostCount}</span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-5 h-5" />
              ) : (
                <HeartIcon className="w-5 h-5" />
              )}
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

