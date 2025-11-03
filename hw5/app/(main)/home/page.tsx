'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PostList from '@/components/post/PostList'
import PostModal from '@/components/post/PostModal'
import InlinePostComposer from '@/components/post/InlinePostComposer'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'following'>('all')
  const [showPostModal, setShowPostModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (searchParams.get('post') === 'true') {
      setShowPostModal(true)
      router.replace('/home', { scroll: false })
    }
  }, [searchParams, router])

  return (
    <div className="max-w-2xl mx-auto border-x border-border min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border p-4">
        <h1 className="text-xl font-bold">Home</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('following')}
          className={`flex-1 py-4 text-center font-semibold border-b-2 transition-colors ${
            filter === 'following'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Following
        </button>
      </div>

      {/* Inline Post Composer */}
      <InlinePostComposer
        onSuccess={() => {
          setRefreshKey(prev => prev + 1)
        }}
      />

      {/* Post List */}
      <div key={refreshKey}>
        <PostList filter={filter} />
      </div>

      {/* Post Modal */}
      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={() => {
          setShowPostModal(false)
          setRefreshKey(prev => prev + 1)
        }}
      />
    </div>
  )
}

