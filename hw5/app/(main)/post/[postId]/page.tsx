'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import PostCard from '@/components/post/PostCard'
import PostList from '@/components/post/PostList'
import InlinePostComposer from '@/components/post/InlinePostComposer'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) throw new Error('Failed to fetch post')
      const data = await res.json()
      setPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
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

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Post not found</div>
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
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      {/* Main Post */}
      <PostCard
        post={post}
        onUpdate={() => {
          fetchPost()
          setRefreshKey(prev => prev + 1)
        }}
      />

      {/* Comment Composer */}
      <InlinePostComposer
        parentPostId={postId}
        placeholder="Post your reply"
        onSuccess={() => {
          setRefreshKey(prev => prev + 1)
          fetchPost() // Refresh main post to update comment count
        }}
      />

      {/* Comments */}
      <PostList key={refreshKey} parentId={postId} />
    </div>
  )
}

