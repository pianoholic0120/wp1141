'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher-client'
import Avatar from '../common/Avatar'
import { ChevronUpIcon } from '@heroicons/react/24/outline'

interface NewPostAuthor {
  id: string
  user_id: string | null
  name: string | null
  avatar_url: string | null
  image: string | null
}

interface NewPostNoticeProps {
  onRefresh: () => void
}

export default function NewPostNotice({ onRefresh }: NewPostNoticeProps) {
  const { data: session } = useSession()
  const [newAuthors, setNewAuthors] = useState<NewPostAuthor[]>([])
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(new Set())
  const followingUserIds = useRef<Set<string>>(new Set())
  const lastSeenTimestamp = useRef<number>(Date.now())

  // Fetch list of users we follow and check for new posts
  useEffect(() => {
    if (!session?.user?.user_id) return

    const fetchFollowing = async () => {
      try {
        const res = await fetch(`/api/users/${session.user.user_id}/following`)
        if (!res.ok) return
        
        const following = await res.json()
        followingUserIds.current = new Set(following.map((u: any) => u.id))
        
        // After getting following list, check for new posts from followed users
        // Check posts from the last 5 minutes to catch posts made while user was offline
        if (followingUserIds.current.size > 0) {
          try {
            const postsRes = await fetch('/api/posts?filter=following')
            if (postsRes.ok) {
              const posts = await postsRes.json()
              const now = Date.now()
              const fiveMinutesAgo = now - 5 * 60 * 1000
              
              // Find posts from followed users created in the last 5 minutes
              const recentPosts = posts.filter((post: any) => {
                if (!post.author || !followingUserIds.current.has(post.author.id)) {
                  return false
                }
                if (post.parentPostId) {
                  return false // Skip comments/replies
                }
                const postTime = new Date(post.createdAt).getTime()
                return postTime > fiveMinutesAgo && postTime <= now
              })
              
              if (recentPosts.length > 0) {
                // Add authors to new authors list
                const authors = recentPosts
                  .map((post: any) => post.author)
                  .filter((author: any, index: number, self: any[]) => 
                    self.findIndex((a: any) => a.id === author.id) === index
                  )
                  .slice(0, 3)
                
                if (authors.length > 0) {
                  setNewAuthors(prev => {
                    const existingIds = new Set(prev.map(a => a.id))
                    const newAuthors = authors.filter((a: any) => !existingIds.has(a.id))
                    return [...newAuthors, ...prev].slice(0, 3)
                  })
                  
                  // Mark these posts as seen
                  setSeenPostIds(prev => {
                    const newSet = new Set(prev)
                    recentPosts.forEach((post: any) => newSet.add(post.id))
                    return newSet
                  })
                }
              }
            }
          } catch (error) {
            console.error('Error checking for new posts:', error)
          }
        }
      } catch (error) {
        console.error('Error fetching following list:', error)
      }
    }

    fetchFollowing()
    
    // Refresh following list periodically in case user follows/unfollows
    const interval = setInterval(fetchFollowing, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [session?.user?.user_id])

  useEffect(() => {
    if (!session?.user?.id || typeof window === 'undefined') return

    const pusherClient = getPusherClient()
    if (!pusherClient) return

    // Subscribe to all posts channel to detect new posts from followed users
    const channel = pusherClient.subscribe('posts')

    const handleNewPost = (data: { post: any }) => {
      const post = data.post
      
      // Skip if we've already seen this post
      if (seenPostIds.has(post.id)) {
        return
      }

      // Check if this post is from someone we follow
      if (post.author && followingUserIds.current.has(post.author.id)) {
        // Skip comments/replies (posts with parentPostId)
        if (post.parentPostId) {
          return // Don't show notice for comments/replies
        }
        
        // Add to seen posts
        setSeenPostIds(prev => new Set([...prev, post.id]))

        // Add author to new authors list (if not already there)
        setNewAuthors(prev => {
          // Check if author already exists
          const exists = prev.some(a => a.id === post.author.id)
          if (exists) {
            return prev
          }
          // Add new author, keep only first 3
          return [post.author, ...prev].slice(0, 3)
        })
      }
    }

    channel.bind('new-post', handleNewPost)

    // Also listen for repost events
    const handleRepost = async (data: { postId: string, userId: string, repostCount: number }) => {
      // userId here is the reposter's internal id
      if (followingUserIds.current.has(data.userId)) {
        // Fetch user info by internal id
        try {
          const userRes = await fetch(`/api/users/by-id/${data.userId}`)
          if (!userRes.ok) return
          
          const userData = await userRes.json()
          
          // Add author to new authors list (if not already there)
          if (userData) {
            setNewAuthors(prev => {
              const exists = prev.some(a => a.id === userData.id)
              if (exists) {
                return prev
              }
              return [userData, ...prev].slice(0, 3)
            })
          }
        } catch (error) {
          console.error('Error fetching user data for repost:', error)
        }
      }
    }

    // Subscribe to reposts channel for repost events
    const repostChannel = pusherClient.subscribe('reposts')
    repostChannel.bind('repost-added', handleRepost)

    return () => {
      channel.unbind('new-post', handleNewPost)
      repostChannel.unbind('repost-added', handleRepost)
      pusherClient.unsubscribe('reposts')
    }
  }, [session?.user?.id, seenPostIds])

  const handleClick = () => {
    // Refresh posts and clear notice
    onRefresh()
    setNewAuthors([])
    setSeenPostIds(new Set())
    lastSeenTimestamp.current = Date.now()
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (newAuthors.length === 0) {
    return null
  }

  return (
    <div className="w-full flex justify-center py-2">
      <button
        onClick={handleClick}
        className="bg-primary hover:bg-primary-hover text-white py-2 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-full"
      >
        <ChevronUpIcon className="w-5 h-5 flex-shrink-0" />
        <div className="flex items-center -space-x-2">
          {newAuthors.map((author, index) => (
            <div
              key={author.id}
              className="border-2 border-white rounded-full overflow-hidden"
              style={{ zIndex: newAuthors.length - index }}
            >
              <Avatar
                src={author.avatar_url || author.image || undefined}
                alt={author.name || 'User'}
                size={32}
              />
            </div>
          ))}
        </div>
        <span className="font-semibold whitespace-nowrap">posted</span>
      </button>
    </div>
  )
}

